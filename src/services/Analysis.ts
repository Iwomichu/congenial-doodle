import { Repository } from '../models/Repository';
import { Commit } from '../models/git/Commit';
import Utils from './Utils';
import {
  GitDiffParserResult,
  GitDiffParserCommit,
} from '../models/GitDiffParser';
import RepositoryGitInstance from '../models/RepositoryGitInstance';
import fs from 'fs';
import path from 'path';
import { API } from '../api/GraphQLAPI';

const gitParser = require('git-diff-parser');

type CommitPair = [Commit, Commit];
type FileContent = string;
type Author = string;
type CommitPairDifferenceFileContents = string[][];
type RepositoryFileContents = CommitPairDifferenceFileContents[];
type FileExtension = string;

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
  ): Promise<RepositoryFileContents[]> {
    const author: Author = this.parseAuthor(requestAuthor);
    const repositories: Repository[] = await API.getContributedRepositories({
      contributor: author,
      limit: 10,
    });
    const results = await Promise.all(
      repositories.map(repository =>
        this.analizeRepository(author, repository, targetedFileExtensions),
      ),
    );
    return results;
  }
  public static async analizeRepository(
    author: string,
    repository: Repository,
    targetedFileExtensions: FileExtension[],
  ): Promise<string[][][]> {
    let result: RepositoryFileContents = [];
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
      const commitPairs: CommitPair[] = this.reduceAuthorCommits(
        author,
        commits,
      );

      // diff
      const gitDiffResults: string[] = await Promise.all(
        commitPairs.map(pair =>
          this.getDiffOfPair(repositoryGitInstance, pair),
        ),
      );
      const diffParseResults: GitDiffParserResult[] = gitDiffResults.map(
        gitParser,
      );
      // ast
      result = await Promise.all(
        diffParseResults.map((parseResult, index) =>
          this.getFileContentsFromParseResult(
            repositoryGitInstance,
            parseResult,
            commitPairs[index],
            targetedFileExtensions,
          ),
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      repositoryGitInstance.remove();
      return result;
    }
    // const AstTrees: any = fileContents.map();
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
        commits[index].author_name == author ||
        commits[index - 1].author_name == author,
    );
    if (userCommitsIndices.length == 0) return [];
    if (userCommitsIndices.length == 1) return [];
    const userCommitsPaired = userCommitsIndices
      .map(index => [commits[index - 1], commits[index]])
      .filter(pair => pair[1].author_name == author);
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

  public static parseAuthor(requestAuthor: any): Author {
    return requestAuthor;
  }

  public static async getFileContents(
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
          this.getFileContents(
            c,
            repositoryGitInstance,
            {
              added: true,
              renamed: true,
            },
            targetedFileExtensions,
          ),
        )[0],
      );
      await repositoryGitInstance.checkout(after.hash);
      const filesAfter: string[] = await Promise.all(
        await parseResult.commits.map(c =>
          this.getFileContents(
            c,
            repositoryGitInstance,
            { deleted: true },
            targetedFileExtensions,
          ),
        )[0],
      );
      return [filesBefore, filesAfter];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  public static getDiffOfPair(
    repositoryGitInstance: RepositoryGitInstance,
    [before, after]: CommitPair,
  ): Promise<string> {
    return repositoryGitInstance.diff(before, after);
  }
}
