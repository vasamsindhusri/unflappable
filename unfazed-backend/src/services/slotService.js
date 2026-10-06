const { DateTime } = require('luxon');

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Opening hours that apply to one calendar date (weekly template + one-time extras)
function windowsForDate(av, day) {
  const dow = day.weekday % 7; // luxon: Mon=1..Sun=7  ->  0=Sun..6=Sat
  const dateStr = day.toISODate();
  const wins = av.weekly.filter((w) => w.dayOfWeek === dow).map((w) => ({ start: w.start, end: w.end }));
  av.overrides.filter((o) => o.date === dateStr).forEach((o) => wins.push({ start: o.start, end: o.end }));
  return wins;
}

function isBlocked(av, dateStr, startMin, endMin) {
  return av.blocked.some((b) => {
    if (b.date !== dateStr) return false;
    if (!b.start || !b.end) return true; // whole day
    return startMin < toMinutes(b.end) && endMin > toMinutes(b.start);
  });
}

/**
 * Pure function: availability + existing sessions -> list of open slot start times (UTC ISO strings).
 * Opening hours are interpreted in the THERAPIST's timezone, so daylight-saving changes are handled.
 */
function generateSlots(av, sessions, { now = DateTime.now(), days = 14, minNoticeMinutes = 60 } = {}) {
  const duration = av.sessionDuration;
  const bufferMs = av.bufferMinutes * 60000;
  const today = now.setZone(av.timezone).startOf('day');
  const earliest = now.plus({ minutes: minNoticeMinutes });

  // A booked session also blocks the buffer time after it
  const busy = sessions.map((s) => ({ start: new Date(s.start).getTime(), end: new Date(s.end).getTime() + bufferMs }));

  const slots = new Set();
  for (let i = 0; i < days; i++) {
    const day = today.plus({ days: i });
    const dateStr = day.toISODate();

    for (const w of windowsForDate(av, day)) {
      const winStart = toMinutes(w.start);
      const winEnd = toMinutes(w.end);

      for (let m = winStart; m + duration <= winEnd; m += duration + av.bufferMinutes) {
        if (isBlocked(av, dateStr, m, m + duration)) continue;

        const start = day.set({ hour: Math.floor(m / 60), minute: m % 60 });
        if (start < earliest) continue;

        const s = start.toMillis();
        const e = s + duration * 60000;
        const clashes = busy.some((b) => s < b.end && e + bufferMs > b.start);
        if (!clashes) slots.add(start.toUTC().toISO());
      }
    }
  }
  return [...slots].sort();
}

module.exports = { generateSlots, toMinutes };
