import { useState } from 'react';
import type { TournamentPrizeConfiguration } from '../../types/tournamentPrizes';
import { getTournamentPrizePayouts, MAX_PRIZE_POSITIONS, validatePrizeConfiguration } from '../../utils/tournamentPrizes';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const number = (value: number) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const inputValue = (value: number) => Number.isFinite(value) ? value : '';
const numericValue = (value: string) => value.trim() ? Number(value) : NaN;

export function PrizeDistributionEditor({ value, onChange, disabled = false }: {
  value: TournamentPrizeConfiguration; onChange: (value: TournamentPrizeConfiguration) => void; disabled?: boolean;
}) {
  const [previewEntries, setPreviewEntries] = useState('50');
  const errors = validatePrizeConfiguration(value);
  const entries = numericValue(previewEntries);
  const validEntries = Number.isSafeInteger(entries) && entries >= 0;
  let preview: ReturnType<typeof getTournamentPrizePayouts> | undefined;
  let previewError = '';
  if (!Object.keys(errors).length && validEntries) {
    try { preview = getTournamentPrizePayouts(entries, value); }
    catch (error) { previewError = error instanceof Error ? error.message : 'Không tính được preview.'; }
  }
  const totalPercentage = value.positions.reduce((total, position) => total + (Number.isFinite(position.percentage) ? Math.round(position.percentage * 100) : 0), 0) / 100;
  return <section className="space-y-4 border-t border-line pt-5" aria-labelledby="prize-distribution-title">
    <h3 id="prize-distribution-title" className="font-semibold text-content">Prize Distribution</h3>
    <p className="text-sm text-muted">GTD được giữ cố định đến hết Entries Threshold. Từ Entry tiếp theo, mỗi Entry tăng thêm Additional PTS. Thay đổi chỉ áp dụng cho phiên mới.</p>
    <fieldset disabled={disabled} className="min-w-0 space-y-4">
      <legend className="sr-only">Cấu hình GTD và các vị trí TOP</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--component-gap)]">
        <Input label="Guaranteed Prize (GTD), PTS" type="number" min={0} step="0.01" required value={inputValue(value.guaranteedPoints)} error={errors.guaranteedPoints} onChange={(event) => onChange({ ...value, guaranteedPoints: numericValue(event.target.value) })} />
        <Input label="Entries Threshold" type="number" min={0} step={1} required value={inputValue(value.entriesThreshold)} error={errors.entriesThreshold} onChange={(event) => onChange({ ...value, entriesThreshold: numericValue(event.target.value) })} />
        <Input label="Additional PTS per Entry" type="number" min={0} step="0.01" required value={inputValue(value.additionalPointsPerEntry)} error={errors.additionalPointsPerEntry} onChange={(event) => onChange({ ...value, additionalPointsPerEntry: numericValue(event.target.value) })} />
      </div>
      <div className="rounded-xl border border-line bg-field p-4 space-y-3">
        {value.positions.map((position, index) => <div key={index} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]"><Input label={`TOP ${index + 1} — Prize percentage (%)`} type="number" min={0} max={100} step="0.01" required value={inputValue(position.percentage)} error={errors[`position-${index}`]} onChange={(event) => onChange({ ...value, positions: value.positions.map((item, row) => row === index ? { percentage: numericValue(event.target.value) } : item) })} /></div>
          <Button variant="outline" type="button" disabled={value.positions.length === 1} aria-label={`Xóa TOP ${index + 1}`} onClick={() => onChange({ ...value, positions: value.positions.filter((_, row) => row !== index) })}>Xóa</Button>
        </div>)}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" type="button" disabled={value.positions.length >= MAX_PRIZE_POSITIONS} onClick={() => onChange({ ...value, positions: [...value.positions, { percentage: 0 }] })}>Thêm vị trí TOP</Button>
          <p className={`text-sm font-semibold ${errors.positions ? 'text-danger' : 'text-success'}`}>Tổng tỷ lệ: {number(totalPercentage)}% / 100%</p>
        </div>
        {errors.positions && <p role="alert" className="text-sm text-danger">{errors.positions}</p>}
      </div>
    </fieldset>
    {disabled && <p className="text-sm text-muted">Chỉ Admin được thay đổi Prize Distribution.</p>}
    <div className="rounded-xl border border-line bg-field p-4 space-y-4">
      <h4 className="font-medium text-content">Prize Preview</h4>
      <div className="max-w-xs"><Input label="Total Entries (preview)" type="number" min={0} step={1} value={previewEntries} error={!validEntries ? 'Nhập số nguyên không âm.' : undefined} onChange={(event) => setPreviewEntries(event.target.value)} helperText="Chỉ dùng xem thử, không tạo hoặc thay đổi phiên giải." /></div>
      {preview ? <>
        <p className="text-sm text-muted">Total Prize Pool: <strong className="text-xl text-warning tabular-nums">{number(preview.totalPrizePoints)} PTS</strong></p>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">{preview.payouts.map((payout) => <div key={payout.place} className="rounded-lg border border-line bg-surface p-3"><dt className="text-sm text-muted">TOP {payout.place}</dt><dd className="mt-1 font-semibold text-content tabular-nums">{number(payout.points)} PTS</dd></div>)}</dl>
      </> : <p className="text-sm text-danger">{previewError || 'Hoàn tất cấu hình hợp lệ để xem preview.'}</p>}
      <p className="text-xs text-muted">PTS hiển thị 2 chữ số thập phân. Làm tròn xuống mỗi giải tới 0,01 PTS, rồi chia phần dư cho các TOP có phần lẻ lớn nhất; bằng nhau thì TOP cao hơn được ưu tiên. Tổng giải luôn bằng Prize Pool.</p>
    </div>
  </section>;
}
