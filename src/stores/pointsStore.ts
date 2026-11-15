import { create } from 'zustand';
import type { PointRequest, PointTransaction, PlayerLeaderboardEntry, TopTourAssignment } from '../types/points';
import type { User } from '../types/auth';
import { INITIAL_POINT_REQUESTS, INITIAL_POINT_TRANSACTIONS, INITIAL_LEADERBOARD } from '../mocks/initialData';
import { useAuthStore } from './authStore';
import { useTournamentSessionStore } from './tournamentSessionStore';
import { isSessionFinished } from '../utils/tournamentFinalization';
import { POINTS_LEDGER_KEY, sessionHasRewardRequest } from '../utils/tournamentRewards';
import { validatePrizeConfiguration } from '../utils/tournamentPrizes';

export { POINTS_LEDGER_KEY } from '../utils/tournamentRewards';
export type PointActionResult = { success: true } | { success: false; message: string };
interface Ledger {
  requests: PointRequest[]; transactions: PointTransaction[]; leaderboard: PlayerLeaderboardEntry[];
  memberStats: Record<string, NonNullable<User['playerStats']>>;
}
type RequestInput = Omit<PointRequest, 'id' | 'code' | 'status' | 'createdAt' | 'reviewedBy' | 'reviewedAt' | 'reviewNotes'>;
interface PointsState extends Ledger {
  loadError: string | null;
  createRequest: (data: RequestInput) => PointRequest;
  createTopTourRequest: (data: { sessionId: string; rank: number; memberId: string }) => PointRequest;
  createTopTourBatch: (data: { sessionId: string; assignments: { rank: number; memberId: string }[]; expectedFinalizedAt?: string }) => PointRequest;
  approveRequest: (id: string, reviewerId?: string, reviewerName?: string, notes?: string) => PointActionResult;
  rejectRequest: (id: string, reviewerId?: string, reviewerName?: string, notes?: string) => PointActionResult;
  getPlayerPoints: (id: string) => number;
  getPlayerTransactions: (id: string) => PointTransaction[];
  getPlayerRequests: (id: string) => PointRequest[];
}

function readLedger(): Ledger {
  const raw = localStorage.getItem(POINTS_LEDGER_KEY);
  if (raw) {
    const data = JSON.parse(raw);
    if (data.version !== 2 || !Array.isArray(data.requests) || !Array.isArray(data.transactions) || !Array.isArray(data.leaderboard) || !data.memberStats) throw new Error('Dữ liệu sổ điểm không hợp lệ. Dữ liệu gốc được giữ nguyên.');
    return data;
  }
  const read = <T,>(key: string, fallback: T[]): T[] => {
    const value = localStorage.getItem(key); const data = value ? JSON.parse(value) : structuredClone(fallback);
    if (!Array.isArray(data)) throw new Error('Dữ liệu điểm cũ không hợp lệ.');
    return data;
  };
  return { requests: read('poker_cafe_point_requests', INITIAL_POINT_REQUESTS), transactions: read('poker_cafe_point_transactions', INITIAL_POINT_TRANSACTIONS), leaderboard: read('poker_cafe_leaderboard', INITIAL_LEADERBOARD), memberStats: {} };
}

function projectMemberStats(data: Ledger) {
  const auth = useAuthStore.getState();
  const users = auth.users.map((user) => data.memberStats[user.id] ? { ...user, playerStats: { ...data.memberStats[user.id] } } : user);
  useAuthStore.setState({ users, currentUser: users.find((user) => user.id === auth.currentUser?.id) || auth.currentUser });
  useTournamentSessionStore.getState().refreshRewardProcessing();
}
function saveLedger(data: Ledger) {
  // One storage write publishes request status, transaction, balance and rank
  // together. Auth users are a projection, restored from this same ledger.
  localStorage.setItem(POINTS_LEDGER_KEY, JSON.stringify({ version: 2, ...data }));
}
const cents = (value: number) => Math.round(value * 100);
const validAmount = (value: number) => Number.isFinite(value) && Number.isSafeInteger(cents(value)) && Math.abs(value * 100 - cents(value)) < 0.0000001;
const tier = (points: number): PlayerLeaderboardEntry['tier'] => points >= 15000 ? 'DIAMOND' : points >= 10000 ? 'PLATINUM' : points >= 6000 ? 'GOLD' : points >= 3000 ? 'SILVER' : 'BRONZE';
function actor() {
  const user = useAuthStore.getState().currentUser;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'CASHIER')) throw new Error('Chỉ Admin và Thu ngân được tạo yêu cầu Top Tour.');
  return { id: user.id, name: user.fullName, role: user.role };
}
function requestRecord(data: RequestInput): PointRequest {
  const id = crypto.randomUUID();
  return { ...data, id, code: `PR-${id.slice(0, 8).toUpperCase()}`, status: 'PENDING', createdAt: new Date().toISOString() };
}
export function topRankAssigned(requests: PointRequest[], sessionId: string, rank: number, exceptId?: string) {
  return requests.some((request) => request.id !== exceptId && request.pointType === 'TOUR_REWARD' &&
    (request.sessionId || request.tournamentId) === sessionId && (request.tournamentRank === rank || request.topAssignments?.some((assignment) => assignment.rank === rank)) && request.status !== 'REJECTED');
}

export function topMemberAssigned(requests: PointRequest[], sessionId: string, memberId: string, exceptId?: string) {
  return requests.some((request) => request.id !== exceptId && request.pointType === 'TOUR_REWARD' &&
    (request.sessionId || request.tournamentId) === sessionId && request.status !== 'REJECTED' &&
    (request.playerId === memberId || request.topAssignments?.some((assignment) => assignment.memberId === memberId)));
}

export function requestsForMember(requests: PointRequest[], memberId: string): PointRequest[] {
  return requests.flatMap((request) => {
    if (!request.topAssignments) return request.playerId === memberId ? [request] : [];
    const assignment = request.topAssignments.find((item) => item.memberId === memberId);
    return assignment ? [{ ...request, playerId: memberId, playerName: assignment.playerName, playerPhone: assignment.playerPhone,
      amount: assignment.points, tournamentRank: assignment.rank, topAssignments: [assignment] }] : [];
  });
}

function validateBatch(data: Ledger, sessionId: string, assignments: { rank: number; memberId: string }[], exceptId?: string) {
  const tour = useTournamentSessionStore.getState().tournaments.find((item) => item.id === sessionId);
  if (!tour || !['FINISHED', 'COMPLETED'].includes(tour.status) || !tour.finalResults) throw new Error('Chọn phiên FINISHED có kết quả đã chốt.');
  if (tour.archivedAt) throw new Error('Phiên đã được lưu trữ.');
  if (sessionHasRewardRequest(data.requests, sessionId, exceptId)) throw new Error('Phiên đã có yêu cầu chờ duyệt hoặc đã duyệt.');
  if (data.transactions.some((transaction) => transaction.sessionId === sessionId || (transaction.type === 'TOUR_REWARD' && transaction.referenceId === sessionId))) throw new Error('Phiên đã có giao dịch thưởng.');
  const final = tour.finalResults;
  if (!Array.isArray(final.payouts) || Object.keys(validatePrizeConfiguration(final.prizeConfiguration)).length || final.payouts.length !== final.prizeConfiguration.positions.length) throw new Error('Cấu hình thưởng đã chốt không hợp lệ.');
  if (!Array.isArray(assignments) || assignments.length !== final.payouts.length || !assignments.length) throw new Error('Cần gán đủ tất cả vị trí TOP.');
  if (!assignments.every((item) => item && Number.isSafeInteger(item.rank) && typeof item.memberId === 'string' && item.memberId.trim())) throw new Error('Vị trí TOP và mã Player không hợp lệ.');
  if (new Set(assignments.map((item) => item.rank)).size !== assignments.length || new Set(assignments.map((item) => item.memberId)).size !== assignments.length) throw new Error('Mỗi TOP và mỗi Player chỉ được gán một lần.');
  const resolved: TopTourAssignment[] = final.payouts.map((payout, index) => {
    const assignment = assignments.find((item) => item.rank === payout.place);
    if (!assignment || payout.place !== index + 1 || payout.percentage !== final.prizeConfiguration.positions[index].percentage || !validAmount(payout.points) || payout.points < 0) throw new Error('Vị trí hoặc điểm thưởng đã chốt không hợp lệ.');
    const member = useAuthStore.getState().users.find((item) => item.id === assignment.memberId && item.role === 'PLAYER' && item.status === 'ACTIVE');
    if (!member) throw new Error('Chọn Player đang hoạt động từ kết quả tìm kiếm.');
    if (topMemberAssigned(data.requests, sessionId, member.id, exceptId)) throw new Error('Player đã có thưởng TOP trong phiên này.');
    return { rank: payout.place, memberId: member.id, playerName: member.fullName, playerPhone: member.phone, points: payout.points };
  });
  const totalUnits = resolved.reduce((sum, item) => sum + cents(item.points), 0);
  if (!validAmount(final.totalPrizePoints) || final.totalPrizePoints < 0 || !Number.isSafeInteger(totalUnits) || totalUnits !== cents(final.totalPrizePoints)) throw new Error('Tổng thưởng TOP không khớp quỹ đã chốt.');
  return { tour, assignments: resolved };
}

function creditPoints(data: Ledger, target: PointRequest, memberId: string, amount: number, rank: number | undefined, user: User, timestamp: string): Ledger {
  const member = useAuthStore.getState().users.find((item) => item.id === memberId && item.role === 'PLAYER');
  if (!member) throw new Error('Không tìm thấy hội viên.');
  const entry = data.leaderboard.find((item) => item.playerId === member.id);
  const previousPoints = entry?.currentPoints ?? data.memberStats[member.id]?.currentPoints ?? member.playerStats?.currentPoints ?? 0;
  const balanceUnits = Math.max(0, cents(previousPoints) + cents(amount));
  if (!Number.isSafeInteger(balanceUnits)) throw new Error('Số dư vượt giới hạn an toàn.');
  const balance = balanceUnits / 100;
  const stats = { currentPoints: balance, totalToursPlayed: member.playerStats?.totalToursPlayed || entry?.totalToursPlayed || 1,
    toursWon: (data.memberStats[member.id]?.toursWon ?? member.playerStats?.toursWon ?? entry?.toursWon ?? 0) + (rank === 1 ? 1 : 0), rankTier: tier(balance) };
  const updatedEntry: PlayerLeaderboardEntry = { ...(entry || { rank: 0, playerId: member.id, playerName: member.fullName, phone: member.phone, totalToursPlayed: stats.totalToursPlayed, toursWon: 0, winRate: 0, tier: tier(balance), currentPoints: balance }),
    playerName: member.fullName, currentPoints: balance, toursWon: stats.toursWon, tier: tier(balance) };
  const leaderboard = [...data.leaderboard.filter((item) => item.playerId !== member.id), updatedEntry].sort((a, b) => b.currentPoints - a.currentPoints).map((item, index) => ({ ...item, rank: index + 1 }));
  const transaction: PointTransaction = { id: crypto.randomUUID(), requestId: target.id, referenceId: target.id,
    sessionId: target.sessionId, topRank: rank, playerId: member.id, playerName: member.fullName, amount, balanceAfter: balance, type: target.pointType,
    description: target.topAssignments && rank ? `Thưởng TOP ${rank} — ${target.tournamentName}` : target.reason, createdByName: user.fullName, createdAt: timestamp };
  return { ...data, transactions: [transaction, ...data.transactions], leaderboard, memberStats: { ...data.memberStats, [member.id]: stats } };
}

export const usePointsStore = create<PointsState>((set, get) => {
  let initial: Ledger = { requests: [], transactions: [], leaderboard: [], memberStats: {} };
  let loadError: string | null = null;
  try { initial = readLedger(); projectMemberStats(initial); } catch (error) { loadError = error instanceof Error ? error.message : 'Không đọc được sổ điểm.'; }
  const latest = (): Ledger => {
    if (get().loadError) throw new Error(get().loadError!);
    return localStorage.getItem(POINTS_LEDGER_KEY) ? readLedger() : get();
  };
  const commit = (data: Ledger) => { saveLedger({ requests: data.requests, transactions: data.transactions, leaderboard: data.leaderboard, memberStats: data.memberStats }); set(data); projectMemberStats(data); };
  return { ...initial, loadError,
    createRequest: (input) => {
      const auth = useAuthStore.getState(); const user = auth.currentUser;
      if (!user || (user.role !== 'ADMIN' && user.role !== 'CASHIER' && !auth.hasPermission('POINT_REQUEST'))) throw new Error('Bạn không có quyền đề xuất điểm.');
      if (input.pointType === 'TOUR_REWARD') throw new Error('Dùng “Cộng điểm Top Tour” và chọn phiên FINISHED để đề xuất thưởng Tour.');
      if (input.topAssignments || input.archivedAt) throw new Error('Thông tin toàn bộ TOP chỉ được tạo từ phiên đã chốt.');
      if (!['MANUAL_BONUS', 'EVENT', 'PENALTY'].includes(input.pointType)) throw new Error('Loại yêu cầu điểm không hợp lệ.');
      const member = auth.users.find((item) => item.id === input.playerId && item.role === 'PLAYER');
      if (!member || !validAmount(input.amount) || input.amount === 0 || !input.reason.trim()) throw new Error('Kiểm tra hội viên, số điểm (tối đa 2 chữ số thập phân) và lý do.');
      const data = latest();
      const request = requestRecord({ ...input, playerName: member.fullName, playerPhone: member.phone,
        requestedBy: { id: user.id, name: user.fullName, role: user.role } });
      commit({ ...data, requests: [request, ...data.requests] }); return request;
    },
    createTopTourBatch: ({ sessionId, assignments, expectedFinalizedAt }) => {
      const requestedBy = actor();
      const data = latest();
      const validated = validateBatch(data, sessionId, assignments);
      const tour = validated.tour;
      if (expectedFinalizedAt && expectedFinalizedAt !== tour.finalResults!.finalizedAt) throw new Error('Kết quả phiên đã thay đổi. Chọn lại phiên và kiểm tra.');
      const request = requestRecord({ playerId: `batch:${sessionId}`, playerName: `${validated.assignments.length} Player`,
        amount: tour.finalResults!.totalPrizePoints, pointType: 'TOUR_REWARD', reason: `Thưởng Top Tour — ${tour.name}`,
        sessionId, templateId: tour.templateId || tour.id, sessionDate: tour.startedAt || tour.createdAt,
        tournamentId: sessionId, tournamentName: tour.name, rewardSnapshot: structuredClone(tour.finalResults!),
        topAssignments: validated.assignments, requestedBy });
      commit({ ...data, requests: [request, ...data.requests] });
      return request;
    },
    createTopTourRequest: ({ sessionId, rank, memberId }) => {
      const requestedBy = actor(); const data = latest();
      const tour = useTournamentSessionStore.getState().tournaments.find((item) => item.id === sessionId);
      if (!tour || !isSessionFinished(tour) || !tour.finalResults) throw new Error('Chỉ phiên FINISHED có kết quả đã chốt mới được thưởng Top Tour.');
      if (tour.archivedAt || data.requests.some((item) => item.sessionId === sessionId && item.topAssignments && item.status !== 'REJECTED')) throw new Error('Phiên đã lưu trữ hoặc đã có yêu cầu toàn bộ TOP.');
      if (topMemberAssigned(data.requests, sessionId, memberId)) throw new Error('Player đã được gán TOP trong phiên này.');
      const payout = tour.finalResults.payouts.find((item) => item.place === rank);
      if (!Number.isSafeInteger(rank) || !payout || !validAmount(payout.points) || payout.points < 0) throw new Error('Vị trí TOP không hợp lệ.');
      if (topRankAssigned(data.requests, sessionId, rank)) throw new Error('TOP này đã có yêu cầu chờ duyệt hoặc đã duyệt.');
      const member = useAuthStore.getState().users.find((item) => item.id === memberId && item.role === 'PLAYER' && item.status === 'ACTIVE');
      if (!member) throw new Error('Chọn hội viên đang hoạt động theo mã hội viên.');
      const request = requestRecord({ playerId: member.id, playerName: member.fullName, playerPhone: member.phone,
        amount: payout.points, pointType: 'TOUR_REWARD', reason: `Thưởng TOP ${rank} — ${tour.name}`,
        sessionId, templateId: tour.templateId || tour.id, sessionDate: tour.createdAt,
        tournamentId: sessionId, tournamentName: tour.name, tournamentRank: rank,
        rewardSnapshot: structuredClone(tour.finalResults), requestedBy });
      commit({ ...data, requests: [request, ...data.requests] }); return request;
    },
    approveRequest: (id, reviewerId, _reviewerName, notes) => {
      try {
        const user = useAuthStore.getState().currentUser;
        if (user?.role !== 'ADMIN' || (reviewerId && reviewerId !== user.id)) throw new Error('Chỉ Admin đang đăng nhập được duyệt điểm.');
        const data = latest(); const target = data.requests.find((request) => request.id === id);
        if (!target || target.status !== 'PENDING') throw new Error('Yêu cầu không còn chờ duyệt.');
        if (data.transactions.some((transaction) => transaction.requestId === id || transaction.referenceId === id)) throw new Error('Yêu cầu đã được cộng điểm.');
        if (target.topAssignments) {
          if (target.pointType !== 'TOUR_REWARD' || !target.sessionId || !target.rewardSnapshot) throw new Error('Yêu cầu TOP thiếu thông tin phiên.');
          const validated = validateBatch(data, target.sessionId, target.topAssignments, id);
          if (
            target.templateId !== (validated.tour.templateId || validated.tour.id) ||
            JSON.stringify(target.rewardSnapshot) !== JSON.stringify(validated.tour.finalResults) ||
            !validAmount(target.amount) ||
            cents(target.amount) !== cents(validated.tour.finalResults!.totalPrizePoints) ||
            target.topAssignments.some((assignment, index) => {
              const frozen = validated.assignments[index];
              return assignment.rank !== frozen.rank || !validAmount(assignment.points) || cents(assignment.points) !== cents(frozen.points);
            })
          ) {
            throw new Error('Kết quả thưởng đã chốt không khớp yêu cầu.');
          }
          const timestamp = new Date().toISOString();
          let updated = data;
          for (const assignment of validated.assignments) updated = creditPoints(updated, target, assignment.memberId, assignment.points, assignment.rank, user, timestamp);
          commit({ ...updated, requests: data.requests.map((request) => request.id === id ? { ...request, status: 'APPROVED', archivedAt: timestamp,
            reviewedBy: { id: user.id, name: user.fullName }, reviewedAt: timestamp, reviewNotes: notes || 'Đã duyệt toàn bộ TOP' } : request) });
          return { success: true };
        }
        if (target.pointType === 'TOUR_REWARD') {
          const sessionId = target.sessionId || target.tournamentId;
          if (!target.rewardSnapshot || !sessionId || !target.tournamentRank) throw new Error('Yêu cầu Tour cũ chưa có snapshot. Từ chối và tạo lại từ phiên FINISHED.');
          const tour = useTournamentSessionStore.getState().tournaments.find((item) => item.id === sessionId);
          const payout = tour?.finalResults?.payouts.find((item) => item.place === target.tournamentRank);
          if (!tour || !isSessionFinished(tour) || target.templateId !== (tour.templateId || tour.id) || !payout || cents(payout.points) !== cents(target.amount) || JSON.stringify(tour.finalResults) !== JSON.stringify(target.rewardSnapshot)) throw new Error('Kết quả chốt không khớp yêu cầu.');
          if (topRankAssigned(data.requests, sessionId, target.tournamentRank, id)) throw new Error('TOP đã được gán cho yêu cầu khác.');
          if (topMemberAssigned(data.requests, sessionId, target.playerId, id)) throw new Error('Player đã được gán TOP khác trong phiên này.');
        }
        if (!validAmount(target.amount)) throw new Error('Điểm không hợp lệ.');
        const timestamp = new Date().toISOString();
        const next = creditPoints(data, target, target.playerId, target.amount, target.tournamentRank, user, timestamp);
        commit({ ...next, requests: data.requests.map((request) => request.id === id ? { ...request, status: 'APPROVED', reviewedBy: { id: user.id, name: user.fullName }, reviewedAt: timestamp, reviewNotes: notes || 'Đã duyệt' } : request) });
        return { success: true };
      } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Không lưu được phê duyệt.' }; }
    },
    rejectRequest: (id, reviewerId, _reviewerName, notes) => {
      try {
        const user = useAuthStore.getState().currentUser;
        if (user?.role !== 'ADMIN' || (reviewerId && reviewerId !== user.id)) throw new Error('Chỉ Admin được từ chối yêu cầu.');
        if (!notes?.trim()) throw new Error('Vui lòng nhập lý do từ chối.');
        const data = latest(); const target = data.requests.find((request) => request.id === id);
        if (!target || target.status !== 'PENDING') throw new Error('Yêu cầu không còn chờ duyệt.');
        commit({ ...data, requests: data.requests.map((request) => request.id === id ? { ...request, status: 'REJECTED', reviewedBy: { id: user.id, name: user.fullName }, reviewedAt: new Date().toISOString(), reviewNotes: notes.trim() } : request) });
        return { success: true };
      } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Không lưu được từ chối.' }; }
    },
    getPlayerPoints: (id) => get().leaderboard.find((item) => item.playerId === id)?.currentPoints ?? get().memberStats[id]?.currentPoints ?? useAuthStore.getState().users.find((user) => user.id === id)?.playerStats?.currentPoints ?? 0,
    getPlayerTransactions: (id) => get().transactions.filter((item) => item.playerId === id),
    getPlayerRequests: (id) => requestsForMember(get().requests, id),
  };
});

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const refresh = (event: StorageEvent) => {
    if (event.key !== POINTS_LEDGER_KEY) return;
    try { const data = readLedger(); usePointsStore.setState({ ...data, loadError: null }); projectMemberStats(data); }
    catch (error) { usePointsStore.setState({ loadError: error instanceof Error ? error.message : 'Không đọc được sổ điểm.' }); }
  };
  window.addEventListener('storage', refresh);
  if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('storage', refresh));
}
