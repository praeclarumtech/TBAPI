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

  const toRecipients = Array.isArray(email_to) ? email_to.join(',') : email;
  const bccRecipients = Array.isArray(email_bcc) ? email_bcc.join(',') : '';

  const mailOptions = {
    from: process.env.FROM,
    to: toRecipients,
    bcc: bccRecipients,
    subject,
    text: emailText,
  };

  const data = await transporter.sendMail(mailOptions);
  return { success: true, data };
};
