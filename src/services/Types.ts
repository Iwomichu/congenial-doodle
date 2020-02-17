import { Commit } from '../models/git/Commit';
import {
  GitDiffParserResult,
  GitDiffParserCommit,
} from '../models/GitDiffParser';
import GitHubUser from '../models/GitHubUser';
import SimpleFile from '../models/SimpleFile';

export type CommitPair = [Commit, Commit];
export type CommitFiles = SimpleFile[];
export type Author = GitHubUser;
export type CommitPairDifferenceFiles = [CommitFiles, CommitFiles];
export type RepositoryFileContents = CommitPairDifferenceFiles[];
export type ParseResult = { pair: CommitPair; result: any };
export type FileExtension = string;
export type TreesPair = { before: acorn.Node[]; after: acorn.Node[] };
export type GitDiffParserResultPairWithTrees = [GitDiffParserResult, TreesPair];

export type LblLibrary = string;
export type TokenHistoryLibrary = string;
export type CommittedFileLibrary = string;

export type SmallRepositoryLibrariesResults = {
  lbl: LblLibrary[];
  tree: any[];
  tokenHistory: TokenHistoryLibrary[];
};
export type BigRepositoryLibrariesResults = {
  committed: CommittedFileLibrary[];
};
export interface IgnoredFileFlags {
  deleted?: boolean;
  added?: boolean;
  renamed?: boolean;
  binary?: boolean;
}
