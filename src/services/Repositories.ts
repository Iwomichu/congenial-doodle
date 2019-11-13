import request from 'request-promise';
import { Dependency } from './../models/NodeRepository';
import { NpmResponse } from './../models/NpmResponse';
import { API as GQLAPI} from "../api/GraphQLAPI"
import { API } from "../api/RestAPI";
import { Repository } from '../models/Repository';
import { Commit } from '../models/Commit';

export class RepositoriesServices {
	// too long name
	static async fetchKeywordFromDependency(dependency: Dependency): Promise<string[]> {
		const start = process.hrtime();
		console.info(`${dependency.name} - start: %ds`, start[0])
		return new Promise(async (resolve: any, reject: any) => {
			let responseJSON = JSON.parse(
				await request(`https://registry.npmjs.org/${dependency.name}`)
			);
			let response = NpmResponse.map(responseJSON);
			const versionString =
				dependency.version[0] == '^'
					? dependency.version.substr(1)
					: dependency.version;
			const versionFound = response.versions.get(versionString);
			console.info(`${dependency.name} - duration: %ds`, process.hrtime(start)[0])
			if (versionFound) resolve(versionFound.keywords)
			else resolve([])
		})
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
		dependencies.map(dependency => { console.log(dependency.name) });
		const fetchKeywords = async () => {
			return Promise.all(
				dependencies.map(dependency => this.fetchKeywordFromDependency(dependency))
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
							<number>countedKeywords.get(keyword) + 1
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

	static async fetchCommits(user: String){
		const repos = await GQLAPI.getRepositories({contributor: user, limit: 10})
		const repositoryPaths = repos.map(repo => repo.full_name)
		const commits = await API.getCommits({author: user, repositoryPaths})
		return <Commit[]>commits["items"].map((item: { sha: string; repository: any; }) => new Commit(item.sha, new Repository(item.repository.id, item.repository.name, item.repository.full_name)));
	}

	static async getFiles(user: String){
		const commits = await this.fetchCommits(user)
		return API.getFiles(commits)
	}
}
