const User = require('../Models/User.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

class authController {
    static userRegistration = async (req, res) => {
        const { userName, email, phone, password, CPF } = req.body
        // insert on db
        let verifyData = await User.findOne({
            where: {
              email: email
            }
          })
        if(userName && email && phone && password && !verifyData?.email){
            let salt = bcrypt.genSaltSync(10)
            let encryptedPass = bcrypt.hashSync(password, salt)
            let newUser = await User.create({
                name: userName,
                email: email,
                CPF: CPF,
                phone: phone,
                password: encryptedPass,
                admin: false
            })
            let token = jwt.sign({id: newUser.id}, process.env.JWT_SECRET, { expiresIn: 4000})
            let refreshToken = jwt.sign({id: newUser.id}, process.env.JWT_SECRET, { expiresIn: 500000})
            res.status(200).json({email, name: userName, phone, token, refreshToken})
        }else if(verifyData?.email){
            res.status(406).json({message: 'Usuário já cadastrado'})
        }else{
            res.status(206).json({message: 'Informações insuficientes'})
        }
    }
    static userLogin = async (req, res) => {
        const { email, password } = req.body
        if(email && password){
            let verifyData = await User.findOne({
                where: {
                  email: email,
                }
              })
              bcrypt.compare(password, verifyData.password, (err, result) => {
                if(result){
                    let token = jwt.sign({id: verifyData.id}, process.env.JWT_SECRET, { expiresIn: '1h'})
                    let refreshToken = jwt.sign({id: verifyData.id}, process.env.JWT_SECRET, { expiresIn: '10d'})
                    res.status(200).json({name: verifyData.name, email: verifyData.email, phone: verifyData.phone, token, refreshToken})
                  }else{
                    res.status(403).json({message: 'Email ou senha inválidos'})
                  }
                });
              console.log(verifyData)
            
        }else{
            res.status(206).json({message: 'Informações insuficientes'})
        }

    }
}

module.exports = authController