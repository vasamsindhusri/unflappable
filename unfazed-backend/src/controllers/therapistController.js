const { validationResult } = require('express-validator');
const Therapist = require('../models/Therapist');
const { slugify, isSlugTaken } = require('../utils/generateSlug');

// GET /api/therapists/:slug  (public)
exports.getPublicProfile = async (req, res, next) => {
  try {
    const therapist = await Therapist.findOne({ slug: req.params.slug.toLowerCase() }).select(
      'name slug bio specializations languages services'
    ); // email is intentionally NOT included on the public page
    if (!therapist) return res.status(404).json({ message: 'Profile not found' });
    res.json({ therapist });
  } catch (err) {
    next(err);
  }
};

// PUT /api/therapists/me  (logged in)
exports.updateMyProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const therapist = req.therapist;
    const { name, bio, specializations, languages, services, slug } = req.body;

    if (slug !== undefined && slug !== therapist.slug) {
      const clean = slugify(slug);
      if (!clean) return res.status(400).json({ message: 'Link name is invalid' });
      if (await isSlugTaken(clean, therapist._id)) {
        return res.status(409).json({ message: 'That link name is taken. Try another.' });
      }
      therapist.slug = clean;
    }

    if (name !== undefined) therapist.name = name;
    if (bio !== undefined) therapist.bio = bio;
    if (Array.isArray(specializations)) therapist.specializations = specializations;
    if (Array.isArray(languages)) therapist.languages = languages;
    if (Array.isArray(services)) therapist.services = services.filter((s) => s.title);

    await therapist.save();
    res.json({ therapist });
  } catch (err) {
    next(err);
  }
};
