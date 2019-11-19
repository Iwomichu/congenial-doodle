import git from 'simple-git';
import path from 'path';
import fs from 'fs';
import { Repository } from '../models/Repository';
import { API } from '../api/GraphQLAPI';
import { Commit } from '../models/git/Commit';

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

  public static async filterChanges(user: string, commits: Commit[]) {
    const range = [...Array(commits.length).keys()].concat(1);
    const userCommitsIndices = range.filter(
      index => commits[index].author_name == user,
    );
    return userCommitsIndices.map(index => [
      commits[index - 1],
      commits[index],
    ]);
  }

  public static async getCommits(repository: Repository) {
    await this.clone(repository);
    const data: { all: any[] } = <any>await this.log(repository);
    await this.remove(repository);
    return data['all'].map(commit => Commit.map(commit));
  }

  public static async getUsedLibraries(user: string) {
    const repositories = await API.getContributedRepositories({
      contributor: user,
      limit: 10,
    });
    return await Promise.all(
      repositories.map(async repository => {
        try {
          const commits = await this.getCommits(repository);
          return this.filterChanges(user, commits);
        } catch (err) {
          console.error(err);
          return [];
        }
      }),
    );
  }
}
