const Therapist = require('../models/Therapist');

// Words that would clash with frontend routes
const RESERVED = ['login', 'register', 'dashboard', 'api', 'share', 'admin', 'about', 'settings'];

// "Dr. Anita Sharma" -> "dr-anita-sharma"
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const isSlugTaken = async (slug, excludeId = null) => {
  if (RESERVED.includes(slug)) return true;
  const query = { slug };
  if (excludeId) query._id = { $ne: excludeId };
  return !!(await Therapist.exists(query));
};

// Generates a unique slug: dr-sharma, dr-sharma-2, dr-sharma-3 ...
const generateUniqueSlug = async (name) => {
  const base = slugify(name) || 'therapist';
  let slug = base;
  let counter = 2;
  while (await isSlugTaken(slug)) {
    slug = `${base}-${counter++}`;
  }
  return slug;
};

module.exports = { slugify, isSlugTaken, generateUniqueSlug };
