import { useState } from 'react';
import { Award, Clock, ExternalLink, RotateCcw } from 'lucide-react';
import type { Tournament } from '../../types/tournament';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { useTournamentStore } from '../../stores/tournamentStore';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { TournamentCover } from './TournamentCover';
import { TournamentStatisticsModal } from './TournamentStatisticsModal';
import { FinalizeTournamentModal } from './FinalizeTournamentModal';
import { clockStageName, registrationEndDisplay } from '../../utils/tournamentRegistration';
import { isBuyInClosed, remainingSeconds } from '../../utils/tournamentRuntime';
import { averageStack, getTournamentStatistics } from '../../utils/tournamentStatistics';
import { formatSecondsToMMSS } from '../../utils/formatters';
import { isSessionFinished } from '../../utils/tournamentFinalization';

const statusLabels = { CREATED: 'Chưa bắt đầu', RUNNING: 'Đang diễn ra', PAUSED: 'Tạm dừng', FINISHED: 'Đã chốt · FINISHED', COMPLETED: 'Đã kết thúc', CANCELLED: 'Đã hủy' };
const number = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value);

export function TournamentOverview({ tournaments, tour, onSelect }: {
  tournaments: Tournament[]; tour: Tournament; onSelect: (id: string) => void;
}) {
  const { currentUser, hasPermission } = useAuthStore();
  const { resetTournamentSession } = useTournamentStore();
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const matchingSessions = tournaments.filter((item) => item.id === tour.id || (!item.archivedAt && item.status !== 'CANCELLED' && `${item.name} ${item.id} ${item.code}`.toLocaleLowerCase().includes(sessionSearch.toLocaleLowerCase())));
  const statistics = getTournamentStatistics(tour);
  const stage = tour.structure.stages[tour.currentStageIndex];
  const canEdit = !isSessionFinished(tour) && (currentUser?.role === 'ADMIN' || currentUser?.role === 'CASHIER');
  const metrics = [
    ['Players Remaining / Unique Players', `${number(statistics.playersRemaining)} / ${number(statistics.uniquePlayers)}`],
    ['Total Entries', number(statistics.entries)],
    ['Total Stack', number(statistics.totalStack)],
    ['Average Stack', number(averageStack(statistics))],
  ];
  return <section className="space-y-[var(--section-gap)]" aria-labelledby="tournament-page-title" lang="vi">
    <div className="rounded-2xl border border-line bg-surface p-[var(--card-padding)] sm:p-[var(--card-padding)] space-y-4">
      <div><h1 id="tournament-page-title" className="page-title text-2xl font-semibold text-content">Giải đấu</h1>
        <p className="mt-2 text-sm text-muted">Chọn phiên giải, kiểm tra thông số rồi mở đồng hồ hiển thị.</p></div>
      {currentUser?.role === 'ADMIN' && <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Input label="Tìm phiên theo tên hoặc mã" value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} /><Select label="Chọn phiên giải" value={tour.id} onChange={(event) => onSelect(event.target.value)}>
        {matchingSessions.map((item) => <option key={item.id} value={item.id}>{item.name} · {new Date(item.createdAt).toLocaleString('vi-VN')} · {item.id.slice(-8)}</option>)}
      </Select></div>}
    </div>

    <article className="rounded-2xl border border-line bg-surface p-[var(--card-padding)] sm:p-[var(--card-padding)] space-y-[var(--section-gap)]" aria-labelledby="selected-tournament-title">
      <TournamentCover config={tour.tourBackground} title={tour.name} />
      <div className="flex flex-wrap items-start justify-between gap-[var(--component-gap)]">
        <div className="min-w-0"><p className="text-xs font-mono text-muted">{tour.code}</p>
          <h2 id="selected-tournament-title" className="mt-2 text-xl font-semibold text-content break-words">{tour.name}</h2>
          {tour.description && <p className="mt-2 text-sm text-secondary">{tour.description}</p>}</div>
        <span className="rounded-lg border border-line bg-field px-3 py-2 text-sm text-secondary">{tour.archivedAt ? 'Đã lưu trữ · FINISHED' : tour.rewardStatus === 'TOP_REWARD_PENDING' ? 'FINISHED · Chờ duyệt TOP' : statusLabels[tour.status]}</span>
      </div>

      <div><h3 className="text-base font-semibold text-content mb-3">Thông số giải đấu</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">{metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-line bg-field p-4">
          <dt className="text-sm text-muted">{label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums text-content break-words">{value}</dd>
        </div>)}</dl>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[var(--component-gap)] text-sm">
        <div><dt className="text-muted">Giai đoạn hiện tại</dt><dd className="mt-1 font-semibold text-content">{stage ? clockStageName(stage, tour.structure.stages) : 'Chưa có cấu trúc'}</dd></div>
        <div><dt className="text-muted">Thời gian còn lại</dt><dd className="mt-1 font-mono font-semibold text-content">{formatSecondsToMMSS(remainingSeconds(tour))}</dd></div>
        <div><dt className="text-muted">Buy-in Status</dt><dd role="status" className={`mt-1 font-semibold ${isBuyInClosed(tour) ? 'text-warning' : 'text-success'}`}>{isBuyInClosed(tour) ? 'Buy-in Closed' : 'Buy-in Open'}</dd></div>
        <div><dt className="text-muted">Starting Stack</dt><dd className="mt-1 font-semibold text-content">{number(tour.startingChips)}</dd></div>
        <div><dt className="text-muted">Giới hạn người chơi</dt><dd className="mt-1 font-semibold text-content">{number(tour.maxPlayers)}</dd></div>
        <div><dt className="text-muted">Reg End</dt><dd className="mt-1 font-semibold text-content">{registrationEndDisplay(tour)}</dd></div>
      </dl>
      {!tour.buyInCloseBreakId && !tour.registrationEndStageId && !isBuyInClosed(tour) && <p role="status" className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Phiên này chưa có mốc tự đóng Buy-in. Chọn “Tự động đóng Buy-in sau Break” trong mẫu giải rồi tạo phiên mới để áp dụng.</p>}
      {tour.statisticsNeedsReview && <p className="text-sm text-warning">Số liệu cũ cần đối soát.</p>}

      <details className="rounded-xl border border-line bg-field">
        <summary className="cursor-pointer min-h-[var(--button-height)] px-4 py-2.5 font-medium text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500">Cấu trúc cược và Break · {tour.structure.stages.length} giai đoạn</summary>
        <div tabIndex={0} role="region" aria-label="Cấu trúc Level và Break có thể cuộn" className="overflow-x-auto"><table className="w-full text-sm text-left">
          <caption className="sr-only">Các Level cược và Break của {tour.name}</caption>
          <thead className="text-muted"><tr><th scope="col" className="px-4 py-3">Stage</th><th scope="col" className="px-4 py-3">Blinds</th><th scope="col" className="px-4 py-3">Ante</th><th scope="col" className="px-4 py-3">Duration</th></tr></thead>
          <tbody>{tour.structure.stages.map((item) => <tr key={item.id} className="border-t border-line text-content">
            <th scope="row" className="px-4 py-3 font-medium">{clockStageName(item, tour.structure.stages)}</th>
            <td className="px-4 py-3 tabular-nums">{item.stageType === 'BREAK' ? '—' : `${number(item.smallBlind || 0)} / ${number(item.bigBlind || 0)}`}</td>
            <td className="px-4 py-3 tabular-nums">{item.stageType === 'BREAK' ? '—' : number(item.ante || 0)}</td>
            <td className="px-4 py-3 whitespace-nowrap">{item.durationMinutes} phút</td>
          </tr>)}</tbody>
        </table></div>
      </details>
      <div className="flex flex-wrap items-center justify-between gap-[var(--component-gap)] border-t border-line pt-5">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setStatisticsOpen(true)}>{canEdit ? 'Chỉnh sửa thống kê' : 'Thống kê & lịch sử'}</Button>
          {currentUser?.role === 'ADMIN' && <Button disabled={isSessionFinished(tour)} variant="outline" onClick={() => setIsResetOpen(true)} leftIcon={<RotateCcw className="w-4 h-4" />}>Reset tất cả thông số</Button>}
          {(currentUser?.role === 'ADMIN' || hasPermission('TOUR_OPERATE')) && <Button variant="danger" disabled={isSessionFinished(tour) || tour.status === 'CANCELLED'} onClick={() => setIsEndOpen(true)} leftIcon={<Award className="w-4 h-4" />}>Kết thúc giải</Button>}
        </div>
        <a href={`/tours/clock/${tour.id}?view=clock`} target="_blank" rel="noopener noreferrer" aria-label={`Mở đồng hồ giải đấu ${tour.name} trong tab mới`} className="inline-flex min-h-[var(--button-height)] items-center justify-center gap-2 rounded-[10px] border border-transparent bg-poker-green px-3.5 py-2 text-sm leading-5 font-semibold text-[#06291e] transition-colors duration-150 hover:bg-poker-green-light focus-visible:ring-2 focus-visible:ring-emerald-300">
          <Clock className="w-4 h-4" aria-hidden="true" />Mở đồng hồ giải đấu<ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
      <p className="text-xs text-muted">Đồng hồ mở trong tab mới. Giải đang chạy tiếp tục giữ nguyên thời gian và trạng thái.</p>
    </article>
    {statisticsOpen && <TournamentStatisticsModal tourId={tour.id} onClose={() => setStatisticsOpen(false)} />}
    {isEndOpen && <FinalizeTournamentModal tour={tour} onClose={() => setIsEndOpen(false)} />}
    <ConfirmDialog locale="vi" isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} onConfirm={() => {
      const result = resetTournamentSession(tour.id);
      if (!result.success) toast.error(result.message); else toast.success('Đã đặt lại phiên giải đấu.');
    }} title="Reset tất cả thông số?" message={`Giải “${tour.name}” sẽ lưu phiên hiện tại vào lịch sử rồi đặt lại lượt tham gia, người chơi và chip. Đồng hồ trở về Level 1, tạm dừng; Buy-in được mở lại. Cấu hình và ảnh nền được giữ nguyên.`} confirmText="Reset phiên giải" cancelText="Hủy" variant="danger" />
  </section>;
}
