import { useRef, useState } from 'react';
import { clockText, type ClockLocale } from '../../utils/tournamentClockLocale';
import { History, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useTournamentStore } from '../../stores/tournamentStore';
import { useAuthStore } from '../../stores/authStore';
import { adjustStatisticCounts, averageStack, deriveStatistics, getTournamentStatistics, hasAdditionalChipIssuance, STATISTIC_LABELS, validateStatistics } from '../../utils/tournamentStatistics';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import type { ChipIssueType, TournamentStatistics, TournamentStatisticsChange } from '../../types/tournament';
import { isSessionFinished } from '../../utils/tournamentFinalization';

const operationLabels: Record<TournamentStatisticsChange['type'], string> = {
  CREATED: 'Created', CORRECTION: 'Reconcile / Correct', BUY_IN: 'Buy-in — Initial Entry',
  RE_ENTRY: 'Re-entry — New Entry', RE_BUY: 'Re-buy — Additional Chips', ADD_ON: 'Add-on — Additional Chips',
  ELIMINATION: 'Player Elimination', PLAYER_STACK: 'Player Stack Allocation', RESET: 'Session Reset',
};
const keys = Object.keys(STATISTIC_LABELS) as (keyof TournamentStatistics)[];
const editableKeys = ['entries', 'uniquePlayers', 'playersRemaining'] as const;
const metricLabels: Record<keyof TournamentStatistics, string> = {
  entries: 'Total Entries', uniquePlayers: 'Unique Players', playersRemaining: 'Players Remaining', totalStack: 'Total Stack',
};

export function TournamentStatisticsModal({ tourId, onClose, locale = 'vi' }: { tourId: string; onClose: () => void; locale?: ClockLocale }) {
  const t = (text: string) => clockText(text, locale);
  const number = (value: number) => locale === 'en' ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value) : formatNumber(value);
  const { tournaments, correctStatistics, issueChips } = useTournamentStore();
  const { currentUser, users } = useAuthStore();
  const tour = tournaments.find((item) => item.id === tourId);
  const statistics = tour ? getTournamentStatistics(tour) : { totalStack: 0, entries: 0, uniquePlayers: 0, playersRemaining: 0 };
  const [draft, setDraft] = useState(() => Object.fromEntries(keys.map((key) => [key, String(statistics[key])])) as Record<keyof TournamentStatistics, string>);
  const [revision] = useState(tour?.statisticsHistory?.at(-1)?.id);
  const [operation, setOperation] = useState<'CORRECTION' | ChipIssueType>('CORRECTION');
  const [playerId, setPlayerId] = useState('');
  const [chips, setChips] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorSummary = useRef<HTMLDivElement>(null);
  const canEdit = !!tour && !isSessionFinished(tour) && (currentUser?.role === 'ADMIN' || currentUser?.role === 'CASHIER');
  const values = tour ? deriveStatistics(tour.startingChips, Object.fromEntries(editableKeys.map((key) => [key, draft[key].trim() ? Number(draft[key]) : NaN])) as Pick<TournamentStatistics, 'entries' | 'uniquePlayers' | 'playersRemaining'>) : statistics;
  const players = new Map(users.filter((user) => user.role === 'PLAYER').map((user) => [user.id, user.fullName]));
  tour?.participants.forEach((participant) => players.set(participant.playerId, participant.playerName));
  const adjustCounts = (entryDelta: number, uniqueDelta = 0) => {
    setDraft((current) => {
      const count = (key: typeof editableKeys[number]) => {
        const value = Number(current[key]);
        return Number.isSafeInteger(value) && value >= 0 ? value : 0;
      };
      const adjusted = adjustStatisticCounts({
        entries: count('entries'), uniquePlayers: count('uniquePlayers'), playersRemaining: count('playersRemaining'),
      }, entryDelta, uniqueDelta);
      return {
        ...current,
        entries: String(adjusted.entries),
        uniquePlayers: String(adjusted.uniquePlayers),
      };
    });
    setErrors({});
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const issuedChips = tour?.entryStackOnly ? tour.startingChips : Number(chips);
    const validation: Record<string, string> = operation === 'CORRECTION' ? validateStatistics(values, tour?.startingChips) : {};
    if (reason.trim().length > 500) validation.reason = t("Ghi chú không được vượt quá 500 ký tự.");
    if (operation !== 'CORRECTION') {
      if (!reason.trim()) validation.reason = t("Nhập lý do từ 1 đến 500 ký tự.");
      if (!playerId) validation.playerId = t("Vui lòng chọn hội viên.");
      if (!Number.isSafeInteger(issuedChips) || issuedChips <= 0) validation.chips = t("Nhập số chip nguyên dương hợp lệ.");
    }
    if (!Object.keys(validation).length) {
      const result = operation === 'CORRECTION'
        ? correctStatistics(tourId, values, reason, revision)
        : issueChips(tourId, operation, playerId, issuedChips, reason, revision);
      if (result.success) { toast.success(t("Đã lưu thống kê và lịch sử thay đổi.")); onClose(); return; }
      validation.form = t(result.message);
    }
    setErrors(validation);
    requestAnimationFrame(() => errorSummary.current?.focus());
  };

  return (
    <Modal locale={locale} isOpen onClose={onClose} maxWidth="4xl" title="Tournament Statistics" description={tour?.name}>
      {!tour ? <p role="alert">{t("Không tìm thấy giải đấu.")}</p> : <div className="space-y-[var(--section-gap)]">
        {isSessionFinished(tour) && <p role="status" className="rounded-xl border border-line bg-field p-3 text-sm text-muted">Phiên FINISHED: thống kê và kết quả đã khóa, chỉ được xem.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {keys.map((key) => <div key={key} className="bg-field border border-line rounded-xl p-4"><p className="text-xs text-muted">{metricLabels[key]}</p><p className="text-xl font-semibold tabular-nums text-content mt-2 break-words">{number(statistics[key])}</p></div>)}
        </div>
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-sm text-secondary">
          <p>Average Stack: <strong className="text-success">{number(averageStack(statistics))}</strong></p>
          <p className="mt-1">Total Stack = Total Entries × Starting Stack. Average Stack = Total Stack ÷ Players Remaining.</p>
          <p className="mt-1">Players Remaining: {statistics.playersRemaining} / {statistics.uniquePlayers} Unique Players. Re-entries do not increase Unique Players.</p>
        </div>
        {tour.statisticsNeedsReview && <p role="status" className="bg-warning/10 border border-warning/30 text-warning rounded-xl p-4 text-sm">{t("Dữ liệu cũ chưa có lịch sử cấp chip. Tổng chip được ước tính từ số đăng ký và chip ban đầu; số người còn lại lấy từ danh sách đã ghi nhận. Vui lòng đối soát và lưu điều chỉnh để xác nhận.")}</p>}
        {canEdit && <form onSubmit={submit} noValidate className="space-y-4">
          {Object.keys(errors).length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger"><p className="font-semibold">{t("Chưa thể lưu thống kê")}</p>{Object.entries(errors).map(([key, message]) => <p key={key}>{key === 'form' ? t(message) : <a className="underline" href={`#stats-${key}`}>{t(message)}</a>}</p>)}</div>}
          <Select label={t("Thao tác")} value={operation} onChange={(event) => { setOperation(event.target.value as typeof operation); setErrors({}); }}>
            {(['CORRECTION', 'BUY_IN', 'RE_ENTRY', 'RE_BUY', 'ADD_ON'] as const).filter((type) => !tour.entryStackOnly || (type !== 'RE_BUY' && type !== 'ADD_ON')).map((type) => <option key={type} value={type}>{t(operationLabels[type])}</option>)}
          </Select>
          {operation === 'CORRECTION' ? <>
            <div className="rounded-xl border border-line bg-field p-4 space-y-3">
              <p className="text-sm font-semibold text-content">Quick Entry Adjustments</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => adjustCounts(1)}>+1 Entry</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => adjustCounts(5)}>+5 Entries</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => adjustCounts(10)}>+10 Entries</Button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Button type="button" variant="secondary" size="sm" onClick={() => adjustCounts(1, 1)}>New Player (+1 Entry, +1 Unique)</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => adjustCounts(1)}>Re-entry (+1 Entry)</Button>
              </div>
              <p className="text-xs text-muted">Changes are draft-only until you save. Quick actions do not change Players Remaining.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--component-gap)]">
              {editableKeys.map((key) => <Input key={key} id={`stats-${key}`} label={metricLabels[key]} type="number" min={0} step={1} required value={draft[key]} error={errors[key] ? t(errors[key]) : undefined} onChange={(event) => { setDraft({ ...draft, [key]: event.target.value }); setErrors({}); }} />)}
              <Input label="Starting Stack" value={number(tour.startingChips)} readOnly helperText="Read-only permanent tournament configuration." />
              <Input label="Total Stack" value={Number.isSafeInteger(values.entries) ? number(values.totalStack) : '—'} readOnly helperText="Total Entries × Starting Stack." />
              <Input label="Average Stack" value={Number.isSafeInteger(values.playersRemaining) && values.playersRemaining > 0 ? number(averageStack(values)) : '0'} readOnly helperText="Total Stack ÷ Players Remaining." />
            </div>
            <p className="text-sm text-muted">Total Stack and Average Stack recalculate immediately when counts change.</p>
            {hasAdditionalChipIssuance(tour) && <p role="status" className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">This tournament has Re-buy/Add-on history. Issuance history is retained; this summary uses Total Entries × Starting Stack.</p>}
          </> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--component-gap)]">
            <Select id="stats-playerId" label={t("Hội viên")} value={playerId} error={errors.playerId} onChange={(event) => setPlayerId(event.target.value)}><option value="">{t("Chọn hội viên")}</option>{[...players].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</Select>
            <Input id="stats-chips" label={tour.entryStackOnly ? 'Starting Stack' : t("Số chip cấp thêm")} type="number" min={1} step={1} required readOnly={tour.entryStackOnly} value={tour.entryStackOnly ? tour.startingChips : chips} error={errors.chips} onChange={(event) => setChips(event.target.value)} />
          </div>}
          {operation !== 'CORRECTION' && <Input id="stats-reason" label={t("Lý do / ghi chú bắt buộc")} required maxLength={500} value={reason} error={errors.reason} onChange={(event) => setReason(event.target.value)} helperText={t("Lưu cùng người thực hiện, thời gian và số liệu trước/sau.")} />}
          <div className="flex justify-end gap-3 border-t border-line pt-4"><Button type="button" variant="secondary" onClick={onClose}>{t("Đóng")}</Button><Button type="submit" leftIcon={<Save className="w-4 h-4" />}>{t("Lưu thống kê")}</Button></div>
        </form>}
        <section aria-label={t("Lịch sử thay đổi thống kê")} className="border-t border-line pt-5 space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-content"><History className="w-4 h-4 text-gold" />{t("Lịch sử thay đổi (")}{tour.statisticsHistory?.length || 0})</h3>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {!(tour.statisticsHistory?.length) && <p className="text-sm text-muted">{t("Chưa có thay đổi được ghi nhận.")}</p>}
            {[...(tour.statisticsHistory || [])].reverse().map((change) => <article key={change.id} className="rounded-xl border border-line bg-field p-4 space-y-2 text-sm break-words">
              <div className="flex flex-wrap justify-between gap-2"><strong>{operationLabels[change.type]}</strong><span className="text-muted">{locale === 'en' ? new Date(change.timestamp).toLocaleString('en-GB') : formatDateTime(change.timestamp)}</span></div>
              <p className="text-secondary">{change.actor.name} · {change.actor.role === 'CASHIER' ? t("Thu ngân") : change.actor.role === 'ADMIN' ? t("Quản trị viên") : t("Hệ thống")}{change.playerName ? ` · ${change.playerName}` : ''}</p>
              <p className="text-muted">{t(change.reason)}</p>
              <ul className="space-y-1 text-secondary">{keys.filter((key) => change.before[key] !== change.after[key]).map((key) => <li key={key}>{metricLabels[key]}: {number(change.before[key])} → <strong>{number(change.after[key])}</strong></li>)}</ul>
              {change.previousPlayerStack !== undefined && <p className="text-secondary">{t("Chip người chơi:")} {number(change.previousPlayerStack)} → {number(change.nextPlayerStack || 0)}</p>}
              {change.chipsIssued !== undefined && <p className="text-success">{t("Đã cấp thêm:")} {number(change.chipsIssued)} chip</p>}
            </article>)}
          </div>
        </section>
      </div>}
    </Modal>
  );
}
