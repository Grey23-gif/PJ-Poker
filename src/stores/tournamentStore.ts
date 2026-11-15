// Compatibility import for unrelated dashboard/member features. Runtime state
// is owned exclusively by the session store; templates have their own store.
export { useTournamentSessionStore as useTournamentStore } from './tournamentSessionStore';
