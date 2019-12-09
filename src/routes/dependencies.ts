import { Router } from 'express';
import { GitHubQueryingServices } from '../services/GitHubQueryingServices';
import { API } from './../api/RestAPI';
import { API as API2 } from './../api/GraphQLAPI';

const router = Router();

router.get('/:author', async (req, res, next) => {
  res.json(await GitHubQueryingServices.scanUser(req.params.author));
});

export { router };
