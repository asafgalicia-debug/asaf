const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateReleaseApiUrl } = require('./android-release-config.cjs');

test('accepts the HTTPS API endpoint and removes trailing slashes', () => {
  assert.equal(validateReleaseApiUrl('https://nucleo-erp-api.onrender.com/api/v1/'), 'https://nucleo-erp-api.onrender.com/api/v1');
});
for (const value of [undefined, '', 'bad', 'http://api.example.com/api/v1', 'https://localhost/api/v1',
  'https://device.localhost/api/v1', 'https://localhost./api/v1', 'https://127.0.0.1/api/v1', 'https://[::1]/api/v1', 'https://[::]/api/v1',
  'https://0.0.0.0/api/v1', 'https://user:secret@api.example.com/api/v1',
  'https://api.example.com/api/v1?token=secret', 'https://api.example.com/api/v1#fragment',
  'https://api.example.com/health/live', 'https://api.example.com']) {
  test(`rejects unsafe or incomplete release configuration ${value === undefined ? '(missing)' : String(value).replace('secret', '(redacted)')}`, () => {
    assert.throws(() => validateReleaseApiUrl(value));
  });
}
