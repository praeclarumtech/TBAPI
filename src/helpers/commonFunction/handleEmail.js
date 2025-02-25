import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendingEmail = async ({
  email,
  newOtp,
  email_to,
  email_bcc,
  subject,
  description,
}) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

  const emailText = newOtp ? `New OTP: ${newOtp}` : description;

  const mailOptions = {
    from: process.env.FROM,
    to: email_to || email,
    bcc: email_bcc || '',
    subject,
    text: emailText,
  };

  const data = await transporter.sendMail(mailOptions);
  return { success: true, data };
};
