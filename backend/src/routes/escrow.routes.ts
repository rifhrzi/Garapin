import { Router } from 'express';
import { escrowController } from '../controllers/escrow.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validator';
import { validateUUID } from '../middleware/validateParam';
import { createEscrowSchema } from '../validators/schemas';

const router = Router();

router.post('/create', authenticate, authorize('CLIENT'), validate(createEscrowSchema), (req, res, next) =>
  escrowController.create(req, res, next)
);
router.post('/webhook/midtrans', (req, res, next) =>
  escrowController.webhook(req, res, next)
);
router.get('/:id/check-status', authenticate, validateUUID('id'), (req, res, next) =>
  escrowController.checkPaymentStatus(req, res, next)
);
router.post('/:id/release', authenticate, authorize('CLIENT'), validateUUID('id'), (req, res, next) =>
  escrowController.release(req, res, next)
);
router.get('/earnings', authenticate, authorize('FREELANCER'), (req, res, next) =>
  escrowController.getEarnings(req, res, next)
);
router.get('/project/:projectId', authenticate, validateUUID('projectId'), (req, res, next) =>
  escrowController.getByProjectId(req, res, next)
);
router.get('/:id', authenticate, validateUUID('id'), (req, res, next) =>
  escrowController.getById(req, res, next)
);

export default router;
