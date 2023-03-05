require('dotenv').config()

module.exports = {
    sandbox: true,
    client_id: process.env.GN_CLIENT_ID,
    client_secret: process.env.GN_CLIENT_SECRET,
    pix_cert: './homologacao-431013-Testes-Brik.p12',
}