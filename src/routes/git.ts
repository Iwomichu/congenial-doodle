import path from 'path';

import { Router } from 'express';
import { GitRepository } from '../services/GitRepository';
import { Repository } from '../models/Repository';
import { API } from '../api/GraphQLAPI';

const router = Router();

router.get('/:user', async (req, res, next) => {
  res.json(await GitRepository.getUserChanges(req.params.user));
});

router.get('/analyse/:user', async (req, res, next) => {
  const allDiffs = await GitRepository.getUserChanges(req.params.user);
  const output = allDiffs
    .map(repositoryDiffs =>
      repositoryDiffs
        .map(pairDiff => GitRepository.processDiff(pairDiff))
        .filter(diff => diff.length > 0),
    )
    .filter(repositoryDiffs => repositoryDiffs.length > 0);
  res.send(output); // nie odsyła, bo jsowe mapy nie parsują się do JSONa
});

export { router };
