import { Router } from 'express';
import { disputeController } from './dispute.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { validateUUID } from '../../middleware/validateParam';
import { createDisputeSchema, resolveDisputeSchema } from '../../validators/schemas';

const router = Router();

router.post('/', authenticate, validate(createDisputeSchema), (req, res, next) =>
  disputeController.create(req, res, next)
);
router.get('/:id', authenticate, validateUUID('id'), (req, res, next) =>
  disputeController.getById(req, res, next)
);
router.put(
  '/:id/resolve',
  authenticate,
  authorize('ADMIN'),
  validateUUID('id'),
  validate(resolveDisputeSchema),
  (req, res, next) => disputeController.resolve(req, res, next)
);

export default router;
