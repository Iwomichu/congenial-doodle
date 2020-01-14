#!/usr/bin/env node
import * as express from 'express';
import { config } from 'dotenv';
import path from 'path';

import { router as dependenciesRouter } from './routes/dependencies';
import { router as gitRouter } from './routes/git';
import { router as hybridRouter } from './routes/hybrid';
import { router as anaylsisRouter } from './routes/analysis';
import { resolve, reject } from 'bluebird';
import { existsSync, mkdir } from 'fs';

const app = express.default();
config();
if (
  !existsSync(
    path.join(
      __dirname,
      process.env.CLONED_REPOS_DIR
        ? process.env.CLONED_REPOS_DIR
        : 'cloned_repos',
    ),
  )
) {
  mkdir(
    path.join(
      __dirname,
      process.env.CLONED_REPOS_DIR
        ? process.env.CLONED_REPOS_DIR
        : 'cloned_repos',
    ),
    err => {
      if (err) throw err;
    },
  );
}

app.use('/', (req, res, next) => {
  console.log('Got request!');
  next();
});

app.use('/dependencies', dependenciesRouter);
app.use('/git', gitRouter);
app.use('/hybrid', hybridRouter);
app.use('/analysis', anaylsisRouter);

app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});
