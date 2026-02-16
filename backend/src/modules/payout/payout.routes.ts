import { Router } from 'express';
import { payoutController } from './payout.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { validateUUID } from '../../middleware/validateParam';
import { requestPayoutSchema } from '../../validators/schemas';
import { paymentLimiter } from '../../middleware/rateLimiter';

const router = Router();

// All payout routes require FREELANCER role
router.use(authenticate, authorize('FREELANCER'));

router.post('/request', paymentLimiter, validate(requestPayoutSchema), (req, res, next) =>
  payoutController.requestPayout(req, res, next)
);

router.get('/history', (req, res, next) =>
  payoutController.getHistory(req, res, next)
);

router.get('/balance', (req, res, next) =>
  payoutController.getAvailableBalance(req, res, next)
);

router.put('/:id/cancel', validateUUID('id'), (req, res, next) =>
  payoutController.cancelPayout(req, res, next)
);

export default router;
