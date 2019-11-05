import request from "request-promise";
import { NodeRepository } from "./../models/NodeRepository";
import { NpmResponse } from "./../models/NpmResponse";

export class RepositoriesServices {
    static async getRepository(path: string){
        const repoOptions = {
            uri: `https://api.github.com/repos/${path}`,
            headers: {
                Accept: "application/vnd.github.VERSION.raw",
                Authorization: "token 523e37c11b8463ceeb15c05f1564dcd7f8a0e490",
                "User-Agent": "Request-Promise"
            }
        };
        const packageOptions = {
            uri: `https://api.github.com/repos/${path}/contents/package.json`,
            headers: {
                Accept: "application/vnd.github.VERSION.raw",
                Authorization: "token 523e37c11b8463ceeb15c05f1564dcd7f8a0e490",
                "User-Agent": "Request-Promise"
            }
        };
        const rawJSON = JSON.parse(await request(repoOptions));
        const packageJSON = JSON.parse(await request(packageOptions));
        return NodeRepository.map({ ...rawJSON, ...packageJSON });
    }
    /**
     * Returns sorted keywords of dependencies in given project, along with appearances
     *
     * @param {string} user
     * @param {string} project
     * @returns
     * @memberof RepositoriesServices
     */
    static async getKeywords(user: string, project: string) {
        let start = process.hrtime();
        const repo = await this.getRepository(`${user}/${project}`);
        let p1 = process.hrtime(start);
        let dependencies = [...repo.devDependencies, ...repo.dependencies];
        const getKeywords = async () => {
            return Promise.all(
                dependencies.map(async dependency => {
                    // wydobywanie keywordow z kazdego zapisu w dependencjach na podstawie api npmjs
                    //TODO: skrocic czas dzialania tej lambdy (zmiany w await request)
                    let responseJSON = JSON.parse(
                        await request(`https://registry.npmjs.org/${dependency.name}`)
                    );
                    let response = NpmResponse.map(responseJSON);
                    const versionString =
                        dependency.version[0] == "^"
                            ? dependency.version.substr(1)
                            : dependency.version;
                    const versionFound = response.versions.get(versionString);
                    if (versionFound) return versionFound.keywords;
                    else return;
                })
            );
        };
        let keywords = await getKeywords();
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
        console.info("p1: %ds, p2 %ds", p1[0], p2[0]);
        return keywordPairs;
    }
}
