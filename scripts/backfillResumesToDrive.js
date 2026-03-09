/**
 * One-time script: upload to Google Drive all applicant resumes that are still
 * stored as local URLs (because Drive upload failed e.g. invalid_grant).
 *
 * Run after fixing GOOGLE_DRIVE_REFRESH_TOKEN in production.
 *
 * Usage (from project root):
 *   node scripts/backfillResumesToDrive.js
 *
 * Optional: DRY_RUN=1 to only list applicants and files, no upload or DB update.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from '../src/helpers/dbConnection.js';
import Applicant from '../src/models/applicantModel.js';
import jobApplication from '../src/models/jobApplicantionModel.js';
import { updateApplicantById } from '../src/services/applicantService.js';
import { uploadResumeToDrive } from '../src/helpers/googleDriveUpload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

// Same as multer: files are under cwd/src/uploads/Attachments (or relative to project)
const attachmentsDir = path.join(process.cwd(), 'src', 'uploads', 'Attachments');

async function main() {
  await connectDB();

  // Applicants whose resumeUrl is a local URL (contains /uploads/Attachments/) and not already on Drive
  const query = {
    resumeUrl: { $exists: true, $ne: '' },
    $and: [
      { resumeUrl: { $regex: /\/uploads\/Attachments\//i } },
      { resumeUrl: { $not: { $regex: /drive\.google\.com/i } } },
    ],
  };

  const applicants = await Applicant.find(query).lean();
  console.log(`Found ${applicants.length} applicant(s) with local resume URL (not yet on Drive).`);

  if (applicants.length === 0) {
    console.log('Nothing to backfill.');
    process.exit(0);
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const applicant of applicants) {
    const resumeUrl = applicant.resumeUrl || '';
    const filename = resumeUrl.split('/').filter(Boolean).pop() || '';
    if (!filename) {
      console.warn(`Applicant ${applicant._id} (${applicant.email}): no filename in resumeUrl, skipping.`);
      skipped++;
      continue;
    }

    const localPath = path.join(attachmentsDir, filename);
    if (!fs.existsSync(localPath)) {
      console.warn(`Applicant ${applicant._id} (${applicant.email}): file not found: ${localPath}`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[DRY RUN] Would upload: ${filename} -> Drive and update applicant ${applicant._id} (${applicant.email})`);
      uploaded++;
      continue;
    }

    try {
      const driveUrl = await uploadResumeToDrive(localPath, filename);
      if (driveUrl) {
        await updateApplicantById(applicant._id, { $set: { resumeUrl: driveUrl } });
        await jobApplication.updateMany(
          { email: applicant.email },
          { $set: { resumeUrl: driveUrl } }
        );
        console.log(`Uploaded: ${filename} -> Drive for applicant ${applicant.email}`);
        uploaded++;
      } else {
        console.warn(`Upload returned null for: ${filename} (applicant ${applicant.email}). Check Drive config/token.`);
        failed++;
      }
    } catch (err) {
      console.error(`Error uploading ${filename} for applicant ${applicant.email}:`, err.message);
      failed++;
    }
  }

  console.log('\nDone.', { uploaded, skipped, failed });
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
