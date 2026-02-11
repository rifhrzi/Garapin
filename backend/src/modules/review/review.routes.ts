import { Router } from 'express';
import { reviewController } from './review.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { validateUUID } from '../../middleware/validateParam';
import { createReviewSchema } from '../../validators/schemas';

const router = Router();

router.post('/', authenticate, validate(createReviewSchema), (req, res, next) =>
  reviewController.create(req, res, next)
);
router.get('/user/:userId', validateUUID('userId'), (req, res, next) =>
  reviewController.getByUser(req, res, next)
);

export default router;
