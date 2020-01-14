export interface GitDiffParserResult {
  detailed: boolean;
  commits: GitDiffParserCommit[];
}

export interface GitDiffParserCommit {
  files: GitDiffParserFile[];
}

export interface GitDiffParserFile {
  deleted: boolean;
  added: boolean;
  renamed: boolean;
  binary: boolean;
  lines: GitDiffParserLine[];
  index: string[];
  name: string;
}

export interface GitDiffParserLine {
  type: string;
  break: boolean;
  text: string;
  ln1: number;
  ln2: number;
}
