const express = require('express');
const router = express.Router();
const {
  getDesigns,
  getDesignById,
  createDesign,
  uploadNewVersion,
  updateDesignStatus,
  deleteDesign,
  getDesignStats,
} = require('../controllers/design.controller');
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload');

// All design routes require authentication
router.use(authenticate);

// Stats route (before /:id)
router.get('/stats', getDesignStats);

// List & Create
router.route('/').get(getDesigns).post(upload.single('file'), createDesign);

// Upload new version
router.post('/:id/versions', upload.single('file'), uploadNewVersion);

// Update status
router.patch('/:id/status', updateDesignStatus);

// Get by ID & Delete
router.route('/:id').get(getDesignById).delete(deleteDesign);

module.exports = router;
