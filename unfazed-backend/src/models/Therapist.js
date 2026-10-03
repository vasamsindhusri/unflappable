const mongoose = require('mongoose');

// Service cards shown on the public profile page
const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { _id: true }
);

const therapistSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
    specializations: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    services: { type: [serviceSchema], default: [] },
  },
  { timestamps: true }
);

// Never send the password hash to the frontend
therapistSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password_hash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Therapist', therapistSchema);
