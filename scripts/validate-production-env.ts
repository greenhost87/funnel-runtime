import { getRequiredEnv, isNodeEnvironment } from '@/system/config/environment';

if (!isNodeEnvironment('production')) {
  throw new Error('NODE_ENV must be production');
}

getRequiredEnv('SQLITE_PATH');
getRequiredEnv('ADMIN_PASSWORD');
getRequiredEnv('ADMIN_SIGNING_SECRET');
new URL(getRequiredEnv('APP_URL'));

console.log('Production environment is valid');
