const express = require('express');
const router = express.Router();
const { z } = require('zod');
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
} = require('../controllers/client.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

// Validation Schemas
const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(120),
  company: z.string().max(120).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().optional(),
  status: z.enum(['active', 'inactive', 'lead', 'archived']).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  contactPerson: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      role: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

// All client routes require authentication
router.use(authenticate);

// Stats route (must be before /:id)
router.get('/stats', getClientStats);

// List & Create
router
  .route('/')
  .get(getClients)
  .post(requireRole('admin', 'project_manager'), validate(clientSchema), createClient);

// Get, Update, Delete
router
  .route('/:id')
  .get(getClientById)
  .put(requireRole('admin', 'project_manager'), validate(clientSchema), updateClient)
  .delete(requireRole('admin'), deleteClient);

module.exports = router;
