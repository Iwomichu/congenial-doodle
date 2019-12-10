import { Router } from 'express';
import { GitHubQueryingServices } from '../services/GitHubQueryingServices';
import { API as GQLAPI } from '../api/GraphQLAPI';
import { API } from '../api/RestAPI';
import { Commit } from '../models/git/Commit';
import { Repository } from '../models/Repository';
import { CloningRepositoryServices } from '../services/CloningRepositoryServices';

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
  const pairs = await Promise.all(
    repositories.map(async repository => {
      return {
        repository,
        isBig: (await API.checkCommitPage(repository.path, 17)) != 0,
      };
    }),
  );
  const bigRepositories = pairs.filter(pair => pair.isBig);
  const smallRepositories = pairs.filter(pair => !pair.isBig);

  const resultSmall = await Promise.all(
    smallRepositories.map(async pair =>
      CloningRepositoryServices.getUserChangesOnRepository(
        req.params.author,
        pair.repository,
      ),
    ),
  );
  const resultBig = await Promise.all(
    bigRepositories.map(async pair => {
      const commits = await API.searchCommits({
        author: req.params.author,
        repositoryPaths: [pair.repository.path],
      });
      return await GitHubQueryingServices.getUsedLibrariesWithCommits(
        req.params.author,
        ['TYPESCRIPT'],
        commits.filter(commit => commit.author_name == req.params.author),
      );
    }),
  );
  res.json(pairs);
});

export { router };
