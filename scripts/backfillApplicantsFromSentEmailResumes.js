/**
 * Backfill missing applicants from resumes attached to sent email records.
 *
 * Usage:
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --dry-run
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --limit=50
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --email-id=<applicant_email_id>
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --from=2026-05-01 --to=2026-05-26
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --from-attachments --dry-run
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --from-attachments --attachments-dir=src/uploads/Attachments
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --from-drive --dry-run
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --from-drive --drive-folder-id=<folder_id>
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --from-drive --drive-file-id=<file_id>
 *
 * What it does:
 * - Reads applicant_email records that have attachments
 * - Or scans the local attachments folder when --from-attachments is used
 * - Or downloads/parses resumes from Google Drive when --from-drive is used
 * - Extracts applicant data from attached PDF/DOC/DOCX resumes
 * - Creates records in applicants only when the email/phone is not already present
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../src/helpers/dbConnection.js';
import applicantEmail from '../src/models/applicantEmailModel.js';
import Applicant from '../src/models/applicantModel.js';
import { applicantEnum } from '../src/utils/enum.js';
import {
  extractTextFromPDF,
  extractTextFromDocx,
  extractTextFromDoc,
  parseResumeText,
} from '../src/helpers/importResume.js';
import {
  extractMatchingRoleFromResume,
  extractSkillsFromResume,
} from '../src/services/applicantService.js';
import { getDriveClient } from '../src/helpers/googleDriveUpload.js';
import logger from '../src/loggers/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const emailIdArg = args.find((arg) => arg.startsWith('--email-id='));
const fromArg = args.find((arg) => arg.startsWith('--from='));
const toArg = args.find((arg) => arg.startsWith('--to='));
const attachmentsDirArg = args.find((arg) => arg.startsWith('--attachments-dir='));
const driveFolderIdArg = args.find((arg) => arg.startsWith('--drive-folder-id='));
const driveFileIdArg = args.find((arg) => arg.startsWith('--drive-file-id='));

const limit = limitArg ? Number(limitArg.split('=')[1]) : 0;
const emailId = emailIdArg ? emailIdArg.split('=')[1] : null;
const fromDate = fromArg ? fromArg.split('=')[1] : null;
const toDate = toArg ? toArg.split('=')[1] : null;
const fromAttachments = args.includes('--from-attachments');
const fromDrive = args.includes('--from-drive');
const attachmentsDir = path.resolve(
  projectRoot,
  attachmentsDirArg
    ? attachmentsDirArg.split('=')[1]
    : path.join('src', 'uploads', 'Attachments')
);
const driveFolderId = driveFolderIdArg
  ? driveFolderIdArg.split('=')[1]
  : process.env.GOOGLE_DRIVE_FOLDER_ID;
const driveFileId = driveFileIdArg ? driveFileIdArg.split('=')[1] : null;
const tempDriveDir = path.join(projectRoot, 'src', 'uploads', 'temp-drive-backfill');

const resumeExtensions = new Set(['.pdf', '.doc', '.docx']);
const resumeMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function getRecipients(emailRecord) {
  return Array.isArray(emailRecord.email_to)
    ? emailRecord.email_to.map(normalizeEmail).filter(Boolean)
    : [normalizeEmail(emailRecord.email_to)].filter(Boolean);
}

function resolveAttachmentPath(attachment) {
  const attachmentPath = attachment?.path || attachment?.filename;
  if (!attachmentPath) return null;

  if (path.isAbsolute(attachmentPath)) {
    return attachmentPath;
  }

  const fromProjectRoot = path.join(projectRoot, attachmentPath);
  if (fs.existsSync(fromProjectRoot)) {
    return fromProjectRoot;
  }

  return path.join(projectRoot, 'src', 'uploads', 'Attachments', attachmentPath);
}

function buildAttachmentFromFile(filePath) {
  return {
    filename: path.basename(filePath),
    path: filePath,
  };
}

function safeFileName(fileName) {
  const ext = path.extname(fileName);
  const baseName = path
    .basename(fileName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseName || 'resume'}${ext}`;
}

function getDriveViewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

function ensureDetails(summary) {
  if (!summary.details) {
    summary.details = {
      created: [],
      skippedDuplicate: [],
      skippedMissingRequired: [],
      parseFailed: [],
      errors: [],
    };
  }

  return summary.details;
}

function getAttachmentName(attachment, filePath) {
  return attachment?.filename || path.basename(filePath || '') || 'unknown';
}

function buildResumeUrl(filePath) {
  const fileName = path.basename(filePath);
  const baseUrl = (
    process.env.BASE_URL ||
    process.env.API_URL ||
    ''
  ).replace(/\/$/, '');
  const attachmentBasePath = (process.env.ATTACHMENT_BASE_PATH || '').replace(
    /\/$/,
    ''
  );

  if (baseUrl) {
    return `${baseUrl}${attachmentBasePath}/uploads/Attachments/${fileName}`;
  }

  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

async function extractResumeText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    return extractTextFromPDF(filePath);
  }

  if (ext === '.docx') {
    return extractTextFromDocx(filePath);
  }

  if (ext === '.doc') {
    return extractTextFromDoc(filePath);
  }

  return null;
}

function buildQuery() {
  const query = {
    'attachments.0': { $exists: true },
  };

  if (emailId) {
    if (!mongoose.Types.ObjectId.isValid(emailId)) {
      throw new Error(`Invalid --email-id value: ${emailId}`);
    }
    query._id = new mongoose.Types.ObjectId(emailId);
  }

  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) {
      query.createdAt.$gte = new Date(`${fromDate}T00:00:00.000Z`);
    }
    if (toDate) {
      query.createdAt.$lte = new Date(`${toDate}T23:59:59.999Z`);
    }
  }

  return query;
}

async function applicantExists(email, phoneNumber) {
  const duplicateConditions = [];

  if (email) {
    duplicateConditions.push({ email });
  }

  if (phoneNumber) {
    duplicateConditions.push({ 'phone.phoneNumber': phoneNumber });
  }

  if (duplicateConditions.length === 0) return null;

  return Applicant.findOne({ $or: duplicateConditions }).select(
    '_id email phone'
  );
}

async function processAttachment(emailRecord, attachment, summary) {
  const filePath = resolveAttachmentPath(attachment);
  const ext = filePath ? path.extname(filePath).toLowerCase() : '';

  if (!filePath || !resumeExtensions.has(ext)) {
    summary.skippedNotResume += 1;
    return;
  }

  if (!fs.existsSync(filePath)) {
    summary.missingFile += 1;
    ensureDetails(summary).errors.push({
      type: 'missingFile',
      file: getAttachmentName(attachment, filePath),
      path: filePath,
      source: emailRecord._id,
    });
    logger.warn(
      `[EmailResumeBackfill] missing file source=${emailRecord._id} path=${filePath}`
    );
    return;
  }

  const resumeText = await extractResumeText(filePath);
  if (!resumeText) {
    summary.parseFailed += 1;
    ensureDetails(summary).parseFailed.push({
      file: getAttachmentName(attachment, filePath),
      path: filePath,
      driveFileId: attachment.driveFileId,
      driveUrl: attachment.driveFileId
        ? getDriveViewUrl(attachment.driveFileId)
        : undefined,
    });
    logger.warn(
      `[EmailResumeBackfill] text extraction failed source=${emailRecord._id} file=${filePath}`
    );
    return;
  }

  const parsedData = parseResumeText(resumeText);
  const recipients = getRecipients(emailRecord);
  const parsedEmail = normalizeEmail(parsedData.email);
  const fallbackEmail = recipients.length === 1 ? recipients[0] : '';
  const email = parsedEmail || fallbackEmail;
  const phoneNumber = parsedData.phone?.phoneNumber || '';

  if (!email || !phoneNumber) {
    summary.skippedMissingRequired += 1;
    ensureDetails(summary).skippedMissingRequired.push({
      file: getAttachmentName(attachment, filePath),
      email: email || '',
      phoneNumber: phoneNumber || '',
      driveFileId: attachment.driveFileId,
      driveUrl: attachment.driveFileId
        ? getDriveViewUrl(attachment.driveFileId)
        : undefined,
    });
    logger.warn(
      `[EmailResumeBackfill] missing email/phone source=${emailRecord._id} file=${filePath} email=${email || 'none'}`
    );
    return;
  }

  const existingApplicant = await applicantExists(email, phoneNumber);
  if (existingApplicant) {
    summary.skippedDuplicate += 1;
    ensureDetails(summary).skippedDuplicate.push({
      file: getAttachmentName(attachment, filePath),
      email,
      phoneNumber,
      existingApplicantId: existingApplicant._id.toString(),
      driveFileId: attachment.driveFileId,
      driveUrl: attachment.driveFileId
        ? getDriveViewUrl(attachment.driveFileId)
        : undefined,
    });
    logger.info(
      `[EmailResumeBackfill] duplicate applicant source=${emailRecord._id} existingApplicantId=${existingApplicant._id} email=${email}`
    );
    return;
  }

  const [otherSkills, appliedRole] = await Promise.all([
    extractSkillsFromResume(resumeText),
    extractMatchingRoleFromResume(resumeText),
  ]);

  const applicantData = {
    ...parsedData,
    email,
    phone: {
      phoneNumber,
      whatsappNumber: parsedData.phone?.whatsappNumber || phoneNumber,
    },
    otherSkills,
    appliedRole,
    addedBy: applicantEnum.RESUME,
    isActive: true,
    resumeUrl: attachment.driveFileId
      ? getDriveViewUrl(attachment.driveFileId)
      : buildResumeUrl(filePath),
    meta: {
      ...(parsedData.meta || {}),
      source: emailRecord.source || 'applicant_email_resume_backfill',
      sourceEmailId:
        emailRecord._id === 'local-attachments'
          ? undefined
          : emailRecord._id.toString(),
      sourceAttachment: attachment.filename || path.basename(filePath),
      sourceDriveFileId: attachment.driveFileId,
    },
  };

  if (dryRun) {
    summary.created += 1;
    ensureDetails(summary).created.push({
      file: getAttachmentName(attachment, filePath),
      email,
      phoneNumber,
      driveFileId: attachment.driveFileId,
      driveUrl: attachment.driveFileId
        ? getDriveViewUrl(attachment.driveFileId)
        : undefined,
    });
    logger.info(
      `[EmailResumeBackfill] DRY-RUN create email=${email} file=${path.basename(
        filePath
      )}`
    );
    return;
  }

  const applicant = await Applicant.create(applicantData);
  summary.created += 1;
  ensureDetails(summary).created.push({
    file: getAttachmentName(attachment, filePath),
    email,
    phoneNumber,
    applicantId: applicant._id.toString(),
    driveFileId: attachment.driveFileId,
    driveUrl: attachment.driveFileId
      ? getDriveViewUrl(attachment.driveFileId)
      : undefined,
  });
  logger.info(
    `[EmailResumeBackfill] created applicantId=${applicant._id} email=${email}`
  );
}

function getLocalResumeFiles() {
  if (!fs.existsSync(attachmentsDir)) {
    throw new Error(`Attachments directory not found: ${attachmentsDir}`);
  }

  const files = fs
    .readdirSync(attachmentsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(attachmentsDir, entry.name))
    .filter((filePath) => resumeExtensions.has(path.extname(filePath).toLowerCase()))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  return limit > 0 ? files.slice(0, limit) : files;
}

async function processLocalAttachments(summary) {
  const files = getLocalResumeFiles();
  const localRecord = {
    _id: 'local-attachments',
    email_to: [],
    source: 'local_attachment_resume_backfill',
  };

  summary.localFiles = files.length;
  logger.info(
    `[EmailResumeBackfill] scanning local attachments files=${files.length} dir=${attachmentsDir}`
  );

  for (const filePath of files) {
    summary.attachments += 1;
    try {
      await processAttachment(localRecord, buildAttachmentFromFile(filePath), summary);
    } catch (error) {
      summary.errors += 1;
      ensureDetails(summary).errors.push({
        type: 'localAttachmentError',
        file: path.basename(filePath),
        path: filePath,
        message: error.message,
      });
      logger.error(
        `[EmailResumeBackfill] failed local attachment=${path.basename(filePath)}: ${error.message}`
      );
    }
  }
}

function isResumeDriveFile(file) {
  const ext = path.extname(file.name || '').toLowerCase();
  return resumeExtensions.has(ext) || resumeMimeTypes.has(file.mimeType);
}

function buildDriveListQuery() {
  const queryParts = [`'${driveFolderId}' in parents`, 'trashed = false'];

  if (fromDate) {
    queryParts.push(`modifiedTime >= '${fromDate}T00:00:00.000Z'`);
  }

  if (toDate) {
    queryParts.push(`modifiedTime <= '${toDate}T23:59:59.999Z'`);
  }

  return queryParts.join(' and ');
}

async function listDriveFiles(drive) {
  if (driveFileId) {
    const response = await drive.files.get({
      fileId: driveFileId,
      supportsAllDrives: true,
      fields: 'id, name, mimeType, modifiedTime',
    });
    return [response.data].filter(isResumeDriveFile);
  }

  if (!driveFolderId) {
    throw new Error(
      'Google Drive folder id is required. Set GOOGLE_DRIVE_FOLDER_ID or pass --drive-folder-id=<folder_id>.'
    );
  }

  const files = [];
  let pageToken;

  do {
    const response = await drive.files.list({
      q: buildDriveListQuery(),
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 100,
      pageToken,
    });

    files.push(...(response.data.files || []).filter(isResumeDriveFile));
    pageToken = response.data.nextPageToken;
  } while (pageToken && (limit <= 0 || files.length < limit));

  return limit > 0 ? files.slice(0, limit) : files;
}

async function downloadDriveFile(drive, file) {
  fs.mkdirSync(tempDriveDir, { recursive: true });

  const ext = path.extname(file.name || '');
  const fallbackName = `${file.id}${ext || '.pdf'}`;
  const localPath = path.join(tempDriveDir, `${file.id}_${safeFileName(file.name || fallbackName)}`);
  const response = await drive.files.get(
    {
      fileId: file.id,
      alt: 'media',
      supportsAllDrives: true,
    },
    {
      responseType: 'stream',
    }
  );

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(localPath);
    response.data
      .on('end', resolve)
      .on('error', reject)
      .pipe(writeStream)
      .on('error', reject);
  });

  return localPath;
}

async function processDriveFiles(summary) {
  const client = await getDriveClient();
  if (!client) {
    throw new Error(
      'Google Drive auth failed. Check GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN, and GOOGLE_DRIVE_FOLDER_ID.'
    );
  }

  const files = await listDriveFiles(client.drive);
  const driveRecord = {
    _id: 'google-drive',
    email_to: [],
    source: 'google_drive_resume_backfill',
  };

  summary.driveFiles = files.length;
  logger.info(`[EmailResumeBackfill] scanning Google Drive files=${files.length}`);

  for (const file of files) {
    let localPath;
    summary.attachments += 1;
    try {
      localPath = await downloadDriveFile(client.drive, file);
      await processAttachment(
        driveRecord,
        {
          filename: file.name,
          path: localPath,
          driveFileId: file.id,
        },
        summary
      );
    } catch (error) {
      summary.errors += 1;
      ensureDetails(summary).errors.push({
        type: 'driveFileError',
        file: file.name,
        driveFileId: file.id,
        driveUrl: getDriveViewUrl(file.id),
        message: error.message,
      });
      logger.error(
        `[EmailResumeBackfill] failed driveFileId=${file.id} name=${file.name}: ${error.message}`
      );
    } finally {
      if (localPath && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
  }
}

async function run() {
  await connectDB();

  if (fromDrive) {
    const summary = {
      emailRecords: 0,
      driveFiles: 0,
      attachments: 0,
      created: 0,
      skippedDuplicate: 0,
      skippedMissingRequired: 0,
      skippedNotResume: 0,
      missingFile: 0,
      parseFailed: 0,
      errors: 0,
    };

    logger.info(`[EmailResumeBackfill] start fromDrive=true dryRun=${dryRun}`);
    await processDriveFiles(summary);
    logger.info(`[EmailResumeBackfill] done ${JSON.stringify(summary)}`);
    return;
  }

  if (fromAttachments) {
    const summary = {
      emailRecords: 0,
      localFiles: 0,
      attachments: 0,
      created: 0,
      skippedDuplicate: 0,
      skippedMissingRequired: 0,
      skippedNotResume: 0,
      missingFile: 0,
      parseFailed: 0,
      errors: 0,
    };

    logger.info(`[EmailResumeBackfill] start fromAttachments=true dryRun=${dryRun}`);
    await processLocalAttachments(summary);
    logger.info(`[EmailResumeBackfill] done ${JSON.stringify(summary)}`);
    return;
  }

  const query = buildQuery();
  let recordsQuery = applicantEmail
    .find(query)
    .sort({ createdAt: -1 })
    .select('email_to attachments createdAt');

  if (limit > 0) {
    recordsQuery = recordsQuery.limit(limit);
  }

  const emailRecords = await recordsQuery.lean();
  const summary = {
    emailRecords: emailRecords.length,
    attachments: 0,
    created: 0,
    skippedDuplicate: 0,
    skippedMissingRequired: 0,
    skippedNotResume: 0,
    missingFile: 0,
    parseFailed: 0,
    errors: 0,
  };

  logger.info(
    `[EmailResumeBackfill] start records=${emailRecords.length} dryRun=${dryRun}`
  );

  for (const emailRecord of emailRecords) {
    for (const attachment of emailRecord.attachments || []) {
      summary.attachments += 1;
      try {
        await processAttachment(emailRecord, attachment, summary);
      } catch (error) {
        summary.errors += 1;
        ensureDetails(summary).errors.push({
          type: 'emailAttachmentError',
          file: attachment?.filename,
          sourceEmailId: emailRecord._id.toString(),
          message: error.message,
        });
        logger.error(
          `[EmailResumeBackfill] failed emailId=${emailRecord._id} attachment=${attachment?.filename}: ${error.message}`
        );
      }
    }
  }

  logger.info(`[EmailResumeBackfill] done ${JSON.stringify(summary)}`);
}

run()
  .catch((error) => {
    logger.error(`[EmailResumeBackfill] failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
  });
