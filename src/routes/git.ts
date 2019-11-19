import path from 'path';

import { Router } from 'express';
import { GitRepository } from '../services/GitRepository';
import { Repository } from '../models/Repository';
import { API } from '../api/GraphQLAPI';

const router = Router();

router.get('/:user', async (req, res, next) => {
  res.json(await GitRepository.getCommits(req.params.user));
});

export { router };
