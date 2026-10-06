// Scheduling settings live here (or in .env), not inside the logic
module.exports = {
  MIN_NOTICE_MINUTES: Number(process.env.MIN_NOTICE_MINUTES) || 60, // can't book a slot starting sooner than this
  DEFAULT_DAYS_AHEAD: 14,
  MAX_DAYS_AHEAD: 60,
};
