import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendingEmail = async ({ email, newOtp }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    port: 2525,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });
  const mailOption = {
    from: process.env.FROM,
    to: email,
    subject: 'Forgot password',
    text: `new otp:-${newOtp}`,
  };
  const data = await transporter.sendMail(mailOption);
  return { success: true, data };
};
