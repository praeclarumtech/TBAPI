import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


export const sendingEmail = async ({ email_to, email_bcc, subject, date, description }) => {
  const transporter = nodemailer.createTransport({
    service:'gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.PASS,
    },
  });
  const mailOptions = {
    from: process.env.FROM,
    to: email_to,
    bcc: email_bcc,
    subject,
    text: description,
  };

  const data = await transporter.sendMail(mailOptions);
  return { success: true, data };
};