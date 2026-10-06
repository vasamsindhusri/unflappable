const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Therapist = require('../models/Therapist');
const Availability = require('../models/Availability');
const Session = require('../models/Session');
const { generateSlots } = require('../services/slotService');
const { MIN_NOTICE_MINUTES, DEFAULT_DAYS_AHEAD, MAX_DAYS_AHEAD } = require('../config/scheduling');

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DURATIONS = [30, 45, 60, 90];
const isZone = (z) => typeof z === 'string' && DateTime.local().setZone(z).isValid;
const validRange = (o) => TIME_RE.test(o.start) && TIME_RE.test(o.end) && o.start < o.end; // "HH:mm" compares correctly as text

const getOrCreateAvailability = async (therapistId) =>
  (await Availability.findOne({ therapist: therapistId })) || Availability.create({ therapist: therapistId });

// Checks everything the therapist sends before it touches the database
function cleanAvailability(body) {
  const { timezone, sessionDuration, bufferMinutes, weekly = [], overrides = [], blocked = [] } = body;
  if (!isZone(timezone)) return { error: 'Choose a valid timezone' };
  if (!DURATIONS.includes(Number(sessionDuration))) return { error: 'Session length must be 30, 45, 60 or 90 minutes' };
  const buffer = Number(bufferMinutes);
  if (!Number.isInteger(buffer) || buffer < 0 || buffer > 60) return { error: 'Buffer must be between 0 and 60 minutes' };
  if (![weekly, overrides, blocked].every(Array.isArray) || weekly.length > 70 || overrides.length > 100 || blocked.length > 100) {
    return { error: 'Too many entries' };
  }

  for (const w of weekly) {
    if (!Number.isInteger(w.dayOfWeek) || w.dayOfWeek < 0 || w.dayOfWeek > 6 || !validRange(w)) {
      return { error: 'Each weekly time range needs a start earlier than its end' };
    }
  }
  for (let d = 0; d < 7; d++) {
    const day = weekly.filter((w) => w.dayOfWeek === d).sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < day.length; i++) {
      if (day[i].start < day[i - 1].end) return { error: 'Time ranges on the same day cannot overlap' };
    }
  }
  for (const o of overrides) {
    if (!DATE_RE.test(o.date) || !validRange(o)) return { error: 'Each extra-hours entry needs a date and a valid time range' };
  }
  for (const b of blocked) {
    if (!DATE_RE.test(b.date)) return { error: 'Each blocked entry needs a date' };
    const hasStart = !!b.start, hasEnd = !!b.end;
    if (hasStart !== hasEnd || (hasStart && !validRange(b))) {
      return { error: 'For blocked time, fill both start and end, or leave both empty to block the whole day' };
    }
  }

  return {
    value: {
      timezone,
      sessionDuration: Number(sessionDuration),
      bufferMinutes: buffer,
      weekly: weekly.map(({ dayOfWeek, start, end }) => ({ dayOfWeek, start, end })),
      overrides: overrides.map(({ date, start, end }) => ({ date, start, end })),
      blocked: blocked.map(({ date, start, end }) => ({ date, start: start || undefined, end: end || undefined })),
    },
  };
}

// ---------- Therapist routes (logged in) ----------

// GET /api/scheduling/me/availability
exports.getMyAvailability = async (req, res, next) => {
  try {
    res.json({ availability: await getOrCreateAvailability(req.therapist._id) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/scheduling/me/availability
exports.updateMyAvailability = async (req, res, next) => {
  try {
    const { error, value } = cleanAvailability(req.body);
    if (error) return res.status(400).json({ message: error });
    const availability = await getOrCreateAvailability(req.therapist._id);
    availability.set(value);
    await availability.save();
    res.json({ availability });
  } catch (err) {
    next(err);
  }
};

// GET /api/scheduling/me/sessions  (upcoming confirmed sessions)
exports.getMySessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ therapist: req.therapist._id, status: 'confirmed', end: { $gte: new Date() } }).sort({ start: 1 });
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

// POST /api/scheduling/me/sessions/:id/cancel  (frees the slot again)
exports.cancelSession = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Session not found' });
    const session = await Session.findOne({ _id: req.params.id, therapist: req.therapist._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    session.status = 'cancelled';
    await session.save();
    res.json({ session });
  } catch (err) {
    next(err);
  }
};

// ---------- Public routes (clients) ----------

async function openSlots(therapistId, days) {
  const availability = await Availability.findOne({ therapist: therapistId });
  if (!availability) return { availability: null, slots: [] };
  const sessions = await Session.find({ therapist: therapistId, status: 'confirmed', end: { $gte: new Date() } });
  const slots = generateSlots(availability, sessions, { days, minNoticeMinutes: MIN_NOTICE_MINUTES });
  return { availability, slots };
}

// GET /api/scheduling/:slug/slots?days=14
exports.getPublicSlots = async (req, res, next) => {
  try {
    const therapist = await Therapist.findOne({ slug: req.params.slug.toLowerCase() }).select('name slug');
    if (!therapist) return res.status(404).json({ message: 'Profile not found' });

    const days = Math.min(Math.max(Number(req.query.days) || DEFAULT_DAYS_AHEAD, 1), MAX_DAYS_AHEAD);
    const { availability, slots } = await openSlots(therapist._id, days);

    res.json({
      therapist: { name: therapist.name, slug: therapist.slug },
      timezone: availability ? availability.timezone : 'Asia/Kolkata',
      sessionDuration: availability ? availability.sessionDuration : 60,
      slots, // UTC times - the browser converts them to the client's own timezone
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/scheduling/:slug/book   body: { start, clientName, clientEmail, clientTimezone }
exports.bookSlot = async (req, res, next) => {
  const taken = { message: 'Sorry, that time was just taken. Please pick another.' };
  try {
    const { start, clientName, clientEmail, clientTimezone } = req.body;
    if (!clientName || !String(clientName).trim()) return res.status(400).json({ message: 'Your name is required' });
    if (!EMAIL_RE.test(clientEmail || '')) return res.status(400).json({ message: 'Enter a valid email' });

    const startUtc = DateTime.fromISO(String(start), { zone: 'utc' });
    if (!startUtc.isValid) return res.status(400).json({ message: 'Choose a time slot' });
    const startIso = startUtc.toUTC().toISO();

    const therapist = await Therapist.findOne({ slug: req.params.slug.toLowerCase() }).select('name slug');
    if (!therapist) return res.status(404).json({ message: 'Profile not found' });

    // Never trust the browser: re-check the slot is genuinely open right now
    const { availability, slots } = await openSlots(therapist._id, MAX_DAYS_AHEAD);
    if (!availability || !slots.includes(startIso)) return res.status(409).json(taken);

    const startDate = new Date(startIso);
    const session = await Session.create({
      therapist: therapist._id,
      clientName: String(clientName).trim(),
      clientEmail,
      clientTimezone: isZone(clientTimezone) ? clientTimezone : 'UTC',
      start: startDate,
      end: new Date(startDate.getTime() + availability.sessionDuration * 60000),
    });

    // Instant confirmation. Only safe fields go back to the public.
    res.status(201).json({
      session: { id: session._id, start: session.start, end: session.end, therapistName: therapist.name, status: session.status },
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json(taken); // lost the race to another client
    next(err);
  }
};
