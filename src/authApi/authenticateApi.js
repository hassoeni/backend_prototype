const jwt = require('jsonwebtoken')
const { basicPermissions } = require('./authorisation/basicPermissions')
const User = require('../projectApi/documentApi/mongodb/models/UserModel')
const Project = require('../projectApi/documentApi/mongodb/models/ProjectModel')


authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }
        req.user = user
        req.token = token
        next()

    } catch (error) {
        try {
            console.log('no authentication: user is foaf:Agent')

            req.user = {username: "visitor", guest: true}
            next() 
        } catch (error) {
            res.status(401).send({ error: 'Please authenticate' })
        }
    }
}

authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }

        if (user.email === 'admin@lbdserver.org') {
            req.user = user
            req.token = token
            next()
        } else {
            throw new Error()
        }

    } catch (error) {
        res.status(401).send({ error: 'Admin rights are required to access this endpoint' })
    }
}

checkAccess = async (req, res, next) => {
    try {
        const {allowed, query} = await basicPermissions(req)
        if (req.query.query && query) {
            req.query.query = query
        }
        req.permissions = allowed
        next()
    } catch (error) {
        console.log('error', error)
        try {
            return res.status(error.status).send({ error: error.reason })
        } catch (err) {            
            return res.status(500).send({ error: error })
        }
    }
}


module.exports = { authenticate, authenticateAdmin, checkAccess }