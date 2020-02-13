import { Repository } from '../models/Repository';
import { Commit } from '../models/git/Commit';
import {
  GitDiffParserResult,
  GitDiffParserCommit,
} from '../models/GitDiffParser';
import RepositoryGitInstance from '../models/RepositoryGitInstance';
import fs from 'fs';
import path from 'path';
import { API as GQLAPI, API } from '../api/GraphQLAPI';
import { API as RESTAPI } from '../api/RestAPI';
import { parse as parseToAST } from 'acorn';
import GitHubUser from '../models/GitHubUser';
import { Parser } from 'acorn';

const jsx = require('acorn-jsx');
const jsParser = Parser.extend(jsx());
const gitParser = require('git-diff-parser');

type CommitPair = [Commit, Commit];
type FileContent = string;
type CommitFilesContent = FileContent[];
type Author = GitHubUser;
type CommitPairDifferenceFileContents = [
  CommitFilesContent,
  CommitFilesContent,
];
type RepositoryFileContents = CommitPairDifferenceFileContents[];
type FileExtension = string;
type TreesPair = { before: acorn.Node[]; after: acorn.Node[] };
type GitDiffParserResultPairWithTrees = [GitDiffParserResult, TreesPair];

interface IgnoredFileFlags {
  deleted?: boolean;
  added?: boolean;
  renamed?: boolean;
  binary?: boolean;
}

export default class Analysis {
  public static async analizeAuthor(
    requestAuthor: any,
    targetedFileExtensions: FileExtension[],
  ): Promise<any> {
    const author: Author = await this.resolveAuthor(requestAuthor);
    const repositories: Repository[] = await GQLAPI.getContributedRepositories({
      contributor: author.login,
      limit: 10,
    });
    const results = await Promise.all(
      repositories.map(repository =>
        this.analizeRepository(author, repository, targetedFileExtensions),
      ),
    );
    return results.filter(res => res.length > 0);
  }

  public static async resolveAuthor(requestAuthor: any): Promise<Author> {
    return await API.getUser({ login: requestAuthor });
  }

  public static async analizeRepository(
    author: Author,
    repository: Repository,
    targetedFileExtensions: FileExtension[],
  ): Promise<any> {
    let result: any = [];
    let repositoryGitInstance: RepositoryGitInstance;
    try {
      repositoryGitInstance = await RepositoryGitInstance.fromRepository(
        repository,
      );
    } catch (err) {
      console.error(err);
      return result;
    }
    try {
      const commits: Commit[] = await repositoryGitInstance.getCommits();
      result = await this.analizeSmallRepository(
        author,
        repositoryGitInstance,
        commits,
        targetedFileExtensions,
      );
      // if (commits.length < (process.env.GITHUB_BIG_REPOSITORY_TRESHOLD ?? 100))
      //   result = await this.analizeSmallRepository(
      //     author,
      //     repositoryGitInstance,
      //     commits,
      //     targetedFileExtensions,
      //   );
      // else
      //   result = await this.analizeBigRepository(
      //     author,
      //     repositoryGitInstance,
      //     commits,
      //     targetedFileExtensions,
      //   );
    } catch (err) {
      console.error(err);
    } finally {
      repositoryGitInstance.remove();
      return result;
    }
  }

  public static async analizeBigRepository(
    author: Author,
    repositoryGitInstance: RepositoryGitInstance,
    commits: Commit[],
    targetedFileExtensions: FileExtension[],
  ) {
    const filteredCommits = commits.filter(
      commit => commit.author_name === author.name,
    );
    const files = await RESTAPI.getFiles(
      filteredCommits,
      targetedFileExtensions,
    );
    return files;
  }

  public static async analizeSmallRepository(
    author: Author,
    repositoryGitInstance: RepositoryGitInstance,
    commits: Commit[],
    targetedFileExtensions: FileExtension[],
  ) {
    const commitPairs: CommitPair[] = this.reduceAuthorCommits(author, commits);
    const gitDiffResults: string[] = await Promise.all(
      commitPairs.map(pair => this.getDiffOfPair(repositoryGitInstance, pair)),
    );
    const zippedParseResults = zip(commitPairs, gitDiffResults)
      .filter(zipped => zipped[1] !== null)
      .map(zipped => {
        return { pair: zipped[0], result: gitParser(zipped[1]) };
      });
    const fileContents = await Promise.all(
      zippedParseResults.map(tuple => {
        return this.getFileContentsFromParseResult(
          repositoryGitInstance,
          tuple.result,
          tuple.pair,
          targetedFileExtensions,
        );
      }),
    );
    const trees: TreesPair[] = fileContents.map(pair => {
      return {
        before: pair[0].map(content =>
          jsParser.parse(content, {
            sourceType: 'module',
            allowReserved: true,
            locations: true,
          }),
        ),
        after: pair[1].map(content =>
          jsParser.parse(content, {
            sourceType: 'module',
            allowReserved: true,
            locations: true,
          }),
        ),
      };
    });
    return zippedParseResults.map(
      (elem, index) =>
        [elem.result, trees[index]] as GitDiffParserResultPairWithTrees,
    );
  }

  public static getDiffOfPair(
    repositoryGitInstance: RepositoryGitInstance,
    [before, after]: CommitPair,
  ): Promise<string> {
    return repositoryGitInstance.diff(before, after);
  }

  public static reduceAuthorCommits(
    author: Author,
    commits: Commit[],
  ): CommitPair[] {
    // commity posortowane od NAJNOWSZEGO, odwracam sortowanie
    commits = commits.reverse();
    const range = [...Array(commits.length).keys()].slice(1);
    const userCommitsIndices = range.filter(
      index =>
        commits[index].author_name == author.name ||
        commits[index - 1].author_name == author.name,
    );
    if (userCommitsIndices.length == 0) return [];
    if (userCommitsIndices.length == 1) return [];
    const userCommitsPaired = userCommitsIndices
      .map(index => [commits[index - 1], commits[index]])
      .filter(pair => pair[1].author_name == author.name);
    const output: CommitPair[] = [];
    let current = userCommitsPaired[0];
    userCommitsPaired.slice(1).forEach(pair => {
      if (pair[0] == current[1]) current[1] = pair[1];
      else {
        output.push([current[0], current[1]]);
        current = pair;
      }
    });
    output.push([current[0], current[1]]);
    return output;
  }

  public static async getFileContentsFromCommit(
    commit: GitDiffParserCommit,
    repository: RepositoryGitInstance,
    ignoredFileFlags: IgnoredFileFlags,
    targetedFileExtensions: FileExtension[],
  ) {
    return await Promise.all(
      commit.files.map(async file => {
        if (!targetedFileExtensions.includes(file.name.split('.').pop() || ''))
          return '';
        if (ignoredFileFlags.added && file.added) return '';
        if (ignoredFileFlags.binary && file.binary) return '';
        if (ignoredFileFlags.deleted && file.deleted) return '';
        if (ignoredFileFlags.renamed && file.renamed) return '';
        else return <string>await new Promise((resolve, reject) => {
            fs.readFile(path.join(repository.path, file.name), (err, data) => {
              if (err) reject(err);
              else resolve(data.toString());
            });
          });
      }),
    );
  }

  public static async getFileContentsFromParseResult(
    repositoryGitInstance: RepositoryGitInstance,
    parseResult: GitDiffParserResult,
    [before, after]: CommitPair,
    targetedFileExtensions: FileExtension[],
  ): Promise<CommitPairDifferenceFileContents> {
    try {
      await repositoryGitInstance.checkout(before.hash);
      const filesBefore: string[] = await Promise.all(
        await parseResult.commits.map(c =>
          this.getFileContentsFromCommit(
            c,
            repositoryGitInstance,
            {
              added: true,
              renamed: true,
              binary: true,
            },
            targetedFileExtensions,
          ),
        )[0],
      );
      await repositoryGitInstance.checkout(after.hash);
      const filesAfter: string[] = await Promise.all(
        await parseResult.commits.map(c =>
          this.getFileContentsFromCommit(
            c,
            repositoryGitInstance,
            { deleted: true, binary: true },
            targetedFileExtensions,
          ),
        )[0],
      );
      return [filesBefore.filter(Boolean), filesAfter.filter(Boolean)];
    } catch (err) {
      console.error(err);
      return [[], []];
    }
  }
}

type Zip<T extends unknown[][]> = {
  [I in keyof T]: T[I] extends (infer U)[] ? U : never;
}[];
function zip<T extends unknown[][]>(...args: T): Zip<T> {
  return <Zip<T>>(<unknown>args[0].map((_, c) => args.map(row => row[c])));
}
