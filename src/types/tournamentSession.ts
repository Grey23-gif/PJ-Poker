import type { Tournament } from './tournament';
import type { TournamentTemplate } from './tournamentTemplate';

/** Snapshot prevents template edits from changing running or historical sessions. */
export type TournamentSession = Omit<Tournament, keyof TournamentTemplate | 'templateId'> & {
  id: string;
  templateId: string;
  createdAt: string;
  createdBy: string;
  templateSnapshot: TournamentTemplate;
};
