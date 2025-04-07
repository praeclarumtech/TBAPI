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

  const emailText = newOtp ? `Your Otp is: ${newOtp}` : description;
  subject = 'Otp for new Password';
  const emailHtml =
    '<h1>Your otp is:</h1>' +
    '<h3 style="font-weight:bold;">' +
    newOtp +
    '</h3>';

  const toRecipients = Array.isArray(email_to) ? email_to.join(',') : email;
  const bccRecipients = Array.isArray(email_bcc) ? email_bcc.join(',') : '';

  const mailOptions = {
    from: process.env.FROM,
    to: toRecipients,
    bcc: bccRecipients,
    subject,
    text: emailText,
    html: emailHtml
  };

  const data = await transporter.sendMail(mailOptions);
  return { success: true, data };
};
