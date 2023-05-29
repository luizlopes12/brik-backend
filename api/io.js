const app = require('./index');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
});

io.on('connection', socket => {
  console.log('Socket conectado: ' + socket.id);
  socket.on('disconnect', () => {
    console.log('Socket desconectado');
  });
});

const PORT = process.env.SOCKET_PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor socket rodando, porta ${PORT}`);
});

module.exports = io;
