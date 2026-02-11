import { Router } from 'express';
import multer from 'multer';
import { projectController } from './project.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { validateUUID } from '../../middleware/validateParam';
import { createProjectSchema, updateProjectSchema, projectFiltersSchema, updateStatusSchema } from '../../validators/schemas';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.get('/categories', (req, res, next) =>
  projectController.getCategories(req, res, next)
);
router.get('/', validate(projectFiltersSchema, 'query'), (req, res, next) =>
  projectController.list(req, res, next)
);
router.get('/my', authenticate, (req, res, next) =>
  projectController.getMyProjects(req, res, next)
);
router.get('/:id', validateUUID('id'), (req, res, next) =>
  projectController.getById(req, res, next)
);
router.post(
  '/',
  authenticate,
  authorize('CLIENT'),
  validate(createProjectSchema),
  (req, res, next) => projectController.create(req, res, next)
);
router.put(
  '/:id',
  authenticate,
  authorize('CLIENT'),
  validateUUID('id'),
  validate(updateProjectSchema),
  (req, res, next) => projectController.update(req, res, next)
);
router.put('/:id/status', authenticate, validateUUID('id'), validate(updateStatusSchema), (req, res, next) =>
  projectController.updateStatus(req, res, next)
);
router.post('/:id/deliver', authenticate, authorize('FREELANCER'), validateUUID('id'), upload.single('file'), (req, res, next) =>
  projectController.deliver(req, res, next)
);
router.get('/:id/deliveries', authenticate, validateUUID('id'), (req, res, next) =>
  projectController.getDeliveries(req, res, next)
);

export default router;
