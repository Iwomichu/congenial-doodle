import * as path from 'path';
const GitParser = require('git-diff-parser');

import { Router } from 'express';
import { API } from '../api/GraphQLAPI';
import { CloningRepositoryServices } from '../services/CloningRepositoryServices';
import Analysis from '../services/Analysis';

const router = Router();

router.use('/', (req, res, next) => {
  console.log('Got analysis request');
  next();
});

router.use('/:owner/:repository/:author', async (req, res, next) => {
  console.log('Single repository analysis');
  const repository = await API.getRepository({
    name: req.params.repository,
    owner: req.params.owner,
  });
  const author = await Analysis.resolveAuthor(req.params.author);
  res.send(await Analysis.analizeRepository(author, repository, ['js']));
});

router.use('/:author', async (req, res, next) => {
  console.log('Author analysis');
  res.send(await Analysis.analizeAuthor(req.params.author, ['js']));
});

export { router };
