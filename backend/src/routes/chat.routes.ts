import { Router } from 'express';
import multer from 'multer';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { chatLimiter } from '../middleware/rateLimiter';
import { sendMessageSchema } from '../validators/schemas';

const router = Router();

// Multer config for file uploads (memory storage for Supabase upload)
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/zip', 'application/x-rar-compressed',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// User's conversations list
router.get('/conversations', authenticate, (req, res, next) =>
  chatController.getUserConversations(req, res, next)
);

router.get('/conversations/:projectId', authenticate, (req, res, next) =>
  chatController.getConversation(req, res, next)
);

router.post('/messages', authenticate, chatLimiter, validate(sendMessageSchema), (req, res, next) =>
  chatController.sendMessage(req, res, next)
);

router.get('/messages/:conversationId', authenticate, (req, res, next) =>
  chatController.getMessages(req, res, next)
);

router.post('/upload', authenticate, upload.single('file'), (req, res, next) =>
  chatController.uploadFile(req, res, next)
);

export default router;
