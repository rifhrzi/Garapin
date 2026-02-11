import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import projectRoutes from '../modules/project/project.routes';
import bidRoutes from '../modules/bid/bid.routes';
import escrowRoutes from '../modules/escrow/escrow.routes';
import payoutRoutes from '../modules/payout/payout.routes';
import chatRoutes from '../modules/chat/chat.routes';
import reviewRoutes from '../modules/review/review.routes';
import disputeRoutes from '../modules/dispute/dispute.routes';
import adminRoutes from '../modules/admin/admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/bids', bidRoutes);
router.use('/escrow', escrowRoutes);
router.use('/payouts', payoutRoutes);
router.use('/chat', chatRoutes);
router.use('/reviews', reviewRoutes);
router.use('/disputes', disputeRoutes);
router.use('/admin', adminRoutes);

export default router;
