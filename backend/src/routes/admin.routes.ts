import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { disputeController } from '../controllers/dispute.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validator';
import { suspendUserSchema, tierAdjustSchema, resolveDisputeSchema } from '../validators/schemas';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard/stats', (req, res, next) =>
  adminController.dashboard(req, res, next)
);
router.get('/dashboard/enhanced', (req, res, next) =>
  adminController.enhancedDashboard(req, res, next)
);
router.get('/projects', (req, res, next) =>
  adminController.listProjects(req, res, next)
);
router.get('/escrows', (req, res, next) =>
  adminController.listEscrows(req, res, next)
);
router.get('/payouts', (req, res, next) =>
  adminController.listPayouts(req, res, next)
);
router.get('/activity-log', (req, res, next) =>
  adminController.activityLog(req, res, next)
);
router.get('/disputes', (req, res, next) =>
  disputeController.list(req, res, next)
);
router.put('/disputes/:id/resolve', validate(resolveDisputeSchema), (req, res, next) =>
  disputeController.resolve(req, res, next)
);
router.get('/chat-audit/:conversationId', (req, res, next) =>
  adminController.chatAudit(req, res, next)
);
router.get('/message-flags', (req, res, next) =>
  adminController.flaggedMessages(req, res, next)
);
router.get('/users', (req, res, next) =>
  adminController.listUsers(req, res, next)
);
router.put('/users/:id/suspend', validate(suspendUserSchema), (req, res, next) =>
  adminController.suspendUser(req, res, next)
);
router.put('/users/:id/unsuspend', (req, res, next) =>
  adminController.unsuspendUser(req, res, next)
);
router.put('/freelancers/:id/tier', validate(tierAdjustSchema), (req, res, next) =>
  adminController.adjustTier(req, res, next)
);

export default router;
