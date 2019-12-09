import { Router } from 'express';
import { GitHubQueryingServices } from '../services/GitHubQueryingServices';
import { API as GQLAPI } from '../api/GraphQLAPI';
import { API } from '../api/RestAPI';
import { Commit } from '../models/git/Commit';
import { Repository } from '../models/Repository';

const router = Router();

router.use('/', (req, res, next) => {
  console.log('Got hybrid request');
  next();
});

router.use('/:author', async (req, res, next) => {
  const repositories = await GQLAPI.getContributedRepositories({
    contributor: req.params.author,
    limit: 10,
  });
  const commits: Commit[][] = await API.getCommits({
    repositoryPaths: repositories.map(repository => repository.path),
  });
  let pairs: { repository: Repository; commits: Commit[] }[] = repositories.map(
    (repository, index) => {
      return { repository, commits: commits[index] };
    },
  );
  const bigRepositories = pairs.filter(pair => pair.commits.length >= 500);
  const smallRepositories = pairs.filter(pair => pair.commits.length < 500);

  res.json(pairs);
});

export { router };
