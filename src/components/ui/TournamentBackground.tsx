import type { TournamentBackground as BackgroundConfig } from '../../types/tournament';

export function TournamentBackground({ config, url }: { config?: BackgroundConfig; url?: string }) {
  if (!url) return null;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${JSON.stringify(url)})`, backgroundSize: 'cover' }} />
    <div className="absolute inset-0 bg-black" style={{ opacity: (config?.overlay ?? 65) / 100 }} />
  </div>;
}
