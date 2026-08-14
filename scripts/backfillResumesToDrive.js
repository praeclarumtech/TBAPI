/**
 * Backfill local applicant resumes to Google Drive.
 *
 * Usage:
 *   node scripts/backfillResumesToDrive.js
 *   node scripts/backfillResumesToDrive.js --limit=100
 *   node scripts/backfillResumesToDrive.js --dry-run
 *
 * What it does:
 * - Finds applicants whose resumeUrl is NOT a Google Drive link
 * - Resolves local file from /src/uploads/Attachments/<filename>
 * - Uploads file to Google Drive
 * - Updates Applicant.resumeUrl and related jobApplication.resumeUrl
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import loadEnv from '../src/helpers/loadEnv.js';
import connectDB from '../src/helpers/dbConnection.js';
import Applicant from '../src/models/applicantModel.js';
import jobApplication from '../src/models/jobApplicantionModel.js';
import { uploadResumeToDrive } from '../src/helpers/googleDriveUpload.js';
import logger from '../src/loggers/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 0;

const attachmentsDir = path.join(
  process.cwd(),
  'src',
  'uploads',
  'Attachments'
);

function extractFileName(resumeUrl) {
  if (!resumeUrl || typeof resumeUrl !== 'string') return null;
  const trimmed = resumeUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return path.basename(parsed.pathname);
  } catch {
    return path.basename(trimmed);
  }
}

function isDriveUrl(url) {
  return /drive\.google\.com/i.test(url || '');
}

async function run() {
  await connectDB();

  const query = {
    isDeleted: false,
    resumeUrl: { $exists: true, $ne: '' },
  };

  const candidates = await Applicant.find(query)
    .select('_id email resumeUrl')
    .lean();

  const localCandidates = candidates.filter(
    (item) => item.resumeUrl && !isDriveUrl(item.resumeUrl)
  );

  const selected = limit > 0 ? localCandidates.slice(0, limit) : localCandidates;

  logger.info(
    `[Backfill] found=${localCandidates.length}, selected=${selected.length}, dryRun=${dryRun}`
  );

  const summary = {
    total: selected.length,
    uploaded: 0,
    missingFile: 0,
    uploadFailed: 0,
    skippedInvalid: 0,
  };

  for (const applicant of selected) {
    const fileName = extractFileName(applicant.resumeUrl);
    if (!fileName || fileName === '.' || fileName === '/') {
      summary.skippedInvalid += 1;
      logger.warn(
        `[Backfill] skipped invalid resumeUrl applicantId=${applicant._id} resumeUrl=${applicant.resumeUrl}`
      );
      continue;
    }

    const localPath = path.join(attachmentsDir, fileName);
    if (!fs.existsSync(localPath)) {
      summary.missingFile += 1;
      logger.warn(
        `[Backfill] file missing applicantId=${applicant._id} file=${localPath}`
      );
      continue;
    }

    if (dryRun) {
      logger.info(
        `[Backfill] DRY-RUN applicantId=${applicant._id} email=${applicant.email} file=${fileName}`
      );
      continue;
    }

    const driveUrl = await uploadResumeToDrive(localPath, fileName);
    if (!driveUrl) {
      summary.uploadFailed += 1;
      logger.warn(
        `[Backfill] upload failed applicantId=${applicant._id} email=${applicant.email} file=${fileName}`
      );
      continue;
    }

    await Applicant.updateOne({ _id: applicant._id }, { $set: { resumeUrl: driveUrl } });
    if (applicant.email) {
      await jobApplication.updateMany(
        { email: applicant.email },
        { $set: { resumeUrl: driveUrl } }
      );
    }

    summary.uploaded += 1;
    logger.info(
      `[Backfill] uploaded applicantId=${applicant._id} email=${applicant.email} driveUrl=${driveUrl}`
    );
  }

  logger.info(
    `[Backfill] done total=${summary.total} uploaded=${summary.uploaded} missingFile=${summary.missingFile} uploadFailed=${summary.uploadFailed} skippedInvalid=${summary.skippedInvalid}`
  );
}

run()
  .catch((error) => {
    logger.error(`[Backfill] failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
  });
