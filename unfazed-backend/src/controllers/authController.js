const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Therapist = require('../models/Therapist');
const { generateUniqueSlug } = require('../utils/generateSlug');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, email, password } = req.body;

    if (await Therapist.exists({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const slug = await generateUniqueSlug(name);
    const therapist = await Therapist.create({ name, email, password_hash, slug });

    res.status(201).json({ token: signToken(therapist._id), therapist });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password } = req.body;
    const therapist = await Therapist.findOne({ email: email.toLowerCase() });
    const ok = therapist && (await bcrypt.compare(password, therapist.password_hash));

    // Same message for both cases so attackers can't discover which emails exist
    if (!ok) return res.status(401).json({ message: 'Incorrect email or password' });

    res.json({ token: signToken(therapist._id), therapist });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = (req, res) => res.json({ therapist: req.therapist });
