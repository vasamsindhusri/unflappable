// Run with: npm run seed  -> creates demo therapists (with weekly availability) so you never re-enter test data
require('dotenv').config();
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Therapist = require('../models/Therapist');
const Availability = require('../models/Availability');

const demo = [
  {
    name: 'Dr. Anita Sharma',
    email: 'anita@example.com',
    slug: 'dr-sharma',
    bio: 'Clinical psychologist with 8 years of experience helping adults with anxiety and relationship stress.',
    specializations: ['Anxiety', 'Depression', 'Couples therapy'],
    languages: ['English', 'Hindi'],
    services: [
      { title: 'First consultation', description: 'A relaxed first session to understand what you need.' },
      { title: 'Individual therapy', description: 'Ongoing one-to-one sessions.' },
    ],
  },
  {
    name: 'Ravi Kumar',
    email: 'ravi@example.com',
    slug: 'ravi-kumar',
    bio: 'Counsellor for students and young professionals dealing with burnout.',
    specializations: ['Burnout', 'Career stress'],
    languages: ['English', 'Telugu'],
    services: [{ title: 'Career counselling', description: 'Clarity on work and direction.' }],
  },
];

// Monday to Friday, two blocks a day
const weekly = [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
  { dayOfWeek, start: '10:00', end: '13:00' },
  { dayOfWeek, start: '15:00', end: '18:00' },
]);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const old = await Therapist.find({ email: { $in: demo.map((d) => d.email) } }).select('_id');
  await Availability.deleteMany({ therapist: { $in: old.map((t) => t._id) } });
  await Therapist.deleteMany({ email: { $in: demo.map((d) => d.email) } });

  const password_hash = await bcrypt.hash('password123', 10);
  const created = await Therapist.insertMany(demo.map((d) => ({ ...d, password_hash })));
  await Availability.insertMany(
    created.map((t) => ({ therapist: t._id, timezone: 'Asia/Kolkata', sessionDuration: 60, bufferMinutes: 10, weekly }))
  );

  console.log('Seeded. Login with anita@example.com / password123');
  await mongoose.disconnect();
})();
