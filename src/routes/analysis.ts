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

router.use('/alt/:author', async (req, res, next) => {
  res.send(await Analysis.analizeAuthor(req.params.author, ['js']));
});

export { router };
