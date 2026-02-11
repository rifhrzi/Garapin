import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { authLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema, refreshTokenSchema } from '../../validators/schemas';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);
router.post('/refresh', validate(refreshTokenSchema), (req, res, next) =>
  authController.refresh(req, res, next)
);
router.get('/me', authenticate, (req, res, next) =>
  authController.me(req, res, next)
);
router.post('/verify-email', authenticate, (req, res, next) =>
  authController.verifyEmail(req, res, next)
);
router.post('/verify-phone', authenticate, (req, res, next) =>
  authController.verifyPhone(req, res, next)
);

export default router;
