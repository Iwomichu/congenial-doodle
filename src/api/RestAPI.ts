import request from 'request-promise';
import { NodeRepository } from '../models/NodeRepository';
import { NpmResponse } from '../models/NpmResponse';

export interface RepositoryRequest {
    repository?: String
    owner?: String
    path?: String
}

export class API {
	static async getRepository(req: RepositoryRequest) {
        let path: String
        if(req.owner && req.repository) path = `${req.owner}/${req.repository}`
        else if(req.path) path = req.path
        else throw "Repository path error"
		const repoOptions = {
			uri: `https://api.github.com/repos/${path}`,
			headers: {
				Accept: 'application/vnd.github.VERSION.raw',
				Authorization: 'token 5c5c58dd545c876d1060ab55ad8d33e6a9c17a7d',
				'User-Agent': 'Request-Promise',
			},
		};
		const packageOptions = {
			uri: `https://api.github.com/repos/${path}/contents/package.json`,
			headers: {
				Accept: 'application/vnd.github.VERSION.raw',
				Authorization: 'token 5c5c58dd545c876d1060ab55ad8d33e6a9c17a7d',
				'User-Agent': 'Request-Promise',
			},
		};
		const rawJSON = JSON.parse(await request(repoOptions));
		const packageJSON = JSON.parse(await request(packageOptions));
		return NodeRepository.map({ ...rawJSON, ...packageJSON });
	}
	
}