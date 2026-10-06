const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const mobileDirectory = path.resolve(__dirname, '../apps/mobile');
const mobileRequire = createRequire(path.join(mobileDirectory, 'package.json'));
const mapFile = process.argv[2] || path.join(mobileDirectory, 'android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map');

try {
  const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  for (const name of ['react', 'react-native']) {
    const entries = [...new Set(map.sources
      .filter((source) => source.replaceAll('\\', '/').endsWith(`/${name}/index.js`))
      .map((source) => path.resolve(mobileDirectory, source.replace(/^[\\/]/, ''))))];
    assert.equal(entries.length, 1, `Expected one ${name} in the mobile bundle; found ${entries.length}: ${entries.join(', ')}`);
    assert.equal(entries[0], mobileRequire.resolve(name), `Bundle ${name} must match the mobile workspace`);
    console.log(`Mobile bundle: one ${name} instance (${mobileRequire(`${name}/package.json`).version}).`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
