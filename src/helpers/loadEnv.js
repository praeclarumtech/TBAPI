import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let loaded = false;

export const loadEnv = () => {
  if (loaded) return;

  const nodeEnv = process.env.NODE_ENV?.trim();
  const baseEnvPath = path.resolve(process.cwd(), '.env');

  if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath });
  }

  if (nodeEnv) {
    const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
    }
  }

  loaded = true;
};

export default loadEnv;
