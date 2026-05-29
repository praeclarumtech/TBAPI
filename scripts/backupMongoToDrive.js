import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { backupMongoToDrive } from '../src/helpers/mongoBackupToDrive.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

backupMongoToDrive()
  .then((result) => {
    if (result.uploadedToDrive) {
      console.log(
        `Mongo backup uploaded: ${result.fileName} (${result.webViewLink || result.driveFileId})`
      );
    } else {
      console.log(`Mongo backup stored locally: ${result.localBackupPath}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
