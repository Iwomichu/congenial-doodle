import {Router} from 'express'
import request from 'request-promise'
import { NodeRepository } from '../models/NodeRepository'
import { NpmResponse } from '../models/NpmResponse'
import { RepositoriesServices } from '../services/Repositories'

const router = Router()

router.get("/:owner/:project", async (req, res, next) => {
    res.json(await RepositoriesServices.getKeywords(req.params.owner, req.params.project))
})

export {router};