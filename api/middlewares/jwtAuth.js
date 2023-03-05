require('dotenv').config()
const jwt = require('jsonwebtoken')


const jwtAuth = (req, res, next) =>{
    let token = req.headers['x-access-token']
    console.log(token)
    let refreshToken = req.headers['x-access-token-refresh']
    jwt.verify(token, process.env.JWT_SECRET, (tokenError, tokenDecoded) =>{
        if(tokenError){
            jwt.verify(refreshToken, process.env.JWT_SECRET, (refreshTokenError, refreshTokenDecoded) =>{ 
                if(refreshTokenError){
                return res.status(401).json({message: 'Unauthorized'}).end()
                }else{
                    req.token = jwt.sign({id: refreshTokenDecoded.id}, process.env.JWT_SECRET, {expiresIn: '1h'})
                    req.refreshToken = jwt.sign({id: refreshTokenDecoded.id}, process.env.JWT_SECRET, {expiresIn: '10d'})
                    req.userID = refreshTokenDecoded.id
                    next()
                }
            })
        }else{
            req.token = jwt.sign({id: tokenDecoded.id}, process.env.JWT_SECRET, {expiresIn: '1h'})
            req.refreshToken = jwt.sign({id: tokenDecoded.id}, process.env.JWT_SECRET, {expiresIn: '10d'})
            req.userID = tokenDecoded.id
            next()
        }
    })
}

module.exports = jwtAuth