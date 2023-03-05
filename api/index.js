require('dotenv').config()
const express = require('express')
const cors = require('cors')
const PORT = process.env.PORT || 3000
const routes = require('./Routes/index.js')
const parcelsCron = require('./Crons/createFutureParcels.js')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server,{
    cors: {
      origin: '*'
    }
  })
app.use(cors({
    origin: 'https://bricks-empreendimentos.vercel.app'
  }));
io.on('connection', socket =>{ 
    console.log('Socket conectado: '+ socket.id)
    socket.on('disconnect', () =>{
        console.log('Socket desconectado')
    })
})
app.use(express.json())
app.use(express.urlencoded({extended: true}))
routes(app)

app.get('/', (req, res) => res.json({message: 'inicio da API, para visualizar os endpoints, entre em: (https://documenter.getpostman.com/view/18863979/2s8Z75RpV2)'}))

server.listen(PORT, () =>{
    console.log(`Servidor rodando, porta ${PORT}`)
})

// console.log(io)

module.exports = app