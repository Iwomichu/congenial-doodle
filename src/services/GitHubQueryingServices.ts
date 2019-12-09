import request from 'request-promise';
import { Dependency } from '../models/userScan/NodeRepository';
import { NpmResponse } from '../models/userScan/NpmResponse';
import { API as GQLAPI } from '../api/GraphQLAPI';
import { API } from '../api/RestAPI';
import { Repository } from '../models/Repository';
import { Commit } from '../models/userScan/Commit';

import { javaScript } from '../languages/JavaScript';
import { knownLanguages, keywordResolvers } from '../languages/knownLanguages';

export class GitHubQueryingServices {
  // too long name
  static async fetchKeywordFromDependency(
    dependency: Dependency,
  ): Promise<string[]> {
    const start = process.hrtime();
    console.info(`${dependency.name} - start: %ds`, start[0]);
    return new Promise(async (resolve: any, reject: any) => {
      let responseJSON = JSON.parse(
        await request(`https://registry.npmjs.org/${dependency.name}`),
      );
      let response = NpmResponse.map(responseJSON);
      const versionString =
        dependency.version[0] == '^'
          ? dependency.version.substr(1)
          : dependency.version;
      const versionFound = response.versions.get(versionString);
      console.info(
        `${dependency.name} - duration: %ds`,
        process.hrtime(start)[0],
      );
      if (versionFound) resolve(versionFound.keywords);
      else resolve([]);
    });
  }
  /**
   * Returns sorted keywords of dependencies in given project, along with appearances
   *
   * @param {string} owner
   * @param {string} repository
   * @returns
   * @memberof RepositoriesServices
   */
  static async getKeywords(owner: string, repository: string) {
    let start = process.hrtime();
    const repo = await API.getRepository({ owner, repository });
    let p1 = process.hrtime(start);
    let dependencies = [...repo.devDependencies, ...repo.dependencies];
    dependencies.map(dependency => {
      console.log(dependency.name);
    });
    const fetchKeywords = async () => {
      return Promise.all(
        dependencies.map(dependency =>
          this.fetchKeywordFromDependency(dependency),
        ),
      );
    };
    let keywords = await fetchKeywords();
    let p2 = process.hrtime(start);
    let countedKeywords = new Map<string, number>();
    keywords.forEach(dependencyKeywords => {
      if (dependencyKeywords)
        dependencyKeywords.forEach(keyword => {
          if (countedKeywords.has(keyword))
            countedKeywords.set(
              keyword,
              <number>countedKeywords.get(keyword) + 1,
            );
          else countedKeywords.set(keyword, 1);
        });
    });
    let keywordPairs: [String, number][] = [];
    countedKeywords.forEach((v, k) => {
      keywordPairs.push([k, v]);
    });
    keywordPairs.sort((pairA, pairB) => {
      if (pairA[1] < pairB[1]) return -1;
      if (pairA[1] == pairB[1]) return 0;
      return 1;
    });
    console.info('p1: %ds, p2 %ds', p1[0], p2[0]);
    return keywordPairs;
  }
  static onlyUnique(value: any, index: Number, self: any) {
    return self.indexOf(value) === index;
  }

  static async fetchCommits(user: string) {
    const repos = await GQLAPI.getContributedRepositories({
      contributor: user,
      limit: 5,
    });
    const repositoryPaths = repos.map(repo => repo.path);
    // const commits = await API.getCommits({author: user, repositoryPaths, perPage: 20})
    const response = await Promise.all(
      repositoryPaths.map(repo =>
        API.searchCommits({
          author: user,
          repositoryPaths: [repo],
          perPage: 5,
        }),
      ),
    );
    const commits = response.map(collection => collection.items).flat();
    return <Commit[]>(
      commits.map(
        (item: { sha: string; repository: any }) =>
          new Commit(item.sha, Repository.map(item.repository)),
      )
    );
  }

  static async getUsedLibrariesWithCommits(
    user: string,
    languages: string[] = ['JAVA', 'TYPESCRIPT', 'JAVASCRIPT'],
    commits: Commit[],
  ) {}

  static async getUsedLibraries(
    user: string,
    languages: string[] = ['JAVA', 'TYPESCRIPT', 'JAVASCRIPT'],
  ) {
    const commits = await this.fetchCommits(user);
    const files = await API.getFiles(commits, ['java', 'ts', 'js']); // get this from knownLanguages
    const result: Map<string, string[]> = new Map();
    languages.forEach(language => {
      const resolver = knownLanguages.get(language);
      if (!resolver) return;
      const dependencies = files
        .map(file => {
          return resolver.resolveExternalDependencies(file);
        })
        .flat()
        .filter(this.onlyUnique)
        .filter(Boolean);
      result.set(language, dependencies);
    });
    return result;
  }

  static async resolveKeywords(language: string, libraries: string[]) {
    const resolver = keywordResolvers.get(language);
    if (resolver) {
      const resolved = await Promise.all(
        libraries.map(library => resolver(library)),
      );
      return resolved.flat().filter(this.onlyUnique);
    } else {
      return [];
    }
  }

  static async scanUser(user: string) {
    const languages = ['JAVA', 'TYPESCRIPT', 'JAVASCRIPT'];
    const librariesMap = await this.getUsedLibraries(user, languages);
    const promises: Promise<string[]>[] = [];
    librariesMap.forEach((libraries, language) =>
      promises.push(this.resolveKeywords(language, libraries)),
    );
    const keywords = await Promise.all(promises);
    return keywords.flat();
  }
}
