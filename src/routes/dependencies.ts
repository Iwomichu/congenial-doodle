import { Router } from 'express';
import { RepositoriesServices } from '../services/Repositories';
import { API } from './../api/RestAPI';
import { API as API2 } from './../api/GraphQLAPI';

const router = Router();

router.get('/:owner/:project', async (req, res, next) => {
  res.json(
    await RepositoriesServices.getKeywords(
      req.params.owner,
      req.params.project,
    ),
  );
});

router.get('/commits/author/:author', async (req, res, next) => {
  res.json(await RepositoriesServices.fetchCommits(req.params.author));
});

router.get('/commits/repo/:owner/:repository', async (req, res, next) => {
  res.json(
    JSON.stringify(
      API2.getContributedRepositories({ contributor: 'Iwomichu', limit: 10 }),
    ),
  );
});

router.get('/:author', async (req, res, next) => {
  res.json(await RepositoriesServices.scanUser(req.params.author));
});

export { router };
