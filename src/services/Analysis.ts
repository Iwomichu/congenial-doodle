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
import {
  knownLanguages,
  keywordResolvers,
  knownExtensions,
} from '../languages/knownLanguages';
import SimpleFile from '../models/SimpleFile';

const jsx = require('acorn-jsx');
const jsParser = Parser.extend(jsx());
const gitParser = require('git-diff-parser');
const acornWalk = require('acorn-walk');

type CommitPair = [Commit, Commit];
type CommitFiles = SimpleFile[];
type Author = GitHubUser;
type CommitPairDifferenceFiles = [CommitFiles, CommitFiles];
type RepositoryFileContents = CommitPairDifferenceFiles[];
type ParseResult = { pair: CommitPair; result: any };
type FileExtension = string;
type TreesPair = { before: acorn.Node[]; after: acorn.Node[] };
type GitDiffParserResultPairWithTrees = [GitDiffParserResult, TreesPair];

type LblLibrary = string;
type TokenHistoryLibrary = string;
type CommittedFileLibrary = string;

type SmallRepositoryLibrariesResults = {
  lbl: LblLibrary[];
  tree: any[];
  tokenHistory: TokenHistoryLibrary[];
};
type BigRepositoryLibrariesResults = { committed: CommittedFileLibrary[] };
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
    return results;
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
    const count = await RESTAPI.getCommitPageLength(
      repository.path,
      Math.round(
        Number.parseInt(process.env.GITHUB_BIG_REPOSITORY_TRESHOLD ?? '1000') /
          30,
      ),
    );
    if (count == 0) {
      result = await this.analizeSmallRepository(
        author,
        repository,
        targetedFileExtensions,
      );
    } else {
      result = await this.analizeBigRepository(author, targetedFileExtensions);
    }

    return result;
  }

  public static async analizeBigRepository(
    author: Author,
    targetedFileExtensions: FileExtension[],
  ) {
    const commits: any[] = [];
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
    repository: Repository,
    targetedFileExtensions: FileExtension[],
  ): Promise<SmallRepositoryLibrariesResults> {
    let repositoryGitInstance: RepositoryGitInstance;
    let result: SmallRepositoryLibrariesResults = {
      lbl: [],
      tokenHistory: [],
      tree: [],
    };
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
      const commitPairs: CommitPair[] = this.reduceCommits(author, commits);
      const gitDiffResults: string[] = await Promise.all(
        commitPairs.map(pair =>
          this.getDiffOfPair(repositoryGitInstance, pair),
        ),
      );
      const zippedParseResults: ParseResult[] = zip(commitPairs, gitDiffResults)
        .filter(zipped => zipped[1] !== null)
        .map(zipped => {
          return { pair: zipped[0], result: gitParser(zipped[1]) };
        });
      const filesPairs: CommitPairDifferenceFiles[] = await Promise.all(
        zippedParseResults.map(tuple => {
          return this.getFileContentsFromParseResult(
            repositoryGitInstance,
            tuple.result,
            tuple.pair,
            targetedFileExtensions,
          );
        }),
      );
      let treeResult: any[] = [];
      try {
        treeResult = this.getTreeDiffNodes(zippedParseResults, filesPairs);
      } catch (err) {
        console.error('Tree parsing error: ', err);
      }
      let lineByLineResult: LblLibrary[] = [];
      try {
        lineByLineResult = filesPairs
          .map(pair => pair[1].map(file => this.getUsedLibraries(file)).flat())
          .flat();
      } catch (err) {
        console.error('Line-by-line analysis error: ', err);
      }
      let tokenHistoryResult: TokenHistoryLibrary[] = [];
      result = {
        tree: treeResult,
        lbl: lineByLineResult,
        tokenHistory: tokenHistoryResult,
      };
    } catch (err) {
      console.error(err);
    } finally {
      repositoryGitInstance.remove();
      return result;
    }
  }

  public static getTreeDiffNodes(
    zippedParseResults: ParseResult[],
    filesPairs: CommitPairDifferenceFiles[],
  ) {
    const trees: TreesPair[] = filesPairs.map(pair => {
      return {
        before: pair[0].map(file =>
          jsParser.parse(file.content, {
            sourceType: 'module',
            allowReserved: true,
            locations: true,
          }),
        ),
        after: pair[1].map(content =>
          jsParser.parse(content.content, {
            sourceType: 'module',
            allowReserved: true,
            locations: true,
          }),
        ),
      };
    });
    const diffsWithTrees = zippedParseResults.map(
      (elem, index) =>
        [elem.result, trees[index]] as GitDiffParserResultPairWithTrees,
    );
    return diffsWithTrees.map(this.mapDiffToNodes);
  }

  public static getDiffOfPair(
    repositoryGitInstance: RepositoryGitInstance,
    [before, after]: CommitPair,
  ): Promise<string> {
    return repositoryGitInstance.diff(before, after);
  }

  public static reduceCommits(author: Author, commits: Commit[]): CommitPair[] {
    function checkName(author: Author, author_name: string) {
      return (
        author_name === author.email ||
        author_name === author.login ||
        author_name === author.name
      );
    }
    commits = commits.reverse();
    let isSkipping = false;
    const commitPairs: CommitPair[] = [];
    let currentStart = commits[0];
    let currentStop = commits[0];
    commits.slice(1).forEach((commit: Commit, index: number) => {
      if (checkName(author, commit.author_name)) {
        currentStop = commit;
      } else {
        if (!isSkipping) commitPairs.push([currentStart, currentStop]);
        currentStart = commit;
        isSkipping = true;
      }
    });
    const lastCommit = commits.pop();
    if (lastCommit && checkName(author, lastCommit.author_name))
      commitPairs.push([currentStart, lastCommit]);
    return commitPairs;
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
          return null;
        if (ignoredFileFlags.added && file.added) return null;
        if (ignoredFileFlags.binary && file.binary) return null;
        if (ignoredFileFlags.deleted && file.deleted) return null;
        if (ignoredFileFlags.renamed && file.renamed) return null;
        else return <SimpleFile>await new Promise((resolve, reject) => {
            fs.readFile(path.join(repository.path, file.name), (err, data) => {
              if (err) reject(err);
              else
                resolve(new SimpleFile(file.name, file.path, data.toString()));
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
  ): Promise<CommitPairDifferenceFiles> {
    try {
      await repositoryGitInstance.checkout(before.hash);
      const filesBefore: (SimpleFile | null)[] = await Promise.all(
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
      const filesAfter: (SimpleFile | null)[] = await Promise.all(
        await parseResult.commits.map(c =>
          this.getFileContentsFromCommit(
            c,
            repositoryGitInstance,
            { deleted: true, binary: true },
            targetedFileExtensions,
          ),
        )[0],
      );
      return [filesBefore.filter(notEmpty), filesAfter.filter(notEmpty)];
    } catch (err) {
      console.error(err);
      return [[], []];
    }
  }

  public static mapDiffToNodes(pair: GitDiffParserResultPairWithTrees) {
    return pair[0].commits[0].files.map((file, index) =>
      file.lines.map(line =>
        acornWalk.findNodeAround(pair[1].after[index], line.ln2),
      ),
    );
  }

  public static getUsedLibraries(file: SimpleFile) {
    const extension = file.name.split('.').pop() || ''; //get that from languages
    const language = knownExtensions.get(extension.toLowerCase());
    if (!language) return [];
    else {
      return language.resolveExternalDependencies(file.content.split('\n'));
    }
  }
}

type Zip<T extends unknown[][]> = {
  [I in keyof T]: T[I] extends (infer U)[] ? U : never;
}[];
function zip<T extends unknown[][]>(...args: T): Zip<T> {
  return <Zip<T>>(<unknown>args[0].map((_, c) => args.map(row => row[c])));
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
