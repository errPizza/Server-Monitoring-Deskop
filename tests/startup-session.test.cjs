const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/services/StartupSession.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(compiled, sandbox);
const { restoreStartupSession } = sandbox.exports;

test('bypass enters offline without touching tokens or the powered-off RPi', async () => {
  const unexpected = async () => { throw new Error('Storage/network must not run'); };
  assert.equal(await restoreStartupSession({ bypass: true, mock: false, loadToken: unexpected, refresh: unexpected }), true);
});
test('normal mode without a token requires login and never refreshes', async () => {
  assert.equal(await restoreStartupSession({ bypass: false, mock: false, loadToken: async () => null, refresh: async () => { throw new Error('unexpected refresh'); } }), false);
});
test('normal mode restores a valid session and rejects an expired one', async () => {
  for (const valid of [true, false]) {
    assert.equal(await restoreStartupSession({ bypass: false, mock: false, loadToken: async () => 'token', refresh: async () => valid }), valid);
  }
});
test('storage failure propagates to the UI error handler', async () => {
  await assert.rejects(restoreStartupSession({ bypass: false, mock: false, loadToken: async () => { throw new Error('storage unavailable'); }, refresh: async () => true }), /storage unavailable/);
});
