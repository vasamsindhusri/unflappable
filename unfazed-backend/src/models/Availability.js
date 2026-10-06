const mongoose = require('mongoose');

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/; // "HH:mm"
const DATE = /^\d{4}-\d{2}-\d{2}$/; // "YYYY-MM-DD"

// Repeats every week, e.g. Monday 10:00-13:00 (0 = Sunday ... 6 = Saturday)
const weeklySchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    start: { type: String, match: TIME, required: true },
    end: { type: String, match: TIME, required: true },
  },
  { _id: false }
);

// One-time extra hours on a specific date
const overrideSchema = new mongoose.Schema(
  {
    date: { type: String, match: DATE, required: true },
    start: { type: String, match: TIME, required: true },
    end: { type: String, match: TIME, required: true },
  },
  { _id: false }
);

// Blocked time: a whole date (no start/end) or part of a date
const blockedSchema = new mongoose.Schema(
  {
    date: { type: String, match: DATE, required: true },
    start: { type: String, match: TIME },
    end: { type: String, match: TIME },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true, unique: true },
    timezone: { type: String, default: 'Asia/Kolkata' }, // all times above are in THIS timezone
    sessionDuration: { type: Number, enum: [30, 45, 60, 90], default: 60 },
    bufferMinutes: { type: Number, min: 0, max: 60, default: 10 },
    weekly: { type: [weeklySchema], default: [] },
    overrides: { type: [overrideSchema], default: [] },
    blocked: { type: [blockedSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Availability', availabilitySchema);
