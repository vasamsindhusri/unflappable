const router = require('express').Router();
const Therapist = require('../models/Therapist');

const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// GET /share/:slug
// React renders in the browser, so WhatsApp/LinkedIn crawlers can't read its meta tags.
// Share THIS link: crawlers read the Open Graph tags, people get redirected to the real profile.
router.get('/:slug', async (req, res, next) => {
  try {
    const t = await Therapist.findOne({ slug: req.params.slug.toLowerCase() });
    if (!t) return res.status(404).send('Profile not found');

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const target = `${clientUrl}/${t.slug}`;
    const title = `${t.name} | Unfazed`;
    const desc = t.bio ? t.bio.slice(0, 160) : `Book a session with ${t.name} on Unfazed.`;

    res.send(`<!doctype html>
<html><head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta property="og:type" content="profile" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${esc(target)}" />
<meta name="twitter:card" content="summary" />
<meta http-equiv="refresh" content="0; url=${esc(target)}" />
</head><body><a href="${esc(target)}">Open ${esc(t.name)}'s profile</a></body></html>`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
