import request from 'request-promise';
import { NodeRepository } from '../models/NodeRepository';
import { Commit } from '../models/Commit';

export interface RepositoryRequest {
	repository?: String;
	owner?: String;
	path?: String;
}

export interface CommitsRequest {
	author?: String;
	repositoryPaths?: String[];
	words?: String[];
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
				Authorization: `Bearer ${process.env.GITHUB_KEY}`,
				'User-Agent': 'Request-Promise',
			},
		};
		const packageOptions = {
			uri: `https://api.github.com/repos/${path}/contents/package.json`,
			headers: {
				Accept: 'application/vnd.github.VERSION.raw',
				Authorization: `Bearer ${process.env.GITHUB_KEY}`,
				'User-Agent': 'Request-Promise',
			},
		};
		const rawJSON = JSON.parse(await request(repoOptions));
		const packageJSON = JSON.parse(await request(packageOptions));
		return NodeRepository.map({ ...rawJSON, ...packageJSON });
	}
	/**
	 * Returns commits accordingly to passed Request.
	 * Depends on experimental GitHub API V3 feature (searching commits)
	 *
	 * @static
	 * @param {CommitsRequest} req
	 * @returns
	 * @memberof API
	 */
	static async getCommits(req: CommitsRequest) {
		let uri = `https://api.github.com/search/commits?q=`;
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
		if (flag) return {};
		uri += params.join('+');
		const options = {
			uri,
			headers: {
				Accept: [
					'application/vnd.github.VERSION.raw',
					'application/vnd.github.cloak-preview',
				],
				Authorization: `Bearer ${process.env.GITHUB_KEY}`,
				'User-Agent': 'Request-Promise',
			},
			json: true,
		};
		return request(options);
	}
	static resolveRepositoryPath(req: RepositoryRequest) {
		return `/${req.owner}/${req.repository}`;
	}

	static generateOptions(uri: string, additionalHeaders: any = {}) {
		return {
			uri,
			headers: {
				Accept: 'application/vnd.github.VERSION.raw',
				Authorization: `Bearer ${process.env.GITHUB_KEY}`,
				'User-Agent': 'Request-Promise',
				...additionalHeaders,
			},
		};
	}

	static async getFiles(commits: Commit[], extension: string = 'ts') {
		const filenameRegex = new RegExp(`\w*(?=${extension}$)`);
		const commitsUriPattern = (commit: Commit) =>
			`https://api.github.com/repos/${commit.repository.full_name}/commits/${commit.sha}`;
		// Zawartosc commitow
		const filesResponse = await Promise.all(
			commits.map(commit =>
				request(this.generateOptions(commitsUriPattern(commit))),
			),
		);
		const contentUrls = filesResponse
			.map(commit => JSON.parse(commit))
			.map(commit => commit.files)
			.flat()
			.filter(file => filenameRegex.test(file.filename))
			.map(file => file.contents_url);
		const contents = <string[]> await Promise.all(
			contentUrls.map(url =>
				request(
					this.generateOptions(url, {
						Accept: 'application/vnd.github.VERSION.raw',
					}),
				),
			),
		);
		// application/vnd.github.VERSION.raw
		return contents.map(content => content.split('\n'));
		// return contentUrls
	}
}
