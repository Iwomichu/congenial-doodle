import { Repository } from '../Repository';

export class Commit {
  sha: string;
  repository: Repository;

  constructor(sha: string, repository: Repository) {
    this.sha = sha;
    this.repository = repository;
  }
}
