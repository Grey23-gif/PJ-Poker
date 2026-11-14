import { create } from 'zustand';
import {
  PointRequest,
  PointTransaction,
  PlayerLeaderboardEntry,
  PointRequestStatus,
  PointType,
} from '../types/points';
import {
  INITIAL_POINT_REQUESTS,
  INITIAL_POINT_TRANSACTIONS,
  INITIAL_LEADERBOARD,
} from '../mocks/initialData';
import { useAuthStore } from './authStore';

interface PointsState {
  requests: PointRequest[];
  transactions: PointTransaction[];
  leaderboard: PlayerLeaderboardEntry[];

  // Request Creation
  createRequest: (data: {
    playerId: string;
    playerName: string;
    playerPhone?: string;
    amount: number;
    pointType: PointType;
    reason: string;
    tournamentId?: string;
    tournamentName?: string;
    tournamentRank?: number;
    requestedBy: { id: string; name: string; role: string };
  }) => PointRequest;

  // Review Workflow (Admin only)
  approveRequest: (requestId: string, reviewerId: string, reviewerName: string, reviewNotes?: string) => void;
  rejectRequest: (requestId: string, reviewerId: string, reviewerName: string, reviewNotes: string) => void;

  // Helpers
  getPlayerPoints: (playerId: string) => number;
  getPlayerTransactions: (playerId: string) => PointTransaction[];
  getPlayerRequests: (playerId: string) => PointRequest[];
}

const STORAGE_KEY_POINT_REQUESTS = 'poker_cafe_point_requests';
const STORAGE_KEY_POINT_TRANSACTIONS = 'poker_cafe_point_transactions';
const STORAGE_KEY_LEADERBOARD = 'poker_cafe_leaderboard';

function loadStoredRequests(): PointRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POINT_REQUESTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading point requests', e);
  }
  return INITIAL_POINT_REQUESTS;
}

function loadStoredTransactions(): PointTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POINT_TRANSACTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading point transactions', e);
  }
  return INITIAL_POINT_TRANSACTIONS;
}

function loadStoredLeaderboard(): PlayerLeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading leaderboard', e);
  }
  return INITIAL_LEADERBOARD;
}

export const usePointsStore = create<PointsState>((set, get) => {
  const initialRequests = loadStoredRequests();
  const initialTransactions = loadStoredTransactions();
  const initialLeaderboard = loadStoredLeaderboard();

  return {
    requests: initialRequests,
    transactions: initialTransactions,
    leaderboard: initialLeaderboard,

    createRequest: (data) => {
      const { requests } = get();
      const now = new Date();
      const codeDate = now.toISOString().slice(2, 10).replace(/-/g, '');
      const code = `PR-${codeDate}-${String(requests.length + 1).padStart(2, '0')}`;

      const newRequest: PointRequest = {
        id: `req-${Date.now()}`,
        code,
        ...data,
        status: 'PENDING',
        createdAt: now.toISOString(),
      };

      const updated = [newRequest, ...requests];
      localStorage.setItem(STORAGE_KEY_POINT_REQUESTS, JSON.stringify(updated));
      set({ requests: updated });
      return newRequest;
    },

    approveRequest: (requestId: string, reviewerId: string, reviewerName: string, reviewNotes?: string) => {
      const { requests, transactions, leaderboard } = get();
      const target = requests.find((r) => r.id === requestId);
      if (!target || target.status !== 'PENDING') return;

      const now = new Date().toISOString();

      // 1. Update request status to APPROVED
      const updatedRequests = requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'APPROVED' as PointRequestStatus,
              reviewedBy: { id: reviewerId, name: reviewerName },
              reviewNotes: reviewNotes || 'Đã phê duyệt cộng/trừ điểm tích lũy.',
              reviewedAt: now,
            }
          : r
      );

      // 2. Calculate new balance for player
      const currentPlayerPoints = get().getPlayerPoints(target.playerId);
      const newBalance = Math.max(0, currentPlayerPoints + target.amount);

      // 3. Create a transaction log
      const newTx: PointTransaction = {
        id: `tx-${Date.now()}`,
        playerId: target.playerId,
        playerName: target.playerName,
        amount: target.amount,
        balanceAfter: newBalance,
        type: target.pointType,
        description: target.reason,
        referenceId: target.tournamentId || target.id,
        createdByName: reviewerName,
        createdAt: now,
      };
      const updatedTransactions = [newTx, ...transactions];

      // 4. Update leaderboard
      let updatedLeaderboard = [...leaderboard];
      const playerEntryIndex = updatedLeaderboard.findIndex((e) => e.playerId === target.playerId);

      if (playerEntryIndex >= 0) {
        const entry = updatedLeaderboard[playerEntryIndex];
        const updatedPoints = newBalance;
        let newTier: 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' = entry.tier;
        if (updatedPoints >= 15000) newTier = 'DIAMOND';
        else if (updatedPoints >= 10000) newTier = 'PLATINUM';
        else if (updatedPoints >= 6000) newTier = 'GOLD';
        else if (updatedPoints >= 3000) newTier = 'SILVER';
        else newTier = 'BRONZE';

        updatedLeaderboard[playerEntryIndex] = {
          ...entry,
          currentPoints: updatedPoints,
          tier: newTier,
          toursWon: target.tournamentRank === 1 ? entry.toursWon + 1 : entry.toursWon,
        };
      } else {
        updatedLeaderboard.push({
          rank: updatedLeaderboard.length + 1,
          playerId: target.playerId,
          playerName: target.playerName,
          phone: target.playerPhone || '',
          currentPoints: newBalance,
          totalToursPlayed: 1,
          toursWon: target.tournamentRank === 1 ? 1 : 0,
          winRate: target.tournamentRank === 1 ? 100 : 0,
          tier: 'BRONZE',
        });
      }

      // Re-sort leaderboard by currentPoints descending
      updatedLeaderboard.sort((a, b) => b.currentPoints - a.currentPoints);
      updatedLeaderboard = updatedLeaderboard.map((item, idx) => ({ ...item, rank: idx + 1 }));

      // 5. Update user in authStore as well
      const authStore = useAuthStore.getState();
      const user = authStore.users.find((u) => u.id === target.playerId);
      if (user) {
        authStore.updateUser(target.playerId, {
          playerStats: {
            currentPoints: newBalance,
            totalToursPlayed: user.playerStats?.totalToursPlayed || 1,
            toursWon: target.tournamentRank === 1 ? (user.playerStats?.toursWon || 0) + 1 : (user.playerStats?.toursWon || 0),
            rankTier:
              newBalance >= 15000
                ? 'DIAMOND'
                : newBalance >= 10000
                ? 'PLATINUM'
                : newBalance >= 6000
                ? 'GOLD'
                : newBalance >= 3000
                ? 'SILVER'
                : 'BRONZE',
          },
        });
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_POINT_REQUESTS, JSON.stringify(updatedRequests));
      localStorage.setItem(STORAGE_KEY_POINT_TRANSACTIONS, JSON.stringify(updatedTransactions));
      localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(updatedLeaderboard));

      set({
        requests: updatedRequests,
        transactions: updatedTransactions,
        leaderboard: updatedLeaderboard,
      });
    },

    rejectRequest: (requestId: string, reviewerId: string, reviewerName: string, reviewNotes: string) => {
      const { requests } = get();
      const now = new Date().toISOString();

      const updatedRequests = requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'REJECTED' as PointRequestStatus,
              reviewedBy: { id: reviewerId, name: reviewerName },
              reviewNotes: reviewNotes || 'Đã từ chối yêu cầu điểm.',
              reviewedAt: now,
            }
          : r
      );

      localStorage.setItem(STORAGE_KEY_POINT_REQUESTS, JSON.stringify(updatedRequests));
      set({ requests: updatedRequests });
    },

    getPlayerPoints: (playerId: string) => {
      const { leaderboard } = get();
      const entry = leaderboard.find((e) => e.playerId === playerId);
      if (entry) return entry.currentPoints;
      const user = useAuthStore.getState().users.find((u) => u.id === playerId);
      return user?.playerStats?.currentPoints || 0;
    },

    getPlayerTransactions: (playerId: string) => {
      const { transactions } = get();
      return transactions.filter((t) => t.playerId === playerId);
    },

    getPlayerRequests: (playerId: string) => {
      const { requests } = get();
      return requests.filter((r) => r.playerId === playerId);
    },
  };
});

