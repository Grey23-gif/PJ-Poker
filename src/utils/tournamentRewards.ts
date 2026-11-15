import type { PointRequest } from '../types/points';
import type { Tournament } from '../types/tournament';
import { isSessionFinished } from './tournamentFinalization';

export const POINTS_LEDGER_KEY = 'poker_cafe_points_ledger_v2';

/** The approval record publishes archival together with every point credit.
 * Session archive fields are a projection of that same durable ledger write. */
export function projectTournamentRewards(tours: Tournament[]): Tournament[] {
  let requests: PointRequest[];
  try {
    const raw = localStorage.getItem(POINTS_LEDGER_KEY);
    const data = raw ? JSON.parse(raw) : undefined;
    if (data && data.version !== 2) return tours;
    requests = Array.isArray(data?.requests) ? data.requests : [];
  } catch { return tours; }
  return tours.map((tour) => {
    if (!isSessionFinished(tour)) return tour;
    const batches = requests.filter((request) => request?.pointType === 'TOUR_REWARD' && request.sessionId === tour.id && Array.isArray(request.topAssignments));
    const approved = batches.find((request) => request.status === 'APPROVED' && request.archivedAt);
    const pending = batches.find((request) => request.status === 'PENDING');
    const batch = approved || pending || batches[0];
    if (!batch) return tour;
    return { ...tour, rewardBatchId: batch.id,
      archivedAt: approved?.archivedAt || tour.archivedAt,
      rewardStatus: approved || tour.archivedAt ? 'ARCHIVED' : pending ? 'TOP_REWARD_PENDING' : 'FINISHED' };
  });
}

export function sessionHasRewardRequest(requests: PointRequest[], sessionId: string, exceptId?: string) {
  return requests.some((request) => request.id !== exceptId && request.pointType === 'TOUR_REWARD' &&
    (request.sessionId || request.tournamentId) === sessionId && request.status !== 'REJECTED');
}
