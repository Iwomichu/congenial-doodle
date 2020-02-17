import request from 'request-promise';
import { NodeRepository } from '../models/userScan/NodeRepository';
import { Commit } from '../models/git/Commit';
import SimpleFile from '../models/SimpleFile';
import { notEmpty } from '../services/Analysis';

export interface RepositoryRequest {
  repository?: string;
  owner?: string;
  path?: string;
}

export interface CommitsRequest {
  author?: string;
  repositoryPaths?: string[];
  words?: string[];
  perPage?: Number;
}

export class API {
  static async getRepository(req: RepositoryRequest) {
    let path: String;
    if (req.owner && req.repository) path = this.resolveRepositoryPath(req);
    else if (req.path) path = req.path;
    else throw 'Repository path error';
    const repoOptions = {
      uri: `https://api.github.com/repos/${path}`,
      headers: {
        Accept: 'application/vnd.github.VERSION.raw',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Request-Promise',
      },
    };
    const packageOptions = {
      uri: `https://api.github.com/repos/${path}/contents/package.json`,
      headers: {
        Accept: 'application/vnd.github.VERSION.raw',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Request-Promise',
      },
    };
    const rawJSON = JSON.parse(await request(repoOptions));
    const packageJSON = JSON.parse(await request(packageOptions));
    return NodeRepository.map({ ...rawJSON, ...packageJSON });
  }

  static async getCommits(req: CommitsRequest) {
    const generateURL = (path: string) =>
      `https://api.github.com/repos/${path}/commits`;
    if (!req.repositoryPaths) throw 'Invalid CommitsRequest';
    return await Promise.all(
      req.repositoryPaths.map(async path => {
        const options = this.generateOptions(generateURL(path));
        const rawData = JSON.parse(await request(options));
        const output: Commit[] = rawData.map((commit: any) =>
          Commit.fromGetCommit(commit),
        );
        return output;
      }),
    );
  }
  static async searchCommits(req: CommitsRequest): Promise<Commit[]> {
    let uri = `https://api.github.com/search/commits?per_page=${
      req.perPage ? req.perPage : 100
    }&q=`;
    let params = [];
    let flag = true;
    if (req.author) {
      flag = false;
      params.push(`author:${req.author}`);
    }
    if (req.repositoryPaths) {
      flag = false;
      req.repositoryPaths.forEach(path => params.push(`repo:${path}`));
    }
    if (req.words) {
      flag = false;
      params.push(...req.words);
    }
    if (flag) return [];
    uri += params.join('+');
    const options = {
      uri,
      headers: {
        Accept: [
          'application/vnd.github.VERSION.raw',
          'application/vnd.github.cloak-preview',
        ],
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Request-Promise',
      },
      json: true,
    };
    const response = await request(options);
    const output: Commit[] = response['items'].map((item: any) =>
      Commit.fromCommitSearch(item),
    );
    return output;
  }
  static resolveRepositoryPath(req: RepositoryRequest) {
    return `/${req.owner}/${req.repository}`;
  }
  static async getCommitPageLength(path: string, page: number) {
    const url = `https://api.github.com/repos/${path}/commits?page=${page}`;
    const response = await request(this.generateOptions(url));
    return JSON.parse(response).length;
  }

  static generateOptions(uri: string, additionalHeaders: any = {}) {
    return {
      uri,
      headers: {
        Accept: 'application/vnd.github.VERSION.raw',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Request-Promise',
        ...additionalHeaders,
      },
    };
  }

  static async getFilesContents(commits: Commit[], extensions: string[]) {
    const filenameRegexes = extensions.map(
      extension => new RegExp(`\w*(?=${extension}$)`),
    );
    const commitsUrlPattern = (commit: Commit) => `${commit.url}`;
    // Zawartosc commitow
    const filesResponse = await Promise.all(
      commits.map(commit =>
        request(this.generateOptions(commitsUrlPattern(commit))),
      ),
    );
    const contentUrls = filesResponse
      .map(commit => JSON.parse(commit))
      .map(commit => commit.files)
      .flat()
      .filter(file =>
        filenameRegexes
          .map(filenameRegex => filenameRegex.test(file.filename))
          .some(test => test),
      )
      .map(file => file.contents_url);
    const contents = <string[]>await Promise.all(
      contentUrls.map(async url => {
        try {
          return await request(
            this.generateOptions(url, {
              Accept: 'application/vnd.github.VERSION.raw',
            }),
          );
        } catch (err) {
          console.error(err);
          return '';
        }
      }),
    );
    return contents.map(content => content.split('\n'));
  }

  static async getFiles(commits: Commit[], extensions: string[]) {
    const filenameRegexes = extensions.map(
      extension => new RegExp(`\w*(?=${extension}$)`),
    );
    const commitsUrlPattern = (commit: Commit) => `${commit.url}`;
    // Zawartosc commitow
    const filesResponse = await Promise.all(
      commits.map(commit =>
        request(this.generateOptions(commitsUrlPattern(commit))),
      ),
    );
    const contentUrls = filesResponse
      .map(commit => JSON.parse(commit))
      .map(commit => commit.files)
      .flat()
      .filter(file =>
        filenameRegexes
          .map(filenameRegex => filenameRegex.test(file.filename))
          .some(test => test),
      )
      .map(file => {
        return { url: file.contents_url, name: file.filename };
      });
    const contents = await Promise.all(
      contentUrls.map(async file => {
        try {
          return new SimpleFile(
            file.name.split('/').pop(),
            file.name,
            await request(
              this.generateOptions(file.url, {
                Accept: 'application/vnd.github.VERSION.raw',
              }),
            ),
          );
        } catch (err) {
          console.error(err);
          return null;
        }
      }),
    );
    return contents.filter(notEmpty);
  }
}
