import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('legacy JSON migrates once and SQLite survives restart', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'max-events-db-test-'));
  const legacy = path.join(directory, 'db.json');
  const database = path.join(directory, 'events.sqlite');
  const original = JSON.stringify({
    events: [{ id: 77, title: 'Legacy', organizer: { id: 'owner', name: 'Owner' } }],
    users: {},
    joinedUsers: { 77: ['guest'] },
    reports: [],
    reviews: [],
    seeded: true
  });
  try {
    fs.writeFileSync(legacy, original);
    const env = { ...process.env, DB_PATH: database, LEGACY_DB_PATH: legacy };
    const run = (script) => {
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
        cwd: path.resolve(import.meta.dirname, '..', '..'),
        env,
        encoding: 'utf8'
      });
      assert.equal(result.status, 0, result.stderr);
      return result.stdout.trim();
    };
    assert.equal(run(`import db from './server/db/sqliteDatabase.js';
      if (db.events.length !== 1 || db.findEvent(77)?.organizerId !== 'owner') process.exit(1);
      if (!db.isUserJoined(77, 'guest')) process.exit(2);
      db.upsertUser('persisted', { name: 'Saved', theme: 'dark' });
      console.log('ok');`), 'ok');
    assert.equal(run(`import db from './server/db/sqliteDatabase.js';
      if (db.events.length !== 1 || db.findUser('persisted')?.name !== 'Saved' || db.findUser('persisted')?.theme !== 'dark') process.exit(1);
      console.log('ok');`), 'ok');
    assert.equal(fs.readFileSync(legacy, 'utf8'), original);
  } finally {
    const target = path.resolve(directory);
    assert.ok(target.startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(target, { recursive: true, force: true });
  }
});
