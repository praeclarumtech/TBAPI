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
    },
  };

  const transporter = nodemailer.createTransport(obj);

  const emailText = newOtp ? `Your Otp is: ${newOtp}` : description;
  const subjectText = newOtp ? 'Otp for forgot password' : subject;

  const toRecipients = Array.isArray(email_to) ? email_to.join(',') : email;
  const bccRecipients = Array.isArray(email_bcc) ? email_bcc.join(',') : '';

  console.log(toRecipients);

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
    console.log('----Error in sending email--------------------->', error);
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
    <div style="text-align: center; margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">
        📱 Quick Apply with QR Code
      </h3>
      <p style="color: #555; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
        Scan the QR code below to fill out your application form instantly.<br/>
        Or simply click it to open the form on your device.
      </p>
      <div style="display: inline-block; background-color: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <a href="${url}">
          <img src="cid:${cid}" alt="QR Code" width="200" height="200" style="cursor: pointer; display: block; border-radius: 8px;" />
        </a>
      </div>
      <p style="color: #666; font-size: 13px; margin: 15px 0 0 0;">
        Click the QR code or use the button below to apply
      </p>
    </div>
  `;
  const htmlBlockforUpdate = `
    <div style="text-align: center; margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px;">
      <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">
        📱 Update Your Application
      </h3>
      <p style="color: #555; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
        Scan the QR code below to review and update your existing application information.<br/>
        Or simply click it to open the form on your device.
      </p>
      <div style="display: inline-block; background-color: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <a href="${url}">
          <img src="cid:${cid}" alt="QR Code" width="200" height="200" style="cursor: pointer; display: block; border-radius: 8px;" />
        </a>
      </div>
      <p style="color: #666; font-size: 13px; margin: 15px 0 0 0;">
        Click the QR code or use the button below to update your application
      </p>
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
