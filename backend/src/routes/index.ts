import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';
import bidRoutes from './bid.routes';
import escrowRoutes from './escrow.routes';
import chatRoutes from './chat.routes';
import reviewRoutes from './review.routes';
import disputeRoutes from './dispute.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/bids', bidRoutes);
router.use('/escrow', escrowRoutes);
router.use('/chat', chatRoutes);
router.use('/reviews', reviewRoutes);
router.use('/disputes', disputeRoutes);
router.use('/admin', adminRoutes);

export default router;
