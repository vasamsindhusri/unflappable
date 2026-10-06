const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true, index: true },
    clientName: { type: String, required: true, trim: true, maxlength: 80 },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },
    clientTimezone: { type: String, default: 'UTC' },
    start: { type: Date, required: true }, // always stored in UTC
    end: { type: Date, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  },
  { timestamps: true }
);

// Double-booking guard: the DATABASE refuses two confirmed sessions with the same
// therapist and start time, even if two clients click at the exact same moment.
// Cancelled sessions are ignored, so a cancelled slot can be booked again.
sessionSchema.index(
  { therapist: 1, start: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

module.exports = mongoose.model('Session', sessionSchema);
