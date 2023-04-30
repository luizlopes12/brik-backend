const nodemailer = require('nodemailer');
require("dotenv").config();

class emailController {
  static sendContactemail = (req, res) => {
    let { name, email } = req.body;

    const transporter = nodemailer.createTransport({
      host: 'smtp.umbler.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    let replyList = [process.env.EMAIL_REPLYER1, process.env.EMAIL_REPLYER2]

    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      replyTo: replyList,
      subject: 'Solicitação de contato',
      html: `<p>Olá, meu nome é ${name}, gostaria de entrar em contato para mais informações.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({message: 'Erro ao enviar email.'});
      } else {
        res.status(200).json({message: 'Email enviado com sucesso!'});
      }
    });
  }
}


module.exports = emailController