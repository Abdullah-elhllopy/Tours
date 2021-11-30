"use strict";
const nodemailer = require("nodemailer");

const sendEmail = async options => {
  let transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "ab420e9964d817",
      pass: "81c08e8b7a80cd"
    },
    tls:{
      rejectUnauthorized:false
    }
  });

  const mailOptions = {
    from: 'Abdallah Ahmed<hello@abdallah.io>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  await transporter.sendMail(mailOptions);
  console.log('email sent sucessfully');
};
module.exports = sendEmail;
