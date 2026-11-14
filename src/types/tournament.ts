export type TourStatus = 'CREATED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

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
  code: string;
  name: string;
  description?: string;
  startingChips: number;
  maxPlayers: number;
  registeredCount: number;
  status: TourStatus;
  
  // Timing structure
  structure: BlindStructureConfig;
  
  // Real-time Clock State
  currentStageIndex: number; // index in structure.stages
  stageRemainingSeconds: number; // Remaining time in current stage
  timerStartedAt?: number; // Timestamp (ms) when current run started
  lastUpdatedAt?: number; // Last timestamp synchronized
  totalElapsedSeconds: number; // Total running time in seconds
  
  // Tournament lifecycle
  scheduledStartTime: string;
  startedAt?: string;
  endedAt?: string;
  pausedAt?: string;

  // Participants & Final results
  participants: TourParticipant[];
  totalPrizePool?: number;
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

