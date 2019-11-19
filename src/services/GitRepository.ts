import git from 'simple-git';
import path from 'path';
import fs from 'fs';
import { reject, resolve } from 'bluebird';
import { Repository } from '../models/Repository';

export class GitRepository {
  public static CLONE_PATH = path.join(process.cwd(), 'dist', 'cloned_repos');
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
}
