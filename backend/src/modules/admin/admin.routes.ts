import { Router } from 'express';
import { adminController } from './admin.controller';
import { disputeController } from '../dispute/dispute.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { validateUUID } from '../../middleware/validateParam';
import { suspendUserSchema, tierAdjustSchema, resolveDisputeSchema, failPayoutSchema, warnUserSchema, banUserSchema, adminUpdateProjectStatusSchema, adminDeleteReasonSchema } from '../../validators/schemas';

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
router.put('/payouts/:id/process', validateUUID('id'), (req, res, next) =>
  adminController.processPayout(req, res, next)
);
router.put('/payouts/:id/complete', validateUUID('id'), (req, res, next) =>
  adminController.completePayout(req, res, next)
);
router.put('/payouts/:id/fail', validateUUID('id'), validate(failPayoutSchema), (req, res, next) =>
  adminController.failPayout(req, res, next)
);
router.get('/activity-log', (req, res, next) =>
  adminController.activityLog(req, res, next)
);
router.get('/disputes', (req, res, next) =>
  disputeController.list(req, res, next)
);
router.put('/disputes/:id/resolve', validateUUID('id'), validate(resolveDisputeSchema), (req, res, next) =>
  disputeController.resolve(req, res, next)
);
router.get('/chat-audit/:conversationId', validateUUID('conversationId'), (req, res, next) =>
  adminController.chatAudit(req, res, next)
);
router.get('/message-flags', (req, res, next) =>
  adminController.flaggedMessages(req, res, next)
);
router.get('/users', (req, res, next) =>
  adminController.listUsers(req, res, next)
);
router.put('/users/:id/suspend', validateUUID('id'), validate(suspendUserSchema), (req, res, next) =>
  adminController.suspendUser(req, res, next)
);
router.put('/users/:id/unsuspend', validateUUID('id'), (req, res, next) =>
  adminController.unsuspendUser(req, res, next)
);
router.put('/freelancers/:id/tier', validateUUID('id'), validate(tierAdjustSchema), (req, res, next) =>
  adminController.adjustTier(req, res, next)
);

// User punishment
router.put('/users/:id/warn', validateUUID('id'), validate(warnUserSchema), (req, res, next) =>
  adminController.warnUser(req, res, next)
);
router.put('/users/:id/clear-warnings', validateUUID('id'), (req, res, next) =>
  adminController.clearWarnings(req, res, next)
);
router.put('/users/:id/ban', validateUUID('id'), validate(banUserSchema), (req, res, next) =>
  adminController.banUser(req, res, next)
);
router.put('/users/:id/unban', validateUUID('id'), (req, res, next) =>
  adminController.unbanUser(req, res, next)
);
router.delete('/users/:id', validateUUID('id'), validate(adminDeleteReasonSchema), (req, res, next) =>
  adminController.deleteUser(req, res, next)
);

// Project management
router.put('/projects/:id/status', validateUUID('id'), validate(adminUpdateProjectStatusSchema), (req, res, next) =>
  adminController.updateProjectStatus(req, res, next)
);
router.delete('/projects/:id', validateUUID('id'), validate(adminDeleteReasonSchema), (req, res, next) =>
  adminController.deleteProject(req, res, next)
);

export default router;
