#!/usr/bin/env node
import * as express from 'express';
import { config } from 'dotenv';

import { router as dependenciesRouter } from './routes/dependencies';
import { router as gitRouter } from './routes/git';

const app = express.default();
config();

app.use('/', (req, res, next) => {
  console.log('Got request!');
  next();
});

app.use('/dependencies', dependenciesRouter);
app.use('/git', gitRouter);

app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});
