import type { Tournament } from '../types/tournament';
import { isSessionFinished } from './tournamentFinalization';

export function selectedBuyInBreak(tour: Tournament): string | undefined {
  if (tour.buyInCloseBreakId) return tour.buyInCloseBreakId;
  const levelIndex = tour.structure.stages.findIndex((stage) => stage.id === tour.registrationEndStageId);
  const previous = tour.structure.stages[levelIndex - 1];
  return previous?.stageType === 'BREAK' ? previous.id : undefined;
}

export function isBuyInClosed(tour: Tournament): boolean {
  if (tour.buyInClosedAt || isSessionFinished(tour) || tour.status === 'CANCELLED') return true;
  // A new/reset session is always open even if its structure starts with a
  // Break before the first playable Level.
  if (tour.entryStackOnly && !tour.startedAt && tour.totalElapsedSeconds === 0 &&
    tour.currentStageIndex === tour.structure.stages.findIndex((stage) => stage.stageType === 'LEVEL')) return false;
  if (tour.status === 'CREATED') return false;
  const breakId = selectedBuyInBreak(tour);
  const breakIndex = tour.structure.stages.findIndex((stage) => stage.id === breakId && stage.stageType === 'BREAK');
  if (breakIndex >= 0) return tour.currentStageIndex > breakIndex;
  const legacyIndex = tour.structure.stages.findIndex((stage) => stage.id === tour.registrationEndStageId && stage.stageType === 'LEVEL');
  return legacyIndex >= 0 && tour.currentStageIndex >= legacyIndex;
}

export function latchBuyInClosure(tour: Tournament, timestamp: number): Tournament {
  return !tour.buyInClosedAt && isBuyInClosed(tour)
    ? { ...tour, buyInClosedAt: new Date(timestamp).toISOString(), buyInCloseReason: 'AUTO' } : tour;
}

export function remainingSeconds(tour: Tournament, now = Date.now()): number {
  if (tour.status !== 'RUNNING' || tour.timerStartedAt === undefined) return tour.stageRemainingSeconds;
  return Math.max(0, tour.stageRemainingSeconds - Math.floor(Math.max(0, now - tour.timerStartedAt) / 1000));
}

// Timestamp arithmetic carries elapsed time across hidden tabs, reloads and
// multiple levels/breaks. It never schedules a timer or changes selection.
export function advanceRuntime(tour: Tournament, now: number): { tour: Tournament; finished: boolean } {
  if (isSessionFinished(tour)) return { tour, finished: false };
  if (tour.status !== 'RUNNING' || tour.timerStartedAt === undefined) return { tour: latchBuyInClosure(tour, now), finished: false };
  let elapsed = Math.floor(Math.max(0, now - tour.timerStartedAt) / 1000);
  let index = tour.currentStageIndex;
  let duration = tour.stageRemainingSeconds;
  let anchor = tour.timerStartedAt;
  let next = latchBuyInClosure(tour, now);
  while (elapsed >= duration) {
    elapsed -= duration;
    anchor += duration * 1000;
    index++;
    if (index >= tour.structure.stages.length) {
      return { tour: latchBuyInClosure({ ...next, currentStageIndex: Math.max(0, tour.structure.stages.length - 1), stageRemainingSeconds: 0, timerStartedAt: undefined,
        totalElapsedSeconds: tour.totalElapsedSeconds + Math.floor(Math.max(0, anchor - (tour.lastUpdatedAt ?? tour.timerStartedAt)) / 1000), lastUpdatedAt: anchor }, anchor), finished: true };
    }
    duration = Math.max(1, tour.structure.stages[index].durationMinutes * 60);
    next = latchBuyInClosure({ ...next, currentStageIndex: index, stageRemainingSeconds: duration, timerStartedAt: anchor }, anchor);
  }
  const additional = Math.floor(Math.max(0, now - (tour.lastUpdatedAt ?? tour.timerStartedAt)) / 1000);
  if (additional > 0) next = { ...next, totalElapsedSeconds: tour.totalElapsedSeconds + additional,
    lastUpdatedAt: (tour.lastUpdatedAt ?? tour.timerStartedAt) + additional * 1000 };
  return { tour: next, finished: false };
}
