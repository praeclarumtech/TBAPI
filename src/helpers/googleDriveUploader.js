import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KEYFILEPATH = path.join(__dirname, '../../credentials/google-service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

export const findOrCreateFolder = async (folderName, parentFolderId) => {
  const query = `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${folderName}' and '${parentFolderId}' in parents`;
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
  };

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
    supportsAllDrives: true,
  });

  return folder.data.id;
};

export const uploadFileToDrive = async (filePath, fileName, folderId) => {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'application/octet-stream',
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    supportsAllDrives: true,
    fields: 'id, name, webViewLink',
  });

  return response.data;
};

