import { request, GraphQLClient } from 'graphql-request';
import { Repository } from '../models/Repository';
import GitHubUser from '../models/GitHubUser';

export interface RepositoryRequest {
  contributor?: String;
  limit?: Number;
  owner?: String;
  name?: String;
}

export interface UserRequest {
  login: string;
  email?: string;
  name?: string;
}

export class API {
  // fetchrepos
  public static async getContributedRepositories(request: RepositoryRequest) {
    const graphqlClient = new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Request',
      },
    });
    const query = `
            {
                user(login: "${request.contributor}"){
                    repositoriesContributedTo(orderBy: {field: CREATED_AT, direction: DESC}, first: ${
                      request.limit ? request.limit : 1
                    }){
                      nodes {
                        id,
                        name,
                        path:nameWithOwner
                        url
                      }
                    }
                  },
            }`;
    const data = await graphqlClient.request(query);
    return <Repository[]>(
      data['user']['repositoriesContributedTo'][
        'nodes'
      ].map((entry: { id: Number; name: String; path: String; url: string }) =>
        Repository.map(entry),
      )
    );
  }
  public static async getOwnedRepositories(request: RepositoryRequest) {
    const graphqlClient = new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Request',
      },
    });
    const query = `
            {
                user(login: "${request.contributor}"){
                    repositories(orderBy: {field: CREATED_AT, direction: DESC}, first: ${
                      request.limit ? request.limit : 1
                    }){
                      nodes {
                        id,
                        name,
                        path:nameWithOwner
                        url
                      }
                    }
                  },
            }`;
    const data = await graphqlClient.request(query);
    return <Repository[]>(
      data['user']['repositories'][
        'nodes'
      ].map((entry: { id: Number; name: String; path: String; url: string }) =>
        Repository.map(entry),
      )
    );
  }
  public static async getTopRepositories(request: RepositoryRequest) {
    const graphqlClient = new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Request',
      },
    });
    const query = `
            {
                user(login: "${request.contributor}"){
                    topRepositories(orderBy: {field: CREATED_AT, direction: DESC}, first: ${
                      request.limit ? request.limit : 1
                    }){
                      nodes {
                        id,
                        name,
                        path:nameWithOwner
                        url
                      }
                    }
                  },
            }`;
    const data = await graphqlClient.request(query);
    return <Repository[]>(
      data['user']['topRepositories'][
        'nodes'
      ].map((entry: { id: Number; name: String; path: String; url: string }) =>
        Repository.map(entry),
      )
    );
  }
  public static async getRepository(request: RepositoryRequest) {
    const graphqlClient = new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Request',
      },
    });
    const query = `{
      repository(owner:"${request.owner}",name:"${request.name}"){
        id
        name
        path:nameWithOwner
        url
      }
    }
    `;
    const data = await graphqlClient.request(query);
    return Repository.map(data['repository']);
  }

  public static async getUser(request: UserRequest) {
    const graphqlClient = new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Request',
      },
    });
    const query = `{
      user(login: "${request.login}") {
        email
        login
        name
      }
    }
    `;
    const data = await graphqlClient.request(query);
    return GitHubUser.fromGQL(data['user']);
  }
}
