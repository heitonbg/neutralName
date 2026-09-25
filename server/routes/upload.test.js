import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import express from 'express';

test('uploaded image is served from the persistent upload directory after restart', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'max-events-upload-test-'));
  const previousUploadDir = process.env.UPLOAD_DIR;
  process.env.UPLOAD_DIR = directory;
  let first;
  let second;
  try {
    const { uploadDir } = await import('../utils/uploadStorage.js');
    const { default: router } = await import('./upload.js');
    assert.equal(uploadDir, directory);
    const makeServer = () => new Promise((resolve) => {
      const app = express();
      app.use('/api/upload', router);
      app.use('/uploads', express.static(uploadDir));
      const server = app.listen(0, '127.0.0.1', () => resolve(server));
    });
    const close = (server) => new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()));
    first = await makeServer();
    const form = new FormData();
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    form.append('photos', new Blob([bytes], { type: 'image/png' }), 'photo.png');
    const base = `http://127.0.0.1:${first.address().port}`;
    const upload = await fetch(`${base}/api/upload`, { method: 'POST', body: form });
    assert.equal(upload.status, 200);
    const { urls } = await upload.json();
    assert.match(urls[0], /^\/uploads\/[a-f0-9-]+\.png$/);
    await close(first);
    first = null;
    second = await makeServer();
    const image = await fetch(`http://127.0.0.1:${second.address().port}${urls[0]}`);
    assert.equal(image.status, 200);
    assert.deepEqual(new Uint8Array(await image.arrayBuffer()), bytes);
  } finally {
    if (first) await new Promise((resolve) => first.close(resolve));
    if (second) await new Promise((resolve) => second.close(resolve));
    if (previousUploadDir === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = previousUploadDir;
    const target = path.resolve(directory);
    assert.ok(target.startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(target, { recursive: true, force: true });
  }
});
