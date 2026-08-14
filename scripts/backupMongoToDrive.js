import loadEnv from '../src/helpers/loadEnv.js';
import { backupMongoToDrive } from '../src/helpers/mongoBackupToDrive.js';

loadEnv();

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
