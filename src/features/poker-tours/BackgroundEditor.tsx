import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TournamentBackground } from '../../components/ui/TournamentBackground';
import { useBackgroundImage } from '../../hooks/useBackgroundImage';
import { defaultBackground, loadBackgroundImage, validateImageFile, validateImageUrl, type BackgroundDraft } from '../../utils/tournamentBackgrounds';

export function BackgroundEditor({ label, description, value, onChange, onBusyChange }: {
  label: string; description: string; value: BackgroundDraft;
  onChange: (draft: BackgroundDraft) => void; onBusyChange: (busy: boolean) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const revision = useRef(0);
  const committedUrl = value.config.source === 'url' ? value.config.url : '';
  const [urlDraft, setUrlDraft] = useState({ committed: committedUrl, value: committedUrl });
  const url = urlDraft.committed === committedUrl ? urlDraft.value : committedUrl;
  const setUrl = (next: string) => setUrlDraft({ committed: committedUrl, value: next });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const preview = useBackgroundImage(value.config, value.file);
  useEffect(() => () => { revision.current++; }, []);

  const chooseImage = async (file?: File) => {
    const current = ++revision.current;
    setError(''); setBusy(true); onBusyChange(true);
    let objectUrl: string | undefined;
    try {
      if (file) {
        await validateImageFile(file);
        objectUrl = URL.createObjectURL(file);
        await loadBackgroundImage(objectUrl);
        if (current === revision.current) {
          onChange({ config: { source: 'upload', assetId: 'pending', fileName: file.name.slice(0, 255), overlay: value.config.overlay }, file });
          setUrl('');
        }
      } else {
        let imageUrl: string;
        try { imageUrl = validateImageUrl(url); } catch { throw new Error('Nhập URL HTTPS hợp lệ trỏ đến ảnh JPG, PNG hoặc WebP.'); }
        // URL images must decode as an image; extensions are not required for CDN URLs.
        await loadBackgroundImage(imageUrl);
        if (current === revision.current) onChange({ config: { source: 'url', url: imageUrl, overlay: value.config.overlay } });
      }
    } catch (failure) {
      if (current === revision.current) setError(failure instanceof Error ? failure.message : 'Không tải được ảnh.');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (current === revision.current) { setBusy(false); onBusyChange(false); }
    }
  };

  return <fieldset className="min-w-0 rounded-2xl border border-line p-4 space-y-4">
    <legend className="px-2 text-sm font-semibold text-content">{label}</legend>
    <p className="text-sm text-muted">{description}</p>
    <div className="relative isolate aspect-video overflow-hidden rounded-xl border border-line bg-field">
      <TournamentBackground config={value.config} url={preview.url} />
      <div className={`relative z-10 flex h-full flex-col items-center justify-center gap-2 p-4 text-center ${preview.url ? 'text-white [text-shadow:0_1px_3px_#000]' : 'text-secondary'}`}>
        <ImagePlus className="w-7 h-7" aria-hidden="true" />
        <p className="text-sm font-semibold">{label}</p>
        {!preview.url && <p className="text-xs">{preview.loading ? 'Đang tải ảnh xem trước…' : value.config.source === 'none' ? 'Không dùng ảnh nền' : 'Nền mặc định theo giao diện sáng/tối'}</p>}
      </div>
    </div>
    {preview.error && <p role="status" className="text-sm text-warning">{preview.error} Đang dùng nền mặc định.</p>}
    <div className="flex flex-wrap gap-2">
      <input ref={inputRef} id={`${id}-file`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} disabled={busy}
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void chooseImage(file); }} />
      <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()} leftIcon={<ImagePlus className="w-4 h-4" />}>{value.config.source === 'upload' || value.config.source === 'url' ? 'Thay ảnh từ máy' : 'Tải ảnh từ máy'}</Button>
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => { onChange({ config: { source: 'none', overlay: value.config.overlay } }); setUrl(''); setError(''); }} leftIcon={<Trash2 className="w-4 h-4" />}>Xóa ảnh</Button>
      <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { onChange({ config: defaultBackground() }); setUrl(''); setError(''); }} leftIcon={<RotateCcw className="w-4 h-4" />}>Khôi phục mặc định</Button>
    </div>
    {value.config.source === 'upload' && <p className="text-xs text-muted break-all">Tệp: {value.config.fileName}</p>}
    <div className="space-y-2">
      <Input id={`${id}-url`} label="URL ảnh HTTPS" type="url" placeholder="https://example.com/background.webp" value={url} onChange={(event) => setUrl(event.target.value)} disabled={busy} error={error}
        helperText="JPG, PNG, WebP · tối đa 8 MB khi tải từ máy · nên dùng ảnh ngang 16:9. URL chỉ được lưu sau khi bấm Áp dụng URL." />
      <Button type="button" variant="outline" size="sm" disabled={!url.trim() || busy} isLoading={busy} onClick={() => void chooseImage()}>Áp dụng URL</Button>
    </div>
    <div className="space-y-2">
      <label htmlFor={`${id}-overlay`} className="flex justify-between gap-3 text-sm text-secondary"><span>Lớp phủ tối</span><output>{value.config.overlay}%</output></label>
      <input id={`${id}-overlay`} type="range" min={0} max={95} step={5} className="w-full" value={value.config.overlay} disabled={busy}
        onChange={(event) => onChange({ ...value, config: { ...value.config, overlay: Number(event.target.value) } })} />
      <p className="text-xs text-muted">Khuyên dùng từ 65% để chữ dễ đọc. Ảnh hiển thị phủ kín và giữ tỷ lệ, có thể cắt mép.</p>
    </div>
    <p role="status" className="text-xs text-muted">{busy ? 'Đang kiểm tra ảnh…' : 'Ảnh chỉ được lưu vào giải khi bấm Lưu Thay Đổi hoặc Khởi Tạo Giải Đấu.'}</p>
  </fieldset>;
}
