import nodemailer from 'nodemailer';
import { getCompiledTemplate } from './emailTemplate.js';
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

  const emailText = newOtp ? `Your Otp is: ${newOtp}` : description;
  const subjectText = newOtp ? 'Otp for forgot password' : subject

  const toRecipients = Array.isArray(email_to) ? email_to.join(',') : email;
  const bccRecipients = Array.isArray(email_bcc) ? email_bcc.join(',') : '';

  const mailOptions = {
    from: process.env.FROM,
    to: toRecipients,
    bcc: bccRecipients,
    subject: subjectText,
    text: emailText,
  };

  const data = await transporter.sendMail(mailOptions);
  return { success: true, data };
};

export const sendTemplatedEmail = async ({
  type, // enum key
  email_to,
  email_bcc,
  dynamicData,
}) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });
 
  const { subject, html } = await getCompiledTemplate(type, dynamicData);
 
  const toRecipients = Array.isArray(email_to) ? email_to.join(',') : email_to;
  const bccRecipients = Array.isArray(email_bcc) ? email_bcc.join(',') : '';
 
  const mailOptions = {
    from: process.env.FROM,
    to: toRecipients,
    bcc: bccRecipients,
    subject,
    html,
  };
 
  return await transporter.sendMail(mailOptions);
};
