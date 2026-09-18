const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createStorageService, storageError } = require('../backend/storage');

async function fixture(t) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'agm-storage-'));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const root = path.join(base, 'disk'); await fs.mkdir(root);
  await fs.mkdir(path.join(root, 'docs'));
  await fs.writeFile(path.join(root, 'docs', 'notes.txt'), 'Hola desde la RPi.');
  await fs.writeFile(path.join(base, 'outside.txt'), 'not shared');
  const devices = async () => [
    { name: 'sda', type: 'disk', size: 4096, model: 'Test SSD', children: [{ name: 'sda1', type: 'part', size: 4096, fstype: 'ext4', mountpoints: [root] }] },
    { name: 'sdb', type: 'disk', size: 8192, children: [{ name: 'sdb1', type: 'part', size: 8192, fstype: 'exfat', mountpoints: [null] }] },
  ];
  const service = createStorageService({ roots: [root], devices });
  const disks = await service.disks();
  return { base, root, service, devices, disks, volume: disks[0].volumes[0].id };
}
test('independent disks, actual statfs sizes and unmounted volumes', async t => {
  const { root, disks } = await fixture(t);
  assert.equal(disks.length, 2);
  const stats = await fs.statfs(root);
  assert.equal(disks[0].volumes[0].totalBytes, stats.blocks * stats.bsize);
  assert.equal(disks[0].volumes[0].browsable, true);
  assert.equal(disks[1].volumes[0].browsable, false);
  assert.equal(disks[1].volumes[0].usedBytes, null);
});
test('listing and preview read files, no implicit access without an allowlist', async t => {
  const { service, volume, devices } = await fixture(t);
  const directory = await service.directory(volume);
  assert.equal(directory.entries[0].kind, 'directory');
  assert.equal(directory.entries[0].path, 'docs');
  assert.equal((await service.file(volume, 'docs/notes.txt')).content, 'Hola desde la RPi.');
  const locked = createStorageService({ devices });
  assert.equal((await locked.disks())[0].volumes[0].browsable, false);
  await assert.rejects(locked.directory(volume), { status: 403 });
});
test('reject traversal, absolute paths, symlink files and symlink parents', async t => {
  const { root, base, service, volume } = await fixture(t);
  for (const name of ['../outside.txt', '/etc/passwd', 'docs/../../outside.txt', 'docs/./notes.txt', 'docs\\notes.txt', 'bad\0path']) {
    await assert.rejects(service.file(volume, name), { status: 400 });
  }
  await fs.symlink(path.join(base, 'outside.txt'), path.join(root, 'link'));
  await fs.symlink(base, path.join(root, 'linked-directory'));
  await assert.rejects(service.file(volume, 'link'));
  await assert.rejects(service.file(volume, 'linked-directory/outside.txt'));
  const directory = await service.directory(volume);
  assert.equal(directory.entries.find(entry => entry.name === 'link').kind, 'symlink');
});
test('bounded previews distinguish UTF-8, binary files and images', async t => {
  const { root, service, volume } = await fixture(t);
  await fs.writeFile(path.join(root, 'large.txt'), 'é'.repeat(200000));
  const text = await service.file(volume, 'large.txt');
  assert.equal(text.kind, 'text');assert.equal(text.truncated, true);assert.ok(Buffer.byteLength(text.content) <= 256 * 1024);
  await fs.writeFile(path.join(root, 'binary'), Buffer.from([0, 255, 0, 1]));
  assert.equal((await service.file(volume, 'binary')).kind, 'unsupported');
  await fs.writeFile(path.join(root, 'image.png'), Buffer.from([137,80,78,71,13,10,26,10]));
  assert.equal((await service.file(volume, 'image.png')).mimeType, 'image/png');
});
test('pagination returns later files without repeating the first page', async t => {
  const { root, service, volume } = await fixture(t);
  await Promise.all(Array.from({ length: 205 }, (_, index) => fs.writeFile(path.join(root, `file-${index}`), 'test')));
  const first = await service.directory(volume); const second = await service.directory(volume, '', first.nextOffset);
  assert.equal(first.entries.length, 200); assert.equal(second.entries.length, 6); assert.equal(second.nextOffset, null);
  assert.equal(new Set([...first.entries, ...second.entries].map(entry => entry.path)).size, 206);
  await assert.rejects(service.directory(volume, '', -1), { status: 400 });
});
test('server errors do not disclose underlying filesystem paths', () => {
  assert.equal(storageError({ code: 'ENOENT', message: '/private/secret' }).status, 404);
  assert.equal(storageError({ message: '/private/secret' }).error.includes('/private'), false);
});
