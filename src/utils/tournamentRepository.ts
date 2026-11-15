import { INITIAL_TOURNAMENTS } from '../mocks/initialData';
import type { Tournament } from '../types/tournament';
import type { TournamentTemplate } from '../types/tournamentTemplate';
import type { TournamentSession } from '../types/tournamentSession';
import { validatePrizeConfiguration } from './tournamentPrizes';

export const TOURNAMENT_REPOSITORY_KEY = 'poker_cafe_tournament_repository_v2';
export interface TournamentRepository { version: 2; templates: TournamentTemplate[]; sessions: TournamentSession[] }
const configurationKeys = ['id', 'code', 'name', 'description', 'startingChips', 'maxPlayers', 'structure',
  'registrationEndStageId', 'buyInCloseBreakId', 'tourBackground', 'clockBackground',
  'totalPrizePool', 'firstPlacePrize', 'placesPaid', 'prizeConfiguration', 'createdAt', 'createdBy'] as const;

function hasConfiguration(value: TournamentTemplate): boolean {
  return !!value && typeof value.id === 'string' && typeof value.name === 'string' &&
    (value.prizeConfiguration === undefined || Object.keys(validatePrizeConfiguration(value.prizeConfiguration)).length === 0) &&
    !!value.structure && Array.isArray(value.structure.stages) &&
    value.structure.stages.every((stage) => !!stage && typeof stage.id === 'string' &&
      (stage.stageType === 'LEVEL' || stage.stageType === 'BREAK') && Number.isFinite(stage.durationMinutes));
}

export function extractTemplate(tour: Tournament | TournamentTemplate): TournamentTemplate {
  return structuredClone(Object.fromEntries(configurationKeys.map((key) => [key, tour[key]]))) as TournamentTemplate;
}

export function serializeSession(tour: Tournament): TournamentSession {
  const runtime = { ...tour } as Record<string, unknown>;
  for (const key of configurationKeys) delete runtime[key];
  return { ...runtime, id: tour.id, templateId: tour.templateId || tour.id,
    createdAt: tour.createdAt, createdBy: tour.createdBy,
    templateSnapshot: extractTemplate({ ...tour, id: tour.templateId || tour.id }) } as TournamentSession;
}

export function hydrateSession(session: TournamentSession): Tournament {
  const { templateSnapshot, ...runtime } = session;
  return { ...structuredClone(templateSnapshot), ...runtime };
}

export function readTournamentRepository(): TournamentRepository {
  const raw = localStorage.getItem(TOURNAMENT_REPOSITORY_KEY);
  if (raw) {
    const data = JSON.parse(raw) as TournamentRepository;
    if (data.version !== 2 || !Array.isArray(data.templates) || !Array.isArray(data.sessions) ||
      !data.templates.every(hasConfiguration) || !data.sessions.every((session) => !!session && typeof session.id === 'string' && typeof session.templateId === 'string' && hasConfiguration(session.templateSnapshot))) throw new Error('Dữ liệu giải đấu không hợp lệ; dữ liệu gốc được giữ nguyên.');
    return data;
  }
  const legacyRaw = localStorage.getItem('poker_cafe_tournaments');
  const legacy = legacyRaw ? JSON.parse(legacyRaw) as Tournament[] : undefined;
  if (legacy && (!Array.isArray(legacy) || !legacy.every(hasConfiguration))) throw new Error('Dữ liệu giải đấu cũ không hợp lệ; chưa chuyển đổi.');
  const data: TournamentRepository = {
    version: 2,
    templates: (legacy || INITIAL_TOURNAMENTS).map(extractTemplate),
    // Fresh installs use fixture CONFIGURATION only. Existing records are never discarded.
    sessions: legacy ? legacy.map((tour) => serializeSession({ ...tour, templateId: tour.id, entryStackOnly: false })) : [],
  };
  // Atomic publication: failed persistence leaves the original key untouched.
  localStorage.setItem(TOURNAMENT_REPOSITORY_KEY, JSON.stringify(data));
  return data;
}

export function saveTemplates(templates: TournamentTemplate[]) {
  const data = readTournamentRepository();
  localStorage.setItem(TOURNAMENT_REPOSITORY_KEY, JSON.stringify({ ...data, templates }));
}

export function loadTournamentRepository() {
  try { return { data: readTournamentRepository(), error: null }; }
  catch (error) { return { data: { version: 2 as const, templates: [], sessions: [] },
    error: `Không thể đọc/chuyển đổi dữ liệu giải đấu. Dữ liệu gốc vẫn được giữ. ${error instanceof Error ? error.message : ''}` }; }
}

export function saveSessions(tours: Tournament[]) {
  const data = readTournamentRepository();
  localStorage.setItem(TOURNAMENT_REPOSITORY_KEY, JSON.stringify({ ...data, sessions: tours.map(serializeSession) }));
}

export function backgroundAssetIsUsed(assetId: string): boolean {
  const data = readTournamentRepository();
  return [...data.templates, ...data.sessions.map((session) => session.templateSnapshot)].some((item) =>
    [item.tourBackground, item.clockBackground].some((background) => background?.source === 'upload' && background.assetId === assetId));
}
