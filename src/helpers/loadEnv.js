import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let loaded = false;

export const loadEnv = () => {
  if (loaded) return;

  const nodeEnv = process.env.NODE_ENV?.trim();
  const envFiles = [];

  if (nodeEnv) {
    envFiles.push(`.env.${nodeEnv}`);
  }

  envFiles.push('.env');

  envFiles.forEach((fileName) => {
    const envPath = path.resolve(process.cwd(), fileName);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  });

  loaded = true;
};

export default loadEnv;
