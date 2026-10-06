const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const c = require('../controllers/schedulingController');

// Therapist (logged in)
router.get('/me/availability', protect, c.getMyAvailability);
router.put('/me/availability', protect, c.updateMyAvailability);
router.get('/me/sessions', protect, c.getMySessions);
router.post('/me/sessions/:id/cancel', protect, c.cancelSession);

// Clients (public)
router.get('/:slug/slots', c.getPublicSlots);
router.post('/:slug/book', c.bookSlot);

module.exports = router;
