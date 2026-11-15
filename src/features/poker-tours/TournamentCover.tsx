import type { TournamentBackground as BackgroundConfig } from '../../types/tournament';
import { TournamentBackground } from '../../components/ui/TournamentBackground';
import { useBackgroundImage } from '../../hooks/useBackgroundImage';

export function TournamentCover({ config, title }: { config?: BackgroundConfig; title: string }) {
  const image = useBackgroundImage(config);
  if (!image.url) return null;
  return <div className="relative isolate aspect-[16/7] max-h-48 overflow-hidden rounded-xl border border-line mb-4" data-background-kind="tour">
    <TournamentBackground config={config} url={image.url} />
    <div className="relative z-10 flex h-full items-end p-4 bg-black/20">
      <p className="text-white text-sm font-semibold rounded-lg bg-black/60 px-3 py-2">{title}</p>
    </div>
  </div>;
}
