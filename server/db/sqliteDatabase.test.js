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
      const people = db.getParticipants(77);
      if (people.length !== 2 || people[0].id !== 'owner' || !people[0].isOrganizer || people[1].id !== 'guest') process.exit(3);
      if (db.events.length !== 1 || db.findEvent(77)?.organizerId !== 'owner') process.exit(1);
      if (!db.isUserJoined(77, 'guest')) process.exit(2);
      db.upsertUser('persisted', { name: 'Saved', theme: 'dark' });
      console.log('ok');`), 'ok');
    assert.equal(run(`import db from './server/db/sqliteDatabase.js';
      if (db.events.length !== 1 || db.findUser('persisted')?.name !== 'Saved' || db.findUser('persisted')?.theme !== 'dark') process.exit(1);
      const people = db.getParticipants(77);
      if (people.length !== 2 || people[0].id !== 'owner' || people[1].id !== 'guest') process.exit(2);
      console.log('ok');`), 'ok');
    assert.equal(fs.readFileSync(legacy, 'utf8'), original);
  } finally {
    const target = path.resolve(directory);
    assert.ok(target.startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test('tourist plans persist across restart and stay isolated by user', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'max-events-tourist-plan-test-'));
  const database = path.join(directory, 'events.sqlite');
  try {
    const env = { ...process.env, DB_PATH: database };
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
      db.saveTouristPlan('max-user-1', { city: 'Казань', date: '2026-09-27', options: [{ id: 'a' }] });
      db.saveTouristPlan('max-user-2', { city: 'Казань', date: '2026-09-27', options: [{ id: 'b' }] });
      console.log('saved');`), 'saved');
    assert.equal(run(`import db from './server/db/sqliteDatabase.js';
      const own = db.getTouristPlans('max-user-1');
      const other = db.getTouristPlans('max-user-2');
      if (own.length !== 1 || own[0].options[0].id !== 'a' || other[0]?.options[0]?.id !== 'b') process.exit(1);
      db.deleteTouristPlan('max-user-1', 'Казань', '2026-09-27');
      if (db.getTouristPlans('max-user-1').length || db.getTouristPlans('max-user-2').length !== 1) process.exit(2);
      console.log('isolated');`), 'isolated');
  } finally {
    const target = path.resolve(directory);
    assert.ok(target.startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(target, { recursive: true, force: true });
  }
});
