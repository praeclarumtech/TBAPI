import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { HandleResponse } from '../helpers/handleResponse.js';
import { Message } from '../utils/constant/message.js';
import logger from '../loggers/logger.js';
import { sendingEmail } from '../helpers/commonFunction/handleEmail.js';
import QRCode from 'qrcode';
import { Enum } from '../utils/enum.js';
import {
  getEmailTemplateById,
  getAllEmailTemplates,
} from '../services/emailTemplateService.js';

// Email template for QR code invite (Email-client compatible with table layout)
const generateQRCodeInviteTemplate = ({
  recipientName,
  recipientType,
  senderName,
  qrCodeUrl,
  registrationUrl,
  customMessage,
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; padding: 30px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="650" cellpadding="0" cellspacing="0" style="max-width: 650px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #16213e; padding: 40px 30px;">
              <h1 style="color: #e94560; margin: 0; font-size: 28px; font-weight: 700;">
                🎉 You're Invited to Join TalentBox!
              </h1>
              <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 16px;">
                Register as a ${recipientType} on our platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.8; margin: 0 0 15px 0;">
                Dear ${recipientName || 'User'},
              </p>
              <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                <strong>${senderName}</strong> has invited you to register as a <strong>${recipientType}</strong> on TalentBox - our talent management platform.
              </p>

              ${
                customMessage
                  ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="background-color: #f8f9fa; border-left: 4px solid #e94560; padding: 15px 20px; border-radius: 8px;">
                    <p style="color: #555555; font-size: 15px; margin: 0; font-style: italic;">
                      "${customMessage}"
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- QR Code Display -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                <tr>
                  <td align="center" style="background-color: #f5f7fa; padding: 30px; border-radius: 16px;">
                    <h3 style="color: #16213e; margin: 0 0 20px 0; font-size: 20px;">
                      📱 Scan QR Code to Register
                    </h3>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #ffffff; padding: 20px; border-radius: 16px;">
                          <a href="${registrationUrl}" style="display: block;">
                            <img src="cid:qr-invite@qr" alt="QR Code" width="200" height="200" style="display: block; border-radius: 8px;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #666666; font-size: 14px; margin: 20px 0 0 0;">
                      Scan with your phone camera or click the QR code
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background-color: #e94560; border-radius: 50px;">
                          <a href="${registrationUrl}" target="_blank" style="display: inline-block; padding: 18px 45px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px;">
                            🚀 Register Now
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 14px; line-height: 1.8; text-align: center; margin: 0;">
                Click the button above or scan the QR code to complete your registration.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #555555; font-size: 14px;">
                Best regards,<br/>
                <strong style="color: #2c3e50;">The TalentBox Team</strong>
              </p>
              <p style="color: #666666; font-size: 13px; margin: 15px 0;">
                📧 If you have any queries, please contact HR at <a href="mailto:${
                  process.env.HR_EMAIL || 'hr@talentbox.com'
                }" style="color: #e94560; text-decoration: none; font-weight: 600;">${
  process.env.HR_EMAIL || 'hr@talentbox.com'
}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 15px 0;" />
              <p style="color: #999999; font-size: 12px; margin: 0;">
                This is an automated invitation. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Helper function to replace template placeholders
const replaceTemplatePlaceholders = (template, replacements) => {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
};

// Send QR code invite to client or vendor
export const sendQRCodeInvite = async (req, res) => {
  try {
    const user = req.user || {};
    const {
      recipientType, // 'client' or 'vendor'
      recipients, // Array of emails (strings)
      customMessage,
      message, // Optional - custom HTML message
      emailTemplateId, // Optional - ID of email template from database
      templateType, // Optional - Type of template (e.g., 'qr_code_vendor_invite')
    } = req.body;

    // Validate user is admin
    if (user.role !== Enum.ADMIN) {
      return HandleResponse(
        res,
        false,
        StatusCodes.FORBIDDEN,
        'Only admin can send QR code invites'
      );
    }

    // Validate recipient type
    if (
      !recipientType ||
      !['client', 'vendor'].includes(recipientType.toLowerCase())
    ) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Invalid recipient type. Must be "client" or "vendor"'
      );
    }

    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return HandleResponse(
        res,
        false,
        StatusCodes.BAD_REQUEST,
        'Recipients array is required and must not be empty'
      );
    }

    // Normalize recipients - accept both string emails and objects
    const normalizedRecipients = recipients.map((recipient) => {
      if (typeof recipient === 'string') {
        return { email: recipient, name: '' };
      }
      return {
        email: recipient.email || recipient,
        name: recipient.name || '',
      };
    });

    // Validate each recipient has valid email
    for (const recipient of normalizedRecipients) {
      if (!recipient.email || typeof recipient.email !== 'string') {
        return HandleResponse(
          res,
          false,
          StatusCodes.BAD_REQUEST,
          'Each recipient must have a valid email address'
        );
      }
    }

    // Fetch email template - priority: message > emailTemplateId > templateType > default
    let emailTemplate = null;
    let templateSource = 'default';

    // If custom message HTML is provided, use it directly
    if (message && typeof message === 'string') {
      emailTemplate = {
        description: message,
        subject: `You're Invited to Join TalentBox as a ${
          recipientType.charAt(0).toUpperCase() + recipientType.slice(1)
        }!`,
        type: 'custom_message',
      };
      templateSource = 'custom_message';
    }
    // If emailTemplateId is provided, fetch by ID
    else if (
      emailTemplateId &&
      mongoose.Types.ObjectId.isValid(emailTemplateId)
    ) {
      try {
        emailTemplate = await getEmailTemplateById(emailTemplateId);
        if (!emailTemplate || emailTemplate.isDeleted) {
          logger.warn(`Email template ${emailTemplateId} not found or deleted`);
          emailTemplate = null;
        } else {
          templateSource = 'emailTemplateId';
        }
      } catch (templateErr) {
        logger.error(
          `Error fetching email template by ID: ${templateErr.message}`
        );
        emailTemplate = null;
      }
    }
    // If templateType is provided, fetch by type
    else if (templateType && typeof templateType === 'string') {
      try {
        const { getEmailTemplateByStatus } = await import(
          '../services/emailTemplateService.js'
        );
        emailTemplate = await getEmailTemplateByStatus(templateType);
        if (!emailTemplate || emailTemplate.isDeleted) {
          logger.warn(
            `Email template type ${templateType} not found or deleted`
          );
          emailTemplate = null;
        } else {
          templateSource = 'templateType';
        }
      } catch (templateErr) {
        logger.error(
          `Error fetching email template by type: ${templateErr.message}`
        );
        emailTemplate = null;
      }
    }

    const baseUrl = process.env.FRONT_URL || '';
    const type = recipientType.toLowerCase();

    // Generate registration URL based on type
    const registrationUrl =
      type === 'client'
        ? `${baseUrl}client/client-add-qr-code`
        : `${baseUrl}vendor/vendor-add-qr-code`;

    // Generate QR code
    const qrCode = await QRCode.toDataURL(registrationUrl);
    const cid = 'qr-invite@qr';

    // Get sender name
    const senderName = user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : 'TalentBox Admin';

    const emailResults = {
      sent: 0,
      failed: 0,
      errors: [],
      recipients: [],
    };

    // Generate QR code HTML block for templates
    const qrCodeHtml = `
      <div style="text-align: center; margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%); border-radius: 16px;">
        <h3 style="color: #16213e; margin: 0 0 20px 0; font-size: 20px;">📱 Scan QR Code to Register</h3>
        <div style="display: inline-block; background: #ffffff; padding: 20px; border-radius: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
          <a href="${registrationUrl}">
            <img src="cid:${cid}" alt="QR Code" width="200" height="200" style="display: block; border-radius: 8px; cursor: pointer;" />
          </a>
        </div>
        <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">Scan with your phone camera or click the QR code</p>
      </div>
    `;

    // Send email to each recipient
    for (const recipient of normalizedRecipients) {
      try {
        let emailContent, emailSubject;

        // Use database template if available
        if (emailTemplate) {
          const replacements = {
            recipientName: recipient.name || 'User',
            recipientType: type.charAt(0).toUpperCase() + type.slice(1),
            senderName: senderName,
            registrationUrl: registrationUrl,
            customMessage: customMessage || '',
            qrCodeHtml: qrCodeHtml,
            FRONT_URL: process.env.FRONT_URL || '',
          };
          emailContent = replaceTemplatePlaceholders(
            emailTemplate.description,
            replacements
          );
          emailSubject = replaceTemplatePlaceholders(
            emailTemplate.subject,
            replacements
          );
        } else {
          // Use default template
          emailContent = generateQRCodeInviteTemplate({
            recipientName: recipient.name || 'User',
            recipientType: type.charAt(0).toUpperCase() + type.slice(1),
            senderName: senderName,
            qrCodeUrl: qrCode,
            registrationUrl: registrationUrl,
            customMessage: customMessage || '',
          });
          emailSubject = `You're Invited to Join TalentBox as a ${
            type.charAt(0).toUpperCase() + type.slice(1)
          }!`;
        }

        const emailResult = await sendingEmail({
          email_to: [recipient.email],
          subject: emailSubject,
          description: emailContent,
          inlineImages: [{ base64: qrCode, cid: cid }],
        });

        if (emailResult.success) {
          emailResults.sent++;
          emailResults.recipients.push({
            email: recipient.email,
            name: recipient.name,
            status: 'sent',
          });
        } else {
          emailResults.failed++;
          emailResults.errors.push({
            email: recipient.email,
            error: emailResult.error,
          });
          emailResults.recipients.push({
            email: recipient.email,
            name: recipient.name,
            status: 'failed',
            error: emailResult.error,
          });
        }
      } catch (emailError) {
        emailResults.failed++;
        emailResults.errors.push({
          email: recipient.email,
          error: emailError.message,
        });
        emailResults.recipients.push({
          email: recipient.email,
          name: recipient.name,
          status: 'failed',
          error: emailError.message,
        });
      }
    }

    logger.info(
      `QR code invites sent: ${emailResults.sent} successful, ${emailResults.failed} failed`
    );

    if (emailResults.sent === 0) {
      return HandleResponse(
        res,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to send any invite emails',
        emailResults
      );
    }

    return HandleResponse(
      res,
      true,
      StatusCodes.OK,
      `QR code invites sent successfully. ${emailResults.sent} sent, ${emailResults.failed} failed.`,
      {
        recipientType: type,
        registrationUrl: registrationUrl,
        templateUsed: {
          source: templateSource,
          _id: emailTemplate?._id || null,
          type: emailTemplate?.type || 'default',
          subject: emailTemplate?.subject || 'Default QR Code Invite Template',
        },
        ...emailResults,
      }
    );
  } catch (error) {
    logger.error(`Failed to send QR code invites: ${error.message}`);
    return HandleResponse(
      res,
      false,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to send QR code invites: ${error.message}`
    );
  }
};
