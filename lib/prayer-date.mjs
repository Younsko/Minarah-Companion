export function isValidTimeZone(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function getDefaultTimeZone() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(zone) ? zone : 'UTC';
}

// Adhan accepts a Date whose calendar fields specify the prayer location's day.
// The returned Date is deliberately constructed in the runtime zone because
// Adhan reads those local year/month/day fields, then returns UTC instants.
export function calendarDateInTimeZone(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const getPart = type => Number(parts.find(part => part.type === type)?.value);
  return new Date(getPart('year'), getPart('month') - 1, getPart('day'));
}

export function calendarDayKeyInTimeZone(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const getPart = type => parts.find(part => part.type === type)?.value || '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

export function formatPrayerTime(date, timeZone, locale) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date);
}

