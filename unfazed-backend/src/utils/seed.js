// Run with: npm run seed  -> creates demo therapists so you never re-enter test data
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Therapist = require('../models/Therapist');

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

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Therapist.deleteMany({ email: { $in: demo.map((d) => d.email) } });
  const password_hash = await bcrypt.hash('password123', 10);
  await Therapist.insertMany(demo.map((d) => ({ ...d, password_hash })));
  console.log('Seeded. Login with anita@example.com / password123');
  await mongoose.disconnect();
})();
