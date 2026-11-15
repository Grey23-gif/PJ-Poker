import type { Tournament } from './tournament';

/** Permanent configuration. No player, statistics, clock or lifecycle fields. */
export type TournamentTemplate = Pick<Tournament,
  'id' | 'code' | 'name' | 'description' | 'startingChips' | 'maxPlayers' |
  'structure' | 'registrationEndStageId' | 'buyInCloseBreakId' |
  'tourBackground' | 'clockBackground' | 'totalPrizePool' | 'firstPlacePrize' |
  'placesPaid' | 'prizeConfiguration' | 'createdAt' | 'createdBy'>;

export type TemplateInput = Omit<TournamentTemplate, 'id' | 'code' | 'createdAt'>;
