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

    let replyList = [process.env.EMAIL_REPLYER1, process.env.EMAIL_REPLYER2];
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if(!validRegex.test(email)){
        res.status(400).json({message: 'Email inválido.'});
    }
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        replyTo: replyList,
        subject: 'Solicitação de contato',
        html: `
        <p>Olá, meu nome é ${name.split(' ')[0]}, gostaria de entrar em contato para mais informações.</p>
        <p>Atenciosamente, <br> ${name} <br> ${email}</p>
        `
      };

    const mailToUserOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        replyTo: replyList,
        subject: 'Solicitação de contato',
        html: `
        <p>Olá ${name.split(' ')[0]}, obrigado por entrar em contato!</p>
        <p>Caso queira ter algum detalhe sobre um lote, loteamento ou parceria <br> Sinta-se livre para entrar em contato.</p>
        <p>Atenciosamente, <br> Atendimento BRIK <br> ${process.env.EMAIL_USER}</p>
        `
        };
        

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({message: 'Erro ao enviar email.'});
      } else {
        transporter.sendMail(mailToUserOptions, (error, info) => {});
        res.status(200).json({message: 'Email enviado com sucesso!'});
      }
    });
  }
  static sendContactemailFromLandingPage = (req, res) => {
    let { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
      host: 'smtp.umbler.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    let replyList = [process.env.EMAIL_REPLYER1, process.env.EMAIL_REPLYER2];
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if(!validRegex.test(email)){
        res.status(400).json({message: 'Email inválido.'});
    }
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        replyTo: replyList,
        subject: 'Solicitação de contato',
        html: `
        <p>
         ${message}
         <br>
         Atencionamente, <br>
          ${name} <br>
          ${email}
         </p>`
      };

    const mailToUserOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        replyTo: replyList,
        subject: 'Solicitação de contato',
        html: `
        <p>Olá ${name.split(' ')[0]}, obrigado por entrar em contato!</p>
        <p>Caso queira ter algum detalhe sobre um lote, loteamento ou parceria <br> Sinta-se livre para entrar em contato.</p>
        <p>Atenciosamente, <br> Atendimento BRIK <br> ${process.env.EMAIL_USER}</p>
        `
        };
        

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({message: 'Erro ao enviar email.'});
      } else {
        transporter.sendMail(mailToUserOptions, (error, info) => {});
        res.status(200).json({message: 'Email enviado com sucesso!'});
      }
    });
  }
}


module.exports = emailController