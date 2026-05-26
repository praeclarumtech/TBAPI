/**
 * Backfill missing applicants from resumes attached to sent email records.
 *
 * Usage:
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --dry-run
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --limit=50
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --email-id=<applicant_email_id>
 *   node scripts/backfillApplicantsFromSentEmailResumes.js --from=2026-05-01 --to=2026-05-26
 *
 * What it does:
 * - Reads applicant_email records that have attachments
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

const limit = limitArg ? Number(limitArg.split('=')[1]) : 0;
const emailId = emailIdArg ? emailIdArg.split('=')[1] : null;
const fromDate = fromArg ? fromArg.split('=')[1] : null;
const toDate = toArg ? toArg.split('=')[1] : null;

const resumeExtensions = new Set(['.pdf', '.doc', '.docx']);

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
    logger.warn(
      `[EmailResumeBackfill] missing file emailId=${emailRecord._id} path=${filePath}`
    );
    return;
  }

  const resumeText = await extractResumeText(filePath);
  if (!resumeText) {
    summary.parseFailed += 1;
    logger.warn(
      `[EmailResumeBackfill] text extraction failed emailId=${emailRecord._id} file=${filePath}`
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
    logger.warn(
      `[EmailResumeBackfill] missing email/phone emailId=${emailRecord._id} file=${filePath} email=${email || 'none'}`
    );
    return;
  }

  const existingApplicant = await applicantExists(email, phoneNumber);
  if (existingApplicant) {
    summary.skippedDuplicate += 1;
    logger.info(
      `[EmailResumeBackfill] duplicate applicant emailId=${emailRecord._id} existingApplicantId=${existingApplicant._id} email=${email}`
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
    resumeUrl: buildResumeUrl(filePath),
    meta: {
      ...(parsedData.meta || {}),
      source: 'applicant_email_resume_backfill',
      sourceEmailId: emailRecord._id.toString(),
      sourceAttachment: attachment.filename || path.basename(filePath),
    },
  };

  if (dryRun) {
    summary.created += 1;
    logger.info(
      `[EmailResumeBackfill] DRY-RUN create email=${email} file=${path.basename(
        filePath
      )}`
    );
    return;
  }

  const applicant = await Applicant.create(applicantData);
  summary.created += 1;
  logger.info(
    `[EmailResumeBackfill] created applicantId=${applicant._id} email=${email}`
  );
}

async function run() {
  await connectDB();

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
