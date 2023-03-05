const Sequelize = require("sequelize");
require('dotenv').config()
//Conexão com o banco de dados mysql
const connection = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  port: process.env.DB_PORT
});


connection
  .authenticate()
  .then(() => console.log("Banco de dados conectado"))
  .catch((err) => console.log("falha ao se conectar: " + err));

module.exports = {
  Sequelize,
  connection,
};