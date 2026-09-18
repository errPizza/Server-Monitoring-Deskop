const { test } = require('node:test');
const assert = require('node:assert/strict');
const { apiUrl, assetPath } = require('../desktop/policy.cjs');
const base = 'https://example.com/api';
test('desktop transport only reaches the configured mobile API', () => {
  assert.equal(apiUrl(base, base + '/mobile/logs?limit=100'), base + '/mobile/logs?limit=100');
  for (const url of ['https://evil.com/api/mobile/logs', base + '/admin', base + '/mobile/../../admin', 'file:///etc/passwd', 'https://user:pass@example.com/api/mobile/logs']) assert.throws(() => apiUrl(base, url));
});
test('asset protocol cannot escape the packaged web directory', () => {
  assert.equal(assetPath('/app/dist', '/'), '/app/dist/index.html');
  assert.equal(assetPath('/app/dist', '/assets/logo.png'), '/app/dist/assets/logo.png');
  assert.throws(() => assetPath('/app/dist', '/%2e%2e/secret'));
});
