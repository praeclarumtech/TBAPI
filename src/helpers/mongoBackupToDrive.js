import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { getDriveClient } from './googleDriveUpload.js';
import logger from '../loggers/logger.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

function getLocalBackupDir() {
  return (
    process.env.MONGO_BACKUP_LOCAL_DIR ||
    path.join(projectRoot, 'src', 'uploads', 'mongo-backups')
  );
}

function getMongoUri() {
  return process.env.DBURL || process.env.MONGO_URI || process.env.DATABASE;
}

function getWeekFolderName(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);

  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function buildBackupFileName(weekFolderName, date = new Date()) {
  const timestamp = date.toISOString().replace(/[:.]/g, '-');
  return `mongodb-backup-${weekFolderName}-${timestamp}.archive.gz`;
}

function shouldUploadToDrive() {
  return process.env.MONGO_BACKUP_UPLOAD_TO_DRIVE === 'true';
}

function getLocalRetentionDays() {
  const retentionDays = Number(process.env.MONGO_BACKUP_RETENTION_DAYS || 21);
  return Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 21;
}

function getDriveParentFolderId() {
  return process.env.MONGO_BACKUP_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
}

function getBackupDriveClientOptions(parentFolderId) {
  return {
    folderId: parentFolderId,
    clientId: process.env.MONGO_BACKUP_DRIVE_CLIENT_ID,
    clientSecret: process.env.MONGO_BACKUP_DRIVE_CLIENT_SECRET,
    refreshToken: process.env.MONGO_BACKUP_DRIVE_REFRESH_TOKEN,
    keyFilePath: process.env.MONGO_BACKUP_GOOGLE_APPLICATION_CREDENTIALS,
    clientEmail: process.env.MONGO_BACKUP_DRIVE_CLIENT_EMAIL,
    privateKey: process.env.MONGO_BACKUP_DRIVE_PRIVATE_KEY,
    impersonateEmail: process.env.MONGO_BACKUP_DRIVE_IMPERSONATE_EMAIL,
  };
}

function cleanupOldLocalBackups(localBackupDir, currentFileName) {
  const retentionMs = getLocalRetentionDays() * 24 * 60 * 60 * 1000;
  const cutoffTime = Date.now() - retentionMs;
  const deletedFiles = [];

  if (!fs.existsSync(localBackupDir)) {
    return deletedFiles;
  }

  for (const entry of fs.readdirSync(localBackupDir, { withFileTypes: true })) {
    if (
      !entry.isFile() ||
      entry.name === currentFileName ||
      !entry.name.startsWith('mongodb-backup-') ||
      !entry.name.endsWith('.archive.gz')
    ) {
      continue;
    }

    const filePath = path.join(localBackupDir, entry.name);
    const stats = fs.statSync(filePath);

    if (stats.mtimeMs < cutoffTime) {
      fs.unlinkSync(filePath);
      deletedFiles.push(filePath);
    }
  }

  if (deletedFiles.length) {
    logger.info(`Deleted ${deletedFiles.length} old Mongo backup file(s)`);
  }

  return deletedFiles;
}

async function listDriveFiles(drive, query, fields = 'files(id, name), nextPageToken') {
  const files = [];
  let pageToken;

  do {
    const response = await drive.files.list({
      q: query,
      fields,
      pageToken,
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    files.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return files;
}

async function cleanupOldDriveBackups(drive, parentFolderId, currentFileId) {
  const cutoffDate = new Date(
    Date.now() - getLocalRetentionDays() * 24 * 60 * 60 * 1000
  ).toISOString();
  const deletedFiles = [];
  const backupFolders = await listDriveFiles(
    drive,
    `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    'files(id, name), nextPageToken'
  );
  const folderIds = backupFolders
    .filter((folder) => /^\d{4}-W\d{2}$/.test(folder.name))
    .map((folder) => folder.id);

  for (const folderId of folderIds) {
    const oldBackups = await listDriveFiles(
      drive,
      `'${folderId}' in parents and name contains 'mongodb-backup-' and createdTime < '${cutoffDate}' and trashed=false`,
      'files(id, name, createdTime), nextPageToken'
    );

    for (const file of oldBackups) {
      if (
        file.id === currentFileId ||
        !file.name.startsWith('mongodb-backup-') ||
        !file.name.endsWith('.archive.gz')
      ) {
        continue;
      }

      await drive.files.delete({
        fileId: file.id,
        supportsAllDrives: true,
      });
      deletedFiles.push(file.name);
    }
  }

  if (deletedFiles.length) {
    logger.info(`Deleted ${deletedFiles.length} old Mongo backup file(s) from Google Drive`);
  }

  return deletedFiles;
}

async function getOrCreateDriveFolder(drive, folderName, parentFolderId) {
  const safeFolderName = folderName.replace(/'/g, "\\'");
  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and name='${safeFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (response.data.files?.length) {
    return response.data.files[0].id;
  }

  const createdFolder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  return createdFolder.data.id;
}

async function createMongoDump(backupPath) {
  const mongoUri = getMongoUri();
  if (!mongoUri) {
    throw new Error('Mongo backup failed: DBURL, MONGO_URI, or DATABASE is not configured');
  }

  try {
    await execFileAsync(process.env.MONGODUMP_PATH || 'mongodump', [
      `--uri=${mongoUri}`,
      `--archive=${backupPath}`,
      '--gzip',
    ]);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        'Mongo backup failed: mongodump is not installed or not available in PATH'
      );
    }

    throw error;
  }
}

async function uploadBackupAndCleanupDrive(backupPath, fileName, weekFolderName) {
  const parentFolderId = getDriveParentFolderId();
  if (!parentFolderId) {
    throw new Error('Mongo backup failed: GOOGLE_DRIVE_FOLDER_ID is not configured');
  }

  const client = await getDriveClient(getBackupDriveClientOptions(parentFolderId));
  if (!client) {
    throw new Error('Mongo backup failed: Google Drive client is not available');
  }

  const weekFolderId = await getOrCreateDriveFolder(
    client.drive,
    weekFolderName,
    parentFolderId
  );

  const response = await client.drive.files.create({
    requestBody: {
      name: fileName,
      parents: [weekFolderId],
    },
    media: {
      mimeType: 'application/gzip',
      body: fs.createReadStream(backupPath),
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });
  const deletedDriveBackups = await cleanupOldDriveBackups(
    client.drive,
    parentFolderId,
    response.data.id
  );

  return {
    uploadedFile: response.data,
    deletedDriveBackups,
  };
}

export async function backupMongoToDrive() {
  const localBackupDir = getLocalBackupDir();
  fs.mkdirSync(localBackupDir, { recursive: true });

  const weekFolderName = getWeekFolderName();
  const fileName = buildBackupFileName(weekFolderName);
  const backupPath = path.join(localBackupDir, fileName);

  try {
    logger.info(`Mongo backup started: ${fileName}`);
    await createMongoDump(backupPath);
    const deletedLocalBackups = cleanupOldLocalBackups(localBackupDir, fileName);

    if (!shouldUploadToDrive()) {
      logger.info(`Mongo backup stored locally: ${backupPath}`);
      return {
        fileName,
        weekFolderName,
        localBackupPath: backupPath,
        uploadedToDrive: false,
        deletedLocalBackups,
      };
    }

    const { uploadedFile, deletedDriveBackups } = await uploadBackupAndCleanupDrive(
      backupPath,
      fileName,
      weekFolderName
    );
    logger.info(
      `Mongo backup uploaded to Google Drive: ${uploadedFile.webViewLink || uploadedFile.id}`
    );

    return {
      fileName,
      weekFolderName,
      localBackupPath: backupPath,
      driveFileId: uploadedFile.id,
      webViewLink: uploadedFile.webViewLink,
      uploadedToDrive: true,
      deletedLocalBackups,
      deletedDriveBackups,
    };
  } finally {
    if (shouldUploadToDrive() && fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  }
}
