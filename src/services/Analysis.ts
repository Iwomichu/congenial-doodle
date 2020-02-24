import { Repository } from '../models/Repository';
import { API as GQLAPI, API } from '../api/GraphQLAPI';
import { API as RESTAPI } from '../api/RestAPI';
import Utils from './Utils';
import { FileExtension, Author, BigRepositoryLibrariesResults } from './Types';
import { SmallRepositoryAnalysis } from './SmallRepositoryAnalysis';
import LineByLineAnalysis from './LineByLineAnalysis';
import BigRepositoryAnalysis from './BigRepositoryAnalysis';

export default class Analysis {
  public static async analizeAuthor(
    requestAuthor: any,
    targetedFileExtensions: FileExtension[],
  ): Promise<any> {
    const author: Author = await this.resolveAuthor(requestAuthor);
    const ownedRepositories: Repository[] = await GQLAPI.getOwnedRepositories({
      contributor: author.login,
      limit: 10,
    });
    const contributedRepositories = await GQLAPI.getContributedRepositories({
      contributor: author.login,
      limit: 10,
    });
    const repositories = [...ownedRepositories, ...contributedRepositories];
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
    console.log(`[START] Analysing ${repository.path} repository`);
    let result: any = [];
    let count = 0;
    try {
      count = await RESTAPI.getCommitPageLength(
        repository.path,
        Math.round(
          Number.parseInt(
            process.env.GITHUB_BIG_REPOSITORY_TRESHOLD ?? '1000',
          ) / 30,
        ),
      );
    } catch (err) {
      console.error('Repository commits fetching error: ', err);
      return result;
    }
    if (count == 0) {
      result = await SmallRepositoryAnalysis.analizeSmallRepository(
        author,
        repository,
        targetedFileExtensions,
      );
    } else {
      result = await BigRepositoryAnalysis.analizeBigRepository(
        author,
        repository,
        targetedFileExtensions,
      );
    }
    console.log(`[END] Analysed ${repository.path} repository`);
    return result;
  }
}
