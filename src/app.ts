#!/usr/bin/env node
import * as express from 'express'

import {router as dependenciesRouter} from './dependencies'

const app = express.default()

app.use("/", (req, res, next) => {
    console.log("Got request!");
    next()
})

app.use("/dependencies", dependenciesRouter)

app.listen(3030, () => {
    console.log("Listening on 3030");
})