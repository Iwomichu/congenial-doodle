import {Router} from 'express'
import { RepositoriesServices } from '../services/Repositories'
import {API} from "./../api/RestAPI"
import {API as API2} from "./../api/GraphQLAPI"

const router = Router()

router.get("/:owner/:project", async (req, res, next) => {
    res.json(await RepositoriesServices.getKeywords(req.params.owner, req.params.project))
})

router.get("/commits/author/:author", async (req,res,next) => {
    // res.json(await API.getCommits({author: req.params.author}))
    const data = await RepositoriesServices.fetchCommits(req.params.author)
    res.json(JSON.stringify(await RepositoriesServices.fetchCommits(req.params.author)))
})

router.get("/commits/repo/:owner/:repository", async (req,res,next) => {
    res.json(JSON.stringify(API2.getRepositories({contributor: "Iwomichu", limit: 10})))
    // res.json(await API.getCommits({repositoryPaths: [API.resolveRepositoryPath(req.params)]}))
})

export {router};