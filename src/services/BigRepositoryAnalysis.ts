import { Author, FileExtension, BigRepositoryLibrariesResults } from './Types';

import { Repository } from '../models/Repository';

import LineByLineAnalysis from './LineByLineAnalysis';

import Utils from './Utils';
import { API } from '../api/RestAPI';

export default class BigRepositoryAnalysis {
  public static async analizeBigRepository(
    author: Author,
    repository: Repository,
    targetedFileExtensions: FileExtension[],
  ): Promise<BigRepositoryLibrariesResults> {
    const commits = await API.searchCommits({
      author: author.login,
      repositoryPaths: [repository.path],
      merge: false,
    });
    const files = await API.getFiles(commits, targetedFileExtensions);
    const output = files
      .map(LineByLineAnalysis.getUsedLibraries)
      .flat()
      .filter(Utils.onlyUnique);
    return { committed: output };
  }
}
