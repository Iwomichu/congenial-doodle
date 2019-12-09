import path from 'path';

import { Router } from 'express';
import { CloningRepositoryServices } from '../services/CloningRepositoryServices';
import { Repository } from '../models/Repository';
import { API } from '../api/GraphQLAPI';

const router = Router();

router.get('/:user', async (req, res, next) => {
  res.json(await CloningRepositoryServices.getUserChanges(req.params.user));
});

router.get('/analyse/:user', async (req, res, next) => {
  const allDiffs = await CloningRepositoryServices.getUserChanges(
    req.params.user,
  );
  const output = allDiffs
    .map(repositoryDiffs =>
      repositoryDiffs
        .map(pairDiff => CloningRepositoryServices.processDiff(pairDiff))
        .filter(diff => diff.length > 0),
    )
    .filter(repositoryDiffs => repositoryDiffs.length > 0);
  res.send(output); // nie odsyła, bo jsowe mapy nie parsują się do JSONa
});

export { router };
