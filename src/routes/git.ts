import path from 'path';

import { Router } from 'express';
import { GitRepository } from '../services/GitRepository';
import { Repository } from '../models/Repository';
import { API } from '../api/GraphQLAPI';

const router = Router();

router.get('/:user', async (req, res, next) => {
  res.json(await GitRepository.getUserChanges(req.params.user));
});

export { router };
