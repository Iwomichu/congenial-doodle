import git from 'simple-git';
import path from 'path';
import fs from 'fs';
import { Repository } from '../models/Repository';
import { API } from '../api/GraphQLAPI';

export class GitRepository {
  public static CLONE_PATH = path.join(
    process.cwd(),
    'dist',
    process.env.CLONED_REPOS_DIR
      ? process.env.CLONED_REPOS_DIR
      : 'cloned_repos',
  );
  // clone repo to directory
  public static async clone(repository: Repository) {
    const gitInstance = git(GitRepository.CLONE_PATH);
    return await new Promise((resolve, reject) => {
      gitInstance.clone(
        repository.url,
        repository.name,
        (error: any, value: unknown) => {
          if (error) reject(error);
          else resolve(value);
        },
      );
    });
  }
  // log repo history
  public static async log(repository: Repository) {
    const gitInstance = git(path.join(this.CLONE_PATH, repository.name));
    return await new Promise((resolve, reject) => {
      gitInstance.log((err, value) => {
        if (err) reject(err);
        else resolve(value);
      });
    });
  }
  // remove repo
  public static async remove(repository: Repository) {
    return await new Promise((resolve, reject) => {
      fs.rmdir(
        path.join(this.CLONE_PATH, repository.name),
        { recursive: true },
        err => {
          if (err) reject(err);
          else resolve(null);
        },
      );
    });
  }

  public static async getCommits(user: string) {
    const repositories = await API.getContributedRepositories({
      contributor: user,
      limit: 5,
    });
    return await Promise.all(
      repositories.map(async repository => {
        try {
          await this.clone(repository);
          const data = await this.log(repository);
          await this.remove(repository);
          return data;
        } catch (err) {
          console.error(err);
          return [];
        }
      }),
    );
  }
}
