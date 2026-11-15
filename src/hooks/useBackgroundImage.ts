import { useEffect, useState } from 'react';
import type { TournamentBackground as BackgroundConfig } from '../types/tournament';
import { loadBackgroundImage, readBackgroundFile, validateImageUrl } from '../utils/tournamentBackgrounds';

export function useBackgroundImage(config?: BackgroundConfig, file?: File) {
  const source = config?.source;
  const imageUrl = config?.source === 'url' ? config.url : undefined;
  const assetId = config?.source === 'upload' ? config.assetId : undefined;
  const key = file || imageUrl || assetId || '';
  const [result, setResult] = useState<{ key: typeof key; url?: string; error?: string; loading?: boolean }>({ key: '' });
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    if (!key) return;
    const resolveImage = async () => {
      try {
        let url: string;
        if (file) { objectUrl = URL.createObjectURL(file); url = objectUrl; }
        else if (source === 'url' && imageUrl) url = validateImageUrl(imageUrl);
        else if (source === 'upload' && assetId) {
          const blob = await readBackgroundFile(assetId);
          if (cancelled) return;
          if (!blob) throw new Error('Ảnh không còn trong trình duyệt. Vui lòng tải lại ảnh.');
          objectUrl = URL.createObjectURL(blob); url = objectUrl;
        } else return;
        await loadBackgroundImage(url);
        if (!cancelled) setResult({ key, url });
      } catch (error) {
        if (!cancelled) setResult({ key, error: error instanceof Error ? error.message : 'Không tải được ảnh.' });
      }
    };
    void resolveImage();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [key, file, source, imageUrl, assetId]); // Overlay changes do not reload the same image.
  return result.key === key ? result : { key, loading: !!key };
}

