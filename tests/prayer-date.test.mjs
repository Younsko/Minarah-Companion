import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDateInTimeZone, calendarDayKeyInTimeZone, formatPrayerTime, isValidTimeZone } from '../lib/prayer-date.mjs';

test('validates IANA zones and falls back from invalid input', () => {
  assert.equal(isValidTimeZone('Europe/Paris'), true);
  assert.equal(isValidTimeZone('Not/AZone'), false);
  assert.equal(isValidTimeZone(''), false);
});

test('uses the location calendar date across midnight and DST boundaries', () => {
  const beforeParisMidnightUtc = new Date('2026-03-28T23:30:00Z');
  const parisDate = calendarDateInTimeZone(beforeParisMidnightUtc, 'Europe/Paris');
  assert.equal(parisDate.getFullYear(), 2026);
  assert.equal(parisDate.getMonth(), 2);
  assert.equal(parisDate.getDate(), 29);

  const beforeNewYorkDst = new Date('2026-03-08T06:30:00Z');
  const afterNewYorkDst = new Date('2026-03-08T07:30:00Z');
  assert.equal(formatPrayerTime(beforeNewYorkDst, 'America/New_York', 'en-US'), '01:30 AM');
  assert.equal(formatPrayerTime(afterNewYorkDst, 'America/New_York', 'en-US'), '03:30 AM');
});

test('keys daily prayer progress by the selected location date, not UTC', () => {
  const shortlyAfterUtcMidnight = new Date('2026-11-27T00:30:00Z');
  assert.equal(calendarDayKeyInTimeZone(shortlyAfterUtcMidnight, 'Europe/Paris'), '2026-11-27');
  assert.equal(calendarDayKeyInTimeZone(shortlyAfterUtcMidnight, 'America/Los_Angeles'), '2026-11-26');
});

