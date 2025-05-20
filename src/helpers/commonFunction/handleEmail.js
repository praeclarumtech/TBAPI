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
  attachments = [],
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
    html: emailText,
    attachments: attachments.map(file => ({
      filename: file.originalname,
      path: file.path,
    })),
  };

  const data = await transporter.sendMail(mailOptions);
  return { success: true, data };
};






// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';
// dotenv.config();

// const primaryEmail = {
//   user: process.env.USER,
//   pass: process.env.PASS,
// };

// const secondaryEmail = {
//   user: process.env.ALTERNATE_USER,
//   pass: process.env.ALTERNATE_PASS,
// };

// const createTransporter = (emailCreds) =>
//   nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: emailCreds.user,
//       pass: emailCreds.pass,
//     },
//   });

// export const sendingEmail = async ({
//   email,
//   newOtp,
//   email_to,
//   email_bcc,
//   subject,
//   description,
//   attachments = [],
// }) => {
//   const emailText = newOtp ? `Your Otp is: ${newOtp}` : description;
//   const subjectText = newOtp ? 'Otp for forgot password' : subject;

//   const toRecipients = Array.isArray(email_to) ? email_to.join(',') : email;
//   const bccRecipients = Array.isArray(email_bcc) ? email_bcc.join(',') : '';

//   const mailOptions = {
//     from: process.env.FROM,
//     to: toRecipients,
//     bcc: bccRecipients,
//     subject: subjectText,
//     html: emailText,
//     attachments: attachments.map((file) => ({
//       filename: file.originalname,
//       path: file.path,
//     })),
//   };

//   try {
//     const transporter = createTransporter(primaryEmail);
//     const data = await transporter.sendMail(mailOptions);
//     return { success: true, data };
//   } catch (error) {
//     // Check for Gmail send limit error
//     if (
//       error.message.includes('Daily user sending limit exceeded') ||
//       error.message.includes('5.4.5')
//     ) {
//       try {
//         // Retry with secondary email
//         const fallbackTransporter = createTransporter(secondaryEmail);
//         const data = await fallbackTransporter.sendMail(mailOptions);
//         return {
//           success: true,
//           fallback: true,
//           message: 'Sent using alternate email due to limit on primary.',
//           data,
//         };
//       } catch (fallbackError) {
//         return {
//           success: false,
//           message: `Failed with both primary and fallback. Error: ${fallbackError.message}`,
//         };
//       }
//     }

//     // Other errors
//     return {
//       success: false,
//       message: `Failed to send mail. Error: ${error.message}`,
//     };
//   }
// };