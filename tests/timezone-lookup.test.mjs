import test from 'node:test';
import assert from 'node:assert/strict';
import tzLookup from '@photostructure/tz-lookup';

test('detects IANA zones locally for city coordinates across regions', () => {
  assert.equal(tzLookup(48.8566, 2.3522), 'Europe/Paris');
  assert.equal(tzLookup(40.7128, -74.006), 'America/New_York');
  assert.equal(tzLookup(25.2048, 55.2708), 'Asia/Dubai');
});

test('rejects invalid coordinates rather than guessing a zone', () => {
  assert.throws(() => tzLookup(Number.NaN, 2));
  assert.throws(() => tzLookup(91, 2));
});

