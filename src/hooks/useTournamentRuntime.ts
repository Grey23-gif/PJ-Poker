import { useEffect } from 'react';
import { useTournamentStore } from '../stores/tournamentStore';

let subscribers = 0;
let interval: ReturnType<typeof setInterval> | undefined;

// Shared by the app and standalone display mounts; StrictMode cleanup and
// route switches cannot create a second interval in this application instance.
export function acquireTournamentRuntime() {
    subscribers++;
    const tick = () => useTournamentStore.getState().syncAllClocks();
    if (!interval) { tick(); interval = setInterval(tick, 500); }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      subscribers--;
      if (!subscribers && interval) { clearInterval(interval); interval = undefined; }
    };
}

export function useTournamentRuntime() {
  useEffect(acquireTournamentRuntime, []);
}
