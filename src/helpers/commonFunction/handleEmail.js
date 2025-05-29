import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
import QRCode from 'qrcode';


// export const sendingEmail = async ({
//   email,
//   newOtp,
//   email_to,
//   email_bcc,
//   subject,
//   description,
//   attachments = [],
// }) => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.USER,
//       pass: process.env.PASS,
//     },
//   });

//   const emailText = newOtp ? `Your Otp is: ${newOtp}` : description;
//   const subjectText = newOtp ? 'Otp for forgot password' : subject

// const toRecipients = Array.isArray(email_to) ? email_to.join(',') : email;
//   const bccRecipients = Array.isArray(email_bcc) ? email_bcc.join(',') : '';

//   const mailOptions = {
//     from: process.env.FROM,
//     to: toRecipients,
//     bcc: bccRecipients,
//     subject: subjectText,
//     html: emailText,
//     attachments: attachments.map(file => ({
//       filename: file.originalname,
//       path: file.path,
//     })),
//   };

//   const data = await transporter.sendMail(mailOptions);
//   return { success: true, data };
// };





// for QR generateqr


export const sendingEmail = async ({
  email,
  newOtp,
  email_to,
  email_bcc,
  subject,
  description,
  attachments = [],
  inlineImages = [], //for allow image
}) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

  const emailText = newOtp ? `Your Otp is: ${newOtp}` : description;
  const subjectText = newOtp ? 'Otp for forgot password' : subject;

  const toRecipients = Array.isArray(email_to) ? email_to.join(',') : email;
  const bccRecipients = Array.isArray(email_bcc) ? email_bcc.join(',') : '';


  const extractBase64Content = (dataUrl) => {
    const matches = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
    return matches ? matches[1] : '';
  };
  // Convert inlineImages into nodemailer attachment format
  const inlineAttachments = inlineImages
    .filter(image => image && typeof image.base64 === 'string' && typeof image.cid === 'string')
    .map(({ base64, cid }) => ({
      filename: `${cid}.png`,
      content: extractBase64Content(base64),
      encoding: 'base64',
      cid,
    }));

  // Also map normal attachments if any
  const normalAttachments = attachments.map(file => ({
    filename: file.originalname,
    path: file.path,
  }));

  const mailOptions = {
    from: process.env.FROM,
    to: toRecipients,
    bcc: bccRecipients,
    subject: subjectText,
    html: emailText,
    attachments: [...inlineAttachments, ...normalAttachments],
  };

  const data = await transporter.sendMail(mailOptions);
  return { success: true, data };
};

// generateQr function

export const generateQrEmailHtml = async (applicantId) => {
  let url = ''
  let cid = ''
  let baseUrl = process.env.FORM_URL
  if (applicantId) {
    // url = `https://tb-front.vercel.app/applicants/edit-applicant/${applicantId}`;
    // url = `baseUrl/applicants/edit-applicant/${applicantId}`;
    url = `http://localhost:3000/api/applicants/applicant-edit-qr-code/${applicantId}`
    cid = `qr-${applicantId}@qr`;
  } else {
    // url = `https://tb-front.vercel.app/applicants/add-applicant`
    // url = `baseUrl/applicants/add-applicant`
    url = `http://localhost:3000/api/applicants/applicant-add-qr-code`
    cid = `qr-new-applicant@qr`
  }

  const qrCode = await QRCode.toDataURL(url)

  const htmlBlock = `
    <div style="margin-bottom: 20px;">
     <h2>Fill Out Your Details</h2>
    <p>Please scan the QR code below to fill out your application form.</p>
      <img src="cid:${cid}" alt=Q"R Code" width="150" height="150" />
    </div>
  `;
  const htmlBlockforUpdate = `
    <div style="margin-bottom: 20px;">
      <h2>Edit Your Submitted Details</h2>
    <p>Scan the QR code below to review and update your existing application information.</p>
      <img src="cid:${cid}" alt=Q"R Code" width="150" height="150" />
    </div>
  `;

  return {
    htmlBlock,
    htmlBlockforUpdate,
    inlineImage: {
      base64: qrCode,
      cid,
    },
  };
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