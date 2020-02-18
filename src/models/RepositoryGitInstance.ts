import git from 'simple-git/promise';
import path from 'path';
import fs from 'fs';

import { Repository } from './Repository';
import { Commit } from './git/Commit';
import Utils from '../services/Utils';

export default class RepositoryGitInstance {
  path: string;
  info: Repository;
  instance: git.SimpleGit;

  public static CLONE_PATH = path.join(
    process.cwd(),
    'dist',
    process.env.CLONED_REPOS_DIR
      ? process.env.CLONED_REPOS_DIR
      : 'cloned_repos',
  );
  private constructor(info: Repository, p: string, instance: git.SimpleGit) {
    this.path = p;
    this.info = info;
    this.instance = instance;
  }

  private static generateUrl(repositoryUrl: string): string {
    return `https://${process.env.GITHUB_TOKEN}@${repositoryUrl.substr(8)}`;
  }

  public static async fromRepository(
    repository: Repository,
  ): Promise<RepositoryGitInstance> {
    try {
      const randomString = Utils.generateRandomName();
      const p = path.join(
        RepositoryGitInstance.CLONE_PATH,
        randomString,
        repository.name,
      );
      Utils.createDirectory({
        name: randomString,
        relativePath: this.CLONE_PATH,
      });
      await git(path.join(this.CLONE_PATH, randomString)).clone(
        this.generateUrl(repository.url),
      );
      return new RepositoryGitInstance(repository, p, git(path.join(p)));
    } catch (err) {
      throw err;
    }
  }

  public async log() {
    return this.instance.log();
  }

  public async remove() {
    return new Promise((resolve, reject) => {
      fs.rmdir(this.path, { recursive: true }, err => {
        if (err) reject(err);
        else resolve(null);
      });
    });
  }

  public async getCommits() {
    let output: Commit[] = [];
    try {
      const data = await this.log();
      output = data['all'].map(commit => Commit.map(commit));
    } catch (e) {
      console.error(e);
    } finally {
      return output;
    }
  }

  public async diff(before: Commit, after: Commit): Promise<string> {
    return this.instance.raw(['diff', before.hash, after.hash]);
  }

  public async checkout(sha: string) {
    return this.instance.checkout(sha);
  }
}
