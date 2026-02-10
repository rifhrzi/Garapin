import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validator';
import { updateProfileSchema, updatePortfolioSchema } from '../validators/schemas';

const router = Router();

router.get('/freelancers', (req, res, next) =>
  userController.searchFreelancers(req, res, next)
);
router.get('/freelancer/:id', (req, res, next) =>
  userController.getFreelancer(req, res, next)
);
router.get('/:id/profile', (req, res, next) =>
  userController.getProfile(req, res, next)
);
router.put('/profile', authenticate, validate(updateProfileSchema), (req, res, next) =>
  userController.updateProfile(req, res, next)
);
router.put(
  '/freelancer/portfolio',
  authenticate,
  authorize('FREELANCER'),
  validate(updatePortfolioSchema),
  (req, res, next) => userController.updatePortfolio(req, res, next)
);

export default router;
