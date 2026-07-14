const express = require('express');
const router = express.Router();
const { z } = require('zod');
const {
  getComments,
  createComment,
  resolveComment,
  submitReview,
  deleteComment,
} = require('../controllers/comment.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const createCommentSchema = z.object({
  design: z.string().min(1, 'Design ID is required'),
  version: z.string().optional(),
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
  type: z.enum(['general', 'approval', 'revision_request']).optional(),
  pinnedPosition: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .nullable()
    .optional(),
});

const reviewSchema = z.object({
  designId: z.string().min(1, 'Design ID is required'),
  versionId: z.string().optional(),
  action: z.enum(['approve', 'request_changes']),
  notes: z.string().optional(),
});

router.use(authenticate);

router.route('/').get(getComments).post(validate(createCommentSchema), createComment);
router.post('/review', validate(reviewSchema), submitReview);
router.patch('/:id/resolve', resolveComment);
router.delete('/:id', deleteComment);

module.exports = router;
