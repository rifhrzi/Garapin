/**
 * Re-export barrel for backward compatibility.
 * New code should import directly from '@/lib/api/<domain>.api'.
 */
export { default } from './api/client';
export { authApi } from './api/auth.api';
export { userApi } from './api/user.api';
export { projectApi } from './api/project.api';
export type { ProjectListParams, CreateProjectPayload } from './api/project.api';
export { bidApi } from './api/bid.api';
export type { CreateBidPayload } from './api/bid.api';
export { escrowApi } from './api/escrow.api';
export { chatApi } from './api/chat.api';
export { payoutApi } from './api/payout.api';
export { reviewApi } from './api/review.api';
export { disputeApi } from './api/dispute.api';
export { adminApi } from './api/admin.api';
