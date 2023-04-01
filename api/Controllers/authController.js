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
              bcrypt.compare(password, verifyData?.password, (err, result) => {
                if(result){
                    let token = jwt.sign({id: verifyData.id}, process.env.JWT_SECRET, { expiresIn: '1h'})
                    let refreshToken = jwt.sign({id: verifyData.id}, process.env.JWT_SECRET, { expiresIn: '10d'})
                    res.status(200).json({name: verifyData.name, email: verifyData.email, phone: verifyData.phone, token, refreshToken,
                    admin: verifyData.admin,
                    editDivisions: verifyData.editDivisions,
                    editLots: verifyData.editLots,
                    editPartners: verifyData.editPartners,
                    editBanners: verifyData.editBanners,
                    editTaxes: verifyData.editTaxes,
                  })
                  }else{
                    res.status(403).json({message: 'Email ou senha inválidos'})
                  }
                });
              console.log(verifyData)
            
        }else{
            res.status(206).json({message: 'Informações insuficientes'})
        }

    }

    static listAllUsers = async (req, res) => {
          
        let users = await User.findAll({
          attributes: [
            'name',
            'email',
            'admin',
            'editDivisions',
            'editLots',
            'editPartners',
            'editBanners',
            'editTaxes',
          ],
        });
        
        if(users.length === 0){
            res.status(404).json({message: 'Nenhum usuário encontrado'})
        }
        res.status(200).json(users)
    }
    static updateUser = async (req, res) => {
        const { id, name, email, phone, admin, editDivisions, editLots, editPartners, editBanners, editTaxes } = req.body
        if(id && name && email && phone && admin !== undefined && editDivisions !== undefined && editLots !== undefined && editPartners !== undefined && editBanners !== undefined && editTaxes !== undefined){
            let user = await User.update({
                name: name,
                email: email,
                phone: phone,
                admin: admin,
                editDivisions: editDivisions,
                editLots: editLots,
                editPartners: editPartners,
                editBanners: editBanners,
                editTaxes: editTaxes,
            }, {
                where: {
                    id: id
                }
            })
            if(user[0] === 0){
                res.status(404).json({message: 'Usuário não encontrado'})
            }else{
                res.status(200).json({message: 'Usuário atualizado com sucesso'})
            }
        }else{
            res.status(206).json({message: 'Informações insuficientes'})
        }
    }

}

module.exports = authController