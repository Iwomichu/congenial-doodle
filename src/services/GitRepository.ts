import git from 'simple-git/promise';
import path from 'path';
import fs from 'fs';
import { Repository } from '../models/Repository';
import { API } from '../api/GraphQLAPI';
import { Commit } from '../models/git/Commit';
import { knownGitDiffExtensions } from '../languages/knownLanguages';

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
    try {
      await gitInstance.clone(repository.url, repository.name);
    } catch (e) {
      throw e;
    }
  }
  // log repo history
  public static async log(repository: Repository) {
    const gitInstance = git(path.join(this.CLONE_PATH, repository.name));
    return await gitInstance.log();
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

  public static async diff(
    repository: Repository,
    before: Commit,
    after: Commit,
  ) {
    const gitInstance = git(path.join(this.CLONE_PATH, repository.name));
    return await gitInstance.raw([`diff`, `${before.hash}`, `${after.hash}`]);
  }

  public static processDiff(diffResult: String) {
    const splitRegex = new RegExp(
      'diff --git [\\w/\\.\\-_]+ [\\w/\\.\\-_]+',
      'mg',
    );
    const partRegex = new RegExp(
      'diff --git ([\\w/\\.\\-_]+) ([\\w/\\.\\-_]+)',
      'mg',
    );
    const diffPartRegexResults = Array.of(...diffResult.matchAll(partRegex));
    // if(!diffPartRegexResults) return new Map<string, string[]>();
    const splitResult = diffResult.split(splitRegex).slice(1);
    let filesMap = new Map<string, string[]>();
    diffPartRegexResults.forEach((header, index) => {
      filesMap.set(
        <string>header[1].split('/').pop(),
        splitResult[index].trim().split('\n'),
      );
    });
    let output: string[][] = [];
    filesMap.forEach((value, key) => {
      const language = knownGitDiffExtensions.get(key.split('.').pop() || '');
      if (language) output.push(language.resolveExternalDependencies(value));
    });
    return output.flat().filter(list => list.length > 0);
  }

  public static async filterChanges(user: string, commits: Commit[]) {
    // commity posortowane od NAJNOWSZEGO, odwracam sortowanie
    commits = commits.reverse();
    const range = [...Array(commits.length).keys()].slice(1);
    const userCommitsIndices = range.filter(
      index =>
        commits[index].author_name == user ||
        commits[index - 1].author_name == user,
    );
    if (userCommitsIndices.length == 0) return [];
    if (userCommitsIndices.length == 1) return [];
    const userCommitsPaired = userCommitsIndices
      .map(index => [commits[index - 1], commits[index]])
      .filter(pair => pair[1].author_name == user);
    const output: Commit[][] = [];
    let current = userCommitsPaired[0];
    userCommitsPaired.slice(1).forEach(pair => {
      if (pair[0] == current[1]) current[1] = pair[1];
      else {
        output.push(current);
        current = pair;
      }
    });
    output.push(current);
    return output;
  }

  public static async getCommits(repository: Repository) {
    let output: Commit[] = [];
    try {
      const data: { all: any[] } = <any>await this.log(repository);
      output = data['all'].map(commit => Commit.map(commit));
    } catch (e) {
      console.error(e);
    } finally {
      return output;
    }
  }

  public static async getUserChanges(user: string) {
    // mozna rozwazyc filtrowanie autorow commitow po mailu
    const repositories = await API.getContributedRepositories({
      contributor: user,
      limit: 10,
    });
    return await Promise.all(
      repositories.map(async repository => {
        let output: string[] = [];
        try {
          await this.clone(repository);
        } catch (err) {
          console.error(err);
          return [];
        }
        try {
          const commits = await this.getCommits(repository);
          const commitPairs = await this.filterChanges(user, commits);
          const diffs = await Promise.all(
            commitPairs.map(async pair => {
              return this.diff(repository, pair[0], pair[1]);
            }),
          );
          const temp = diffs.map(difference => difference.split('\n'));
          output = diffs;
        } catch (err) {
          console.error(err);
        } finally {
          await this.remove(repository);
          return output;
        }
      }),
    );
  }
}
