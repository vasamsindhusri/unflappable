const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');

// JWT verification: expects header "Authorization: Bearer <token>"
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not logged in' });
    }
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const therapist = await Therapist.findById(decoded.id);
    if (!therapist) return res.status(401).json({ message: 'Account no longer exists' });
    req.therapist = therapist;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

module.exports = { protect };
