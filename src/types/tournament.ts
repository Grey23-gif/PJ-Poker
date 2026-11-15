import type { TournamentPrizeConfiguration } from './tournamentPrizes';

export type TourStatus = 'CREATED' | 'RUNNING' | 'PAUSED' | 'FINISHED' | 'COMPLETED' | 'CANCELLED';

export interface TournamentStatistics {
  totalStack: number;
  entries: number;
  uniquePlayers: number;
  playersRemaining: number;
}

export type ChipIssueType = 'BUY_IN' | 'RE_ENTRY' | 'RE_BUY' | 'ADD_ON';
export interface TournamentStatisticsChange {
  id: string;
  timestamp: string;
  actor: { id: string; name: string; role: string };
  type: ChipIssueType | 'CORRECTION' | 'ELIMINATION' | 'PLAYER_STACK' | 'CREATED' | 'RESET';
  reason: string;
  before: TournamentStatistics;
  after: TournamentStatistics;
  playerId?: string;
  playerName?: string;
  chipsIssued?: number;
  previousPlayerStack?: number;
  nextPlayerStack?: number;
}

export type StatisticsResult = { success: true } | { success: false; message: string };

export interface TournamentFinalResults {
  statistics: TournamentStatistics;
  averageStack: number;
  prizeConfiguration: TournamentPrizeConfiguration;
  totalPrizePoints: number;
  payouts: { place: number; percentage: number; points: number }[];
  finalizedAt: string;
  finalizedBy: { id: string; name: string; role: string };
}

export type TournamentBackground = (
  | { source: 'default' | 'none' }
  | { source: 'url'; url: string }
  | { source: 'upload'; assetId: string; fileName: string }
) & { overlay: number };

export interface BlindLevel {
  id: string;
  stageType: 'LEVEL' | 'BREAK';
  levelNumber?: number; // 1, 2, 3...
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  durationMinutes: number; // Duration in minutes
  name: string; // e.g. "Level 1" or "Break 1 - Giải Lao 10 Phút"
}

export interface TourParticipant {
  id: string;
  playerId: string;
  playerName: string;
  phone?: string;
  initialChips: number;
  currentChips: number;
  isEliminated: boolean;
  eliminatedRank?: number; // 1st, 2nd, 3rd...
  eliminatedAt?: string;
  pointsAwarded?: number;
}

export interface BlindStructureConfig {
  preBreakDurationMinutes: number; // Default duration before 1st break
  postBreakDurationMinutes: number; // Default duration after 1st break
  initialSmallBlind: number;
  initialBigBlind: number;
  stages: BlindLevel[];
}

export interface Tournament {
  id: string;
  templateId?: string; // Required on persisted sessions; optional for legacy fixtures.
  archivedAt?: string;
  rewardBatchId?: string;
  rewardStatus?: 'FINISHED' | 'TOP_REWARD_PENDING' | 'TOP_REWARD_APPROVED' | 'ARCHIVED';
  entryStackOnly?: boolean; // New sessions forbid independent Re-buy/Add-on issuance.
  code: string;
  name: string;
  description?: string;
  tourBackground?: TournamentBackground;
  clockBackground?: TournamentBackground;
  startingChips: number;
  maxPlayers: number;
  registeredCount: number;
  status: TourStatus;
  
  // Timing structure
  structure: BlindStructureConfig;
  // Registration closes at the start of this LEVEL, optionally following a break.
  registrationEndStageId?: string;
  buyInCloseBreakId?: string;
  buyInClosedAt?: string;
  buyInCloseReason?: 'AUTO' | 'MANUAL';
  
  // Real-time Clock State
  currentStageIndex: number; // index in structure.stages
  stageRemainingSeconds: number; // Remaining time in current stage
  timerStartedAt?: number; // Timestamp (ms) when current run started
  lastUpdatedAt?: number; // Last timestamp synchronized
  totalElapsedSeconds: number; // Total running time in seconds
  
  // Tournament lifecycle
  scheduledStartTime?: string; // Legacy metadata only; not configured or displayed.
  startedAt?: string;
  endedAt?: string;
  pausedAt?: string;

  // Participants & Final results
  participants: TourParticipant[];
  statistics?: TournamentStatistics;
  statisticsHistory?: TournamentStatisticsChange[];
  statisticsNeedsReview?: boolean;
  finalResults?: TournamentFinalResults;
  totalPrizePool?: number;
  prizeConfiguration?: TournamentPrizeConfiguration;
  firstPlacePrize?: number;
  placesPaid?: number;
  finalRanks?: {
    rank: number;
    playerId: string;
    playerName: string;
    points: number;
  }[];
  
  createdAt: string;
  createdBy: string;
}

