import request from 'request-promise';

import { NpmResponse } from '../models/userScan/NpmResponse';

class NpmJsAPI {
  async getPackage(name: string) {
    const rawResponse = await request(`https://registry.npmjs.org/${name}`);
    const jsonResponse = JSON.parse(rawResponse);
    const response = NpmResponse.map(jsonResponse);
    return response.versions.get(response.latest);
  }
}
const npmJsApi = new NpmJsAPI();
export { npmJsApi };
