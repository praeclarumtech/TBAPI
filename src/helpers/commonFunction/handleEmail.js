import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
import QRCode from 'qrcode';

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

  let obj = {
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'contact@praeclarumtech.com',
      pass: process.env.SMTP_PASS || 'D@vloper2025',
    },
    requireTLS: true,
    tls: {
      // minVersion: 'TLSv1.2',
    }
  }

  const transporter = nodemailer.createTransport(obj);

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
    .filter(
      (image) =>
        image &&
        typeof image.base64 === 'string' &&
        typeof image.cid === 'string'
    )
    .map(({ base64, cid }) => ({
      filename: `${cid}.png`,
      content: extractBase64Content(base64),
      encoding: 'base64',
      cid,
    }));

  // Also map normal attachments if any
  const normalAttachments = attachments.map((file) => ({
    filename: file.filename,
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
  
  try {
    await transporter.verify();
    console.log('✅ SMTP connection to Office365 is OK');
    const data = await transporter.sendMail(mailOptions);
    return { success: true, data };
  } catch (error) {
    console.log('----Error in sending email--------------------->',error);
    return { success: false, error: error.message };
  }
};

// generateQr function

export const generateQrEmailHtml = async (applicantId) => {
  let url = '';
  let cid = '';
  let baseUrl = process.env.FRONT_URL;

  if (applicantId) {
    url = `${baseUrl}/applicants/applicant-edit-qr-code/${applicantId}`;
    cid = `qr-${applicantId}@qr`;
  } else {
    url = `${baseUrl}/applicants/applicant-add-qr-code`;
    cid = `qr-new-applicant@qr`;
  }

  const qrCode = await QRCode.toDataURL(url);

  const htmlBlock = `
    <div style="margin-bottom: 20px;">
     <h2>Fill Out Your Details</h2>
    <p>Please scan the QR code below to fill out your application form.</p>
    <p>Or simply click it to open the form on your device.</p>
    <a href="${url}">
      <img src="cid:${cid}" alt="QR Code" width="150" height="150" style="cursor: pointer;" />
    </a>
    </div>
  `;
  const htmlBlockforUpdate = `
    <div style="margin-bottom: 20px;">
      <h2>Edit Your Submitted Details</h2>
    <p>Scan the QR code below to review and update your existing application information.</p>
    <p>Or simply click it to open the form on your device.</p>
    <a href="${url}">
      <img src="cid:${cid}" alt="QR Code" width="150" height="150" style="cursor: pointer;" />
    </a>
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
