const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');

function checkWorkspace(directory, renderer, expectedMajor) {
  const workspaceRequire = createRequire(path.resolve(__dirname, '..', directory, 'package.json'));
  const reactPath = workspaceRequire.resolve('react');
  const reactVersion = workspaceRequire('react/package.json').version;
  const rendererPath = workspaceRequire.resolve(`${renderer}/package.json`);
  const rendererRequire = createRequire(rendererPath);
  const rendererVersion = rendererRequire(rendererPath).version;
  assert.equal(Number(reactVersion.split('.')[0]), expectedMajor, `${directory}: unexpected React major version`);
  assert.equal(rendererRequire.resolve('react'), reactPath, `${directory}: renderer resolves a different React instance`);
  if (renderer === 'react-dom') assert.equal(rendererVersion, reactVersion, 'Web React and React DOM versions must match');
  console.log(`${directory}: React ${reactVersion}; ${renderer} ${rendererVersion}; matching React resolution.`);
}

try {
  checkWorkspace('apps/web', 'react-dom', 18);
  checkWorkspace('apps/mobile', 'react-native', 19);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
