import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(serverDirectory, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

export function resolveUploadDir(env = process.env) {
  if (env.UPLOAD_DIR) return path.resolve(serverDirectory, env.UPLOAD_DIR);
  if (env.DB_PATH) return path.join(path.dirname(path.resolve(env.DB_PATH)), 'uploads');
  return path.join(serverDirectory, 'uploads');
}

export const uploadDir = resolveUploadDir();
