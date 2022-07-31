import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

  let transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.USER,
      pass: process.env.PASSWORD
    }
  });
  export default transport;
