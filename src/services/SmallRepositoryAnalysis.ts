import {
  Author,
  FileExtension,
  SmallRepositoryLibrariesResults,
  CommitPair,
  ParseResult,
  CommitPairDifferenceFiles,
  LblLibrary,
  TokenHistoryLibrary,
  IgnoredFileFlags,
} from './Types';

import { Repository } from '../models/Repository';

import RepositoryGitInstance from '../models/RepositoryGitInstance';

import { Commit } from '../models/git/Commit';

import Utils from './Utils';

import TreeAnalysis from './TreeAnalysis';
import {
  GitDiffParserCommit,
  GitDiffParserResult,
} from '../models/GitDiffParser';
import SimpleFile from '../models/SimpleFile';
import { readFile } from 'fs';
import { join } from 'path';
import LineByLineAnalysis from './LineByLineAnalysis';

const gitParser = require('git-diff-parser');

export class SmallRepositoryAnalysis {
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
      const zippedParseResults: ParseResult[] = Utils.zip(
        commitPairs,
        gitDiffResults,
      )
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
        treeResult = TreeAnalysis.getTreeDiffNodes(
          zippedParseResults,
          filesPairs,
        );
      } catch (err) {
        console.error('Tree parsing error: ', err);
      }
      let lineByLineResult: LblLibrary[] = [];
      try {
        lineByLineResult = filesPairs
          .map(pair =>
            pair[1]
              .map(file => LineByLineAnalysis.getUsedLibraries(file))
              .flat(),
          )
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
      // const libsCounted = Object.fromEntries(Utils.getWordCount(lineByLineResult));
    } catch (err) {
      console.error(err);
    } finally {
      repositoryGitInstance.remove();
      return result;
    }
  }

  public static getDiffOfPair(
    repositoryGitInstance: RepositoryGitInstance,
    pair: CommitPair,
  ): Promise<string> {
    return repositoryGitInstance.diff(pair[0], pair[1]);
  }

  public static reduceCommits(author: Author, commits: Commit[]): CommitPair[] {
    function checkName(author: Author, author_name: string) {
      return (
        author_name.localeCompare(author.email, 'en', {
          sensitivity: 'base',
        }) == 0 ||
        author_name.localeCompare(author.login, 'en', {
          sensitivity: 'base',
        }) == 0 ||
        author_name.localeCompare(author.name, 'en', { sensitivity: 'base' }) ==
          0
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
        isSkipping = false;
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
            readFile(join(repository.path, file.name), (err, data) => {
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
      return [
        filesBefore.filter(Utils.notEmpty),
        filesAfter.filter(Utils.notEmpty),
      ];
    } catch (err) {
      console.error(err);
      return [[], []];
    }
  }
}
