import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const backendDirectory = fileURLToPath(new URL('../', import.meta.url));
const downloadDirectory = fileURLToPath(new URL('../../node_modules/.cache/mongodb-stock-tests/', import.meta.url));
const vitestPackagePath = require.resolve('vitest/package.json');
const vitestExecutable = resolve(dirname(vitestPackagePath), require(vitestPackagePath).bin.vitest);

// Do not inherit binary overrides or an external database from the environment.
for (const key of Object.keys(process.env)) {
  if (key.startsWith('MONGOMS_')) delete process.env[key];
}
delete process.env.STOCK_TEST_MONGODB_URI;
process.env.MONGOMS_DOWNLOAD_DIR = downloadDirectory;
process.env.MONGOMS_PREFER_GLOBAL_PATH = 'false';

let replicaSet;
let child;
let interrupted = false;
const interrupt = () => { interrupted = true; child?.kill(); };
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
try {
  const { MongoMemoryReplSet } = await import('mongodb-memory-server-core');
  console.log('Starting an isolated local MongoDB replica set. The first run downloads MongoDB into the project cache.');
  replicaSet = await MongoMemoryReplSet.create({
    binary: { downloadDir: downloadDirectory },
    // Allow local startup on slower hosts; this changes no test assertion or remote access.
    instanceOpts: [{ launchTimeout: 60000 }],
    replSet: { count: 1, name: 'stockTests', ip: '127.0.0.1', storageEngine: 'wiredTiger' }
  });
  if (interrupted) throw new Error('Test run interrupted.');
  const uri = replicaSet.getUri();
  // Keep the test suite's existing localhost-only and generated-database guards.
  if (!uri.startsWith('mongodb://127.0.0.1:')) throw new Error('Unexpected replica set host.');
  const exitCode = await new Promise((resolve, reject) => {
    child = spawn(process.execPath, [vitestExecutable, 'run', '--config', 'vitest.stock.config.ts'], {
      cwd: backendDirectory, stdio: 'inherit', windowsHide: true,
      env: { ...process.env, STOCK_TEST_MONGODB_URI: uri }
    });
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
  process.exitCode = interrupted ? 1 : exitCode;
} catch (error) {
  console.error('Stock integration could not complete:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
} finally {
  // This runner owns only the replica set it just created, never Atlas or a user service.
  await replicaSet?.stop();
  process.removeListener('SIGINT', interrupt);
  process.removeListener('SIGTERM', interrupt);
}
