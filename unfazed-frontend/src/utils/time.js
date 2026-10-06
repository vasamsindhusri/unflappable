// Timezone helpers - built into the browser, no extra packages needed
export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const getTimezones = () => {
  const list = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return Array.from(new Set([browserTimezone(), 'Asia/Kolkata', 'UTC', ...list])).sort();
};

// "2026-10-05" for an instant, as seen in a given timezone
export const dateKey = (iso, tz) => new Date(iso).toLocaleDateString('en-CA', { timeZone: tz });

export const fmtTime = (iso, tz) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: tz });

export const fmtDateTime = (iso, tz) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: tz });

// Pieces of a "YYYY-MM-DD" key for the day cards
export const dayParts = (key) => {
  const d = new Date(`${key}T12:00:00Z`);
  const opts = (o) => ({ ...o, timeZone: 'UTC' });
  return {
    weekday: d.toLocaleDateString('en-IN', opts({ weekday: 'short' })),
    day: d.getUTCDate(),
    month: d.toLocaleDateString('en-IN', opts({ month: 'short' })),
  };
};
