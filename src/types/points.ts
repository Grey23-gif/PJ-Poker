export type PointRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PointType = 'TOUR_REWARD' | 'MANUAL_BONUS' | 'EVENT' | 'PENALTY';

export interface PointRequest {
  id: string;
  code: string;
  playerId: string;
  playerName: string;
  playerPhone?: string;
  amount: number; // positive for addition, negative for deduction
  pointType: PointType;
  reason: string;
  tournamentId?: string;
  tournamentName?: string;
  tournamentRank?: number;
  status: PointRequestStatus;
  requestedBy: {
    id: string;
    name: string;
    role: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface PointTransaction {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  balanceAfter: number;
  type: PointType;
  description: string;
  referenceId?: string; // PointRequest id or Tour id
  createdByName: string;
  createdAt: string;
}

export interface PlayerLeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  phone: string;
  avatar?: string;
  currentPoints: number;
  totalToursPlayed: number;
  toursWon: number;
  winRate: number; // percentage
  tier: 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
}

