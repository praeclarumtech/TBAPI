import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import logger from '../loggers/logger.js';

// drive scope for uploads (full drive so we can write to user's folder)
const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Load service account email and private key from env or key file.
 * @returns {{ clientEmail: string, privateKey: string } | null}
 */
function loadServiceAccountCredentials() {
  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFilePath && fs.existsSync(keyFilePath)) {
    try {
      const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      return {
        clientEmail: keyFile.client_email,
        privateKey: keyFile.private_key,
      };
    } catch (e) {
      logger.error(`Failed to read key file: ${e.message}`);
      return null;
    }
  }
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;
  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
}

/**
 * Get authenticated Google Drive client.
 * Prefers OAuth2 (GOOGLE_DRIVE_REFRESH_TOKEN) for Gmail/personal accounts so uploads use user's quota.
 * Falls back to service account (with optional impersonation for Workspace).
 * @returns {Promise<{ drive: import('googleapis').drive_v3.Drive } | null>}
 */
async function getDriveClient() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    logger.warn('GOOGLE_DRIVE_FOLDER_ID is not set; skipping Drive upload');
    return null;
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN?.trim();

  try {
    // Option 1: OAuth2 with refresh token (for Gmail/personal – uploads use that user's Drive quota)
    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost:8765/callback' // redirect not used for refresh
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      return { drive };
    }

    // Option 2: Service account (with optional domain-wide delegation for Workspace)
    const creds = loadServiceAccountCredentials();
    if (!creds) {
      logger.warn(
        'Google Drive: set GOOGLE_DRIVE_CLIENT_ID + GOOGLE_DRIVE_CLIENT_SECRET + GOOGLE_DRIVE_REFRESH_TOKEN (run scripts/getDriveRefreshToken.js) or use service account credentials'
      );
      return null;
    }

    const impersonateEmail = process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL?.trim();
    let auth;

    if (impersonateEmail) {
      const jwt = new google.auth.JWT({
        email: creds.clientEmail,
        key: creds.privateKey,
        scopes: SCOPES,
        subject: impersonateEmail,
      });
      await jwt.authorize();
      auth = jwt;
      logger.info(`Google Drive using impersonation: ${impersonateEmail}`);
    } else {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: creds.clientEmail,
          private_key: creds.privateKey,
        },
        scopes: SCOPES,
      });
    }

    const drive = google.drive({ version: 'v3', auth });
    return { drive };
  } catch (err) {
    logger.error(`Google Drive auth failed: ${err.message}`);
    return null;
  }
}

/**
 * Upload a local file to the configured Google Drive folder (CV/Resume folder).
 * @param {string} localFilePath - Full path to the file on disk (e.g. from multer)
 * @param {string} [originalName] - Original filename for the Drive file name
 * @returns {Promise<string | null>} - Web view URL of the uploaded file, or null on failure
 */
export async function uploadResumeToDrive(localFilePath, originalName) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) return null;

  if (!localFilePath || !fs.existsSync(localFilePath)) {
    logger.warn(`Google Drive upload: file not found: ${localFilePath}`);
    return null;
  }

  const client = await getDriveClient();
  if (!client) return null;

  const name = originalName || path.basename(localFilePath);
  const mimeType =
    {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }[path.extname(name).toLowerCase()] || 'application/octet-stream';

  try {
    const response = await client.drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: fs.createReadStream(localFilePath),
      },
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = response.data.id;
    const webViewLink =
      response.data.webViewLink ||
      `https://drive.google.com/file/d/${fileId}/view`;

    logger.info(`Resume uploaded to Drive: ${name} -> ${webViewLink}`);
    return webViewLink;
  } catch (err) {
    logger.error(`Google Drive upload failed: ${err.message}`);
    return null;
  }
}
