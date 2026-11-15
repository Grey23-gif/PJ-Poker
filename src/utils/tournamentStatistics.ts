import type { Tournament, TournamentStatistics } from '../types/tournament';

export const STATISTIC_LABELS: Record<keyof TournamentStatistics, string> = {
  totalStack: 'Total Stack', entries: 'Total Entries',
  uniquePlayers: 'Unique Players', playersRemaining: 'Players Remaining',
};

/** Statistics for the current tournament session. Every entry contributes one
 * configured starting stack; the two calculated fields are never editable. */
export function deriveStatistics(startingChips: number, counts: Pick<TournamentStatistics, 'entries' | 'uniquePlayers' | 'playersRemaining'>): TournamentStatistics {
  return {
    entries: counts.entries,
    uniquePlayers: counts.uniquePlayers,
    playersRemaining: counts.playersRemaining,
    totalStack: counts.entries * startingChips,
  };
}

export function getTournamentStatistics(tour: Tournament): TournamentStatistics {
  if (tour.finalResults) return { ...tour.finalResults.statistics };
  if (tour.statistics) return deriveStatistics(tour.startingChips || 0, tour.statistics);
  const participants = tour.participants || [];
  const entries = Math.max(tour.registeredCount || 0, participants.length);
  const uniquePlayers = entries - participants.length + new Set(participants.map((p) => p.playerId)).size;
  return deriveStatistics(tour.startingChips || 0, { entries, uniquePlayers, playersRemaining: participants.filter((p) => !p.isEliminated).length });
}

export function averageStack(statistics: TournamentStatistics): number {
  return statistics.playersRemaining > 0 ? statistics.totalStack / statistics.playersRemaining : 0;
}

/** Applies an unsaved editor adjustment. Validation remains the save gate. */
export function adjustStatisticCounts(
  counts: Pick<TournamentStatistics, 'entries' | 'uniquePlayers' | 'playersRemaining'>,
  entryDelta: number,
  uniqueDelta = 0,
): Pick<TournamentStatistics, 'entries' | 'uniquePlayers' | 'playersRemaining'> {
  const safeCount = (value: number) => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  return {
    entries: Math.max(0, safeCount(counts.entries) + entryDelta),
    uniquePlayers: Math.max(0, safeCount(counts.uniquePlayers) + uniqueDelta),
    playersRemaining: safeCount(counts.playersRemaining),
  };
}

export function validateStatistics(statistics: TournamentStatistics, startingChips?: number): Partial<Record<keyof TournamentStatistics, string>> {
  const errors: Partial<Record<keyof TournamentStatistics, string>> = {};
  for (const key of Object.keys(STATISTIC_LABELS) as (keyof TournamentStatistics)[]) {
    if (!Number.isSafeInteger(statistics[key]) || statistics[key] < 0) errors[key] = 'Nhập số nguyên không âm trong giới hạn an toàn.';
  }
  if (Object.keys(errors).length) return errors;
  if (statistics.uniquePlayers > statistics.entries) errors.uniquePlayers = 'Số người chơi duy nhất không được vượt tổng lượt tham gia.';
  if (statistics.playersRemaining > statistics.uniquePlayers) errors.playersRemaining = 'Số người còn lại không được vượt số người chơi duy nhất.';
  if (statistics.playersRemaining > 0 && statistics.totalStack === 0) errors.totalStack = 'Tổng chip phải lớn hơn 0 khi còn người chơi.';
  if (statistics.entries === 0 && statistics.totalStack > 0) errors.totalStack = 'Cần có lượt tham gia trước khi ghi nhận chip lưu hành.';
  if (startingChips !== undefined && statistics.totalStack !== statistics.entries * startingChips) errors.totalStack = 'Tổng chip phải được tính từ tổng lượt tham gia và chip khởi đầu.';
  return errors;
}

export function hasAdditionalChipIssuance(tour: Tournament): boolean {
  return (tour.statisticsHistory || []).some((change) => change.type === 'RE_BUY' || change.type === 'ADD_ON');
}
