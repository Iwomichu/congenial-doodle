import { request, GraphQLClient } from "graphql-request";
import { Repository } from "../models/Repository";

export interface RepositoryRequest {
    contributor: String
    limit: Number
}

export class API {
    // fetchrepos
    public static async getRepositories(request: RepositoryRequest) {
        const graphQLClient = new GraphQLClient('https://api.github.com/graphql', {
            headers: {
                "Authorization": 'token 559020a1f1b922292485371a301d7f82d7477d4a'
            }
        })

        const query = `
            {
                user(login: "${request.contributor}"){
                    topRepositories(orderBy: {field: CREATED_AT, direction: DESC}, first: ${request.limit}){
                      nodes {
                        id,
                        name
                      }
                    }
                  },
            }`
        
        const data = await graphQLClient.request(query)
        return <Repository[]> data["user"]["topRepositories"]["nodes"].map((entry: { id: Number; name: String; nameWithOwner: String;}) => new Repository(entry.id, entry.name, entry.nameWithOwner));
    }
}