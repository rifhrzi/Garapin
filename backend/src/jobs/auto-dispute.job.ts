import { disputeService } from '../modules/dispute/dispute.service';

/**
 * Checks for projects that need auto-generated disputes
 * (freelancer ghosting or missed deadlines).
 *
 * @returns Number of disputes created
 */
export async function runAutoDisputeCheck(): Promise<number> {
  const disputes = await disputeService.checkAutoDisputes();
  return disputes.length;
}
