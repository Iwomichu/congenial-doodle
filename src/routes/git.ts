import path from 'path';

import { Router } from 'express';
import { GitRepository } from '../services/GitRepository';
import { Repository } from '../models/Repository';
import { API } from '../api/GraphQLAPI';

const router = Router();

router.get('/:owner/:repository', async (req, res, next) => {
  const repository = await API.getRepository({
    owner: req.params.owner,
    name: req.params.repository,
  });
  await GitRepository.clone(repository);
  const logs = await GitRepository.log(repository);
  GitRepository.remove(repository);
  res.json(logs);
});

export { router };
