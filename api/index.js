require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./Routes/index.js');
const parcelsCron = require('./Crons/createFutureParcels.js');
const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});

app.use(cors({
  origin: '*'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor rodando, porta ${process.env.PORT || 3000}`);
});


routes(app);

app.get('/', (req, res) => res.json({ message: 'inicio da API, para visualizar os endpoints, entre em: (https://documenter.getpostman.com/view/18863979/2s8Z75RpV2)' }));

module.exports = app;
