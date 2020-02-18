import { Router } from 'express';
import { API } from '../api/GraphQLAPI';
import Analysis from '../services/Analysis';

const router = Router();

router.use('/', (req, res, next) => {
  console.log('Got analysis request');
  next();
});

router.use('/author/:owner/:repository/:author', async (req, res, next) => {
  console.log('Single repository analysis');
  const repository = await API.getRepository({
    name: req.params.repository,
    owner: req.params.owner,
  });
  const author = await Analysis.resolveAuthor(req.params.author);
  res.send(await Analysis.analizeRepository(author, repository, ['js', 'ts']));
});

router.use('/author/:author', async (req, res, next) => {
  console.log('Author analysis');
  res.send(await Analysis.analizeAuthor(req.params.author, ['js', 'ts']));
});

router.use('/authors', async (req, res, next) => {
  let authors: string[] = [];
  try {
    authors = req.body.authors;
  } catch (err) {
    console.error('Request parsing error: ', err);
  }
  if (authors?.length <= 0) res.status(418).send('No authors specified.');
  else {
    console.log('Analysing ', authors.join(', '));
    const results = await Promise.all(
      authors.map(author => Analysis.analizeAuthor(author, ['js', 'ts'])),
    );
    res.send(
      authors.map((author, index) => {
        return { author, analysisResult: results[index] };
      }),
    );
  }
});

export { router };
