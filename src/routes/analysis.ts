const GitParser = require('git-diff-parser');

import { Router } from 'express';
import { API } from '../api/GraphQLAPI';
import { CloningRepositoryServices } from '../services/CloningRepositoryServices';

const router = Router();

router.use('/', (req, res, next) => {
  console.log('Got analysis request');
  next();
});

router.use('/:author', async (req, res, next) => {
  const author = req.params.author;
  const repositories = await API.getContributedRepositories({
    contributor: author,
    limit: 10,
  });
  try {
    const repositoryGitInstance = await CloningRepositoryServices.clone(
      repositories[0],
    );
    const commits = await CloningRepositoryServices.getCommits(repositories[0]);
    const commitsPairs = CloningRepositoryServices.filterChanges(
      author,
      commits,
    );
    const parsedDiffs = await Promise.all(
      commitsPairs.map(async pair => {
        const diff = await CloningRepositoryServices.diff(
          repositories[0],
          pair[0],
          pair[1],
        );
        return {
          commits: pair,
          diff: await CloningRepositoryServices.parseDiff(diff),
        };
      }),
    );
    res.json(parsedDiffs);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  } finally {
    CloningRepositoryServices.remove(repositories[0]);
  }
});

export { router };
