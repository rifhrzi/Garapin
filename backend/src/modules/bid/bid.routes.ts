import { Router } from 'express';
import { bidController } from './bid.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { validateUUID } from '../../middleware/validateParam';
import { createBidSchema } from '../../validators/schemas';

const router = Router();

router.get('/my', authenticate, authorize('FREELANCER'), (req, res, next) =>
  bidController.getMyBids(req, res, next)
);
router.post(
  '/projects/:projectId',
  authenticate,
  authorize('FREELANCER'),
  validateUUID('projectId'),
  validate(createBidSchema),
  (req, res, next) => bidController.create(req, res, next)
);
router.get('/projects/:projectId', authenticate, authorize('CLIENT'), validateUUID('projectId'), (req, res, next) =>
  bidController.getProjectBids(req, res, next)
);
router.put('/:id/accept', authenticate, authorize('CLIENT'), validateUUID('id'), (req, res, next) =>
  bidController.accept(req, res, next)
);
router.put('/:id/withdraw', authenticate, authorize('FREELANCER'), validateUUID('id'), (req, res, next) =>
  bidController.withdraw(req, res, next)
);

export default router;
