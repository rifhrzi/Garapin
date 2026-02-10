import { Router } from 'express';
import { disputeController } from '../controllers/dispute.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validator';
import { createDisputeSchema, resolveDisputeSchema } from '../validators/schemas';

const router = Router();

router.post('/', authenticate, validate(createDisputeSchema), (req, res, next) =>
  disputeController.create(req, res, next)
);
router.get('/:id', authenticate, (req, res, next) =>
  disputeController.getById(req, res, next)
);
router.put(
  '/:id/resolve',
  authenticate,
  authorize('ADMIN'),
  validate(resolveDisputeSchema),
  (req, res, next) => disputeController.resolve(req, res, next)
);

export default router;
