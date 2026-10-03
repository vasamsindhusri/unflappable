const router = require('express').Router();
const { body } = require('express-validator');
const { getPublicProfile, updateMyProfile } = require('../controllers/therapistController');
const { protect } = require('../middleware/authMiddleware');

// Order matters: "/me" must come before "/:slug"
router.put(
  '/me',
  protect,
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  updateMyProfile
);

router.get('/:slug', getPublicProfile);

module.exports = router;
