import type { Tournament } from '../types/tournament';
import type { TournamentPrizeConfiguration } from '../types/tournamentPrizes';
import { getTournamentStatistics, averageStack, validateStatistics } from './tournamentStatistics';
import { getTournamentPrizePayouts, legacyPrizeConfiguration } from './tournamentPrizes';

export function isSessionFinished(tour: Pick<Tournament, 'status' | 'finalResults' | 'archivedAt'>): boolean {
  return tour.status === 'FINISHED' || tour.status === 'COMPLETED' || !!tour.finalResults || !!tour.archivedAt;
}

export function finalizationSignature(tour: Tournament) {
  return JSON.stringify([getTournamentStatistics(tour), tour.prizeConfiguration, tour.participants, tour.statisticsHistory?.at(-1)?.id]);
}

export function freezeSessionResults(tour: Tournament, actor: { id: string; name: string; role: string }, now = Date.now()): Tournament {
  if (tour.finalResults) return tour;
  const statistics = getTournamentStatistics(tour);
  const errors = validateStatistics(statistics, tour.startingChips);
  if (Object.keys(errors).length) throw new Error('Không thể chốt phiên: ' + Object.values(errors)[0]);
  const configuration: TournamentPrizeConfiguration = structuredClone(tour.prizeConfiguration || legacyPrizeConfiguration());
  const prizes = getTournamentPrizePayouts(statistics.entries, configuration);
  const timestamp = new Date(Number.isFinite(now) ? now : Date.now()).toISOString();
  const ordered = [...tour.participants].sort((a, b) => Number(a.isEliminated) - Number(b.isEliminated) ||
    (a.isEliminated && b.isEliminated ? (a.eliminatedRank || 99) - (b.eliminatedRank || 99) : b.currentChips - a.currentChips));
  const distinct = ordered.filter((participant, index, all) => all.findIndex((item) => item.playerId === participant.playerId) === index);
  return { ...tour, status: 'FINISHED', statistics: { ...statistics },
    finalRanks: tour.finalRanks || distinct.slice(0, prizes.payouts.length).map((participant, index) => ({ rank: index + 1, playerId: participant.playerId, playerName: participant.playerName, points: prizes.payouts[index].points })),
    finalResults: { statistics: { ...statistics }, averageStack: averageStack(statistics), prizeConfiguration: configuration,
      totalPrizePoints: prizes.totalPrizePoints, payouts: prizes.payouts, finalizedAt: timestamp, finalizedBy: actor },
    endedAt: tour.endedAt || timestamp, buyInClosedAt: tour.buyInClosedAt || timestamp,
    buyInCloseReason: tour.buyInCloseReason || 'AUTO', timerStartedAt: undefined,
    stageRemainingSeconds: 0,
  };
}
