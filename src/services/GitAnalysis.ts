import path from 'path';
import git from 'simple-git/promise';

import { Repository } from '../models/Repository';
import RepositoryGitInstance from '../models/RepositoryGitInstance';

export default class GitAnalysis {
  public static CLONE_PATH = path.join(
    process.cwd(),
    'dist',
    process.env.CLONED_REPOS_DIR
      ? process.env.CLONED_REPOS_DIR
      : 'cloned_repos',
  );

  public static async clone(repository: Repository) {
    try {
      await git(this.CLONE_PATH).clone(repository.url, repository.name);
      return RepositoryGitInstance.fromRepository(repository);
    } catch (err) {
      throw err;
    }
  }
}
