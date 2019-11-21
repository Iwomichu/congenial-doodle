import { Router } from 'express';
import { RepositoriesServices } from '../services/Repositories';
import { API } from './../api/RestAPI';
import { API as API2 } from './../api/GraphQLAPI';

const router = Router();

router.get('/:author', async (req, res, next) => {
  res.json(await RepositoriesServices.scanUser(req.params.author));
});

export { router };
