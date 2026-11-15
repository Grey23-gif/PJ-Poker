import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Tournament } from '../../types/tournament';
import { usePointsStore } from '../../stores/pointsStore';
import { Input } from '../../components/ui/Input';
import { getTournamentStatistics } from '../../utils/tournamentStatistics';
import { normalizePlayerSearch } from '../../utils/playerSearch';
import { TopTourAssignments } from '../player-points/TopTourAssignments';
import { formatRewardPoints } from '../../utils/formatters';

const date = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '—';
const day = (value: string) => {
  const parsed = new Date(value);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
};

export function TournamentHistory({ sessions }: { sessions: Tournament[] }) {
  const { requests } = usePointsStore();
  const [search, setSearch] = useState('');
  const [sessionDay, setSessionDay] = useState('');
  const filtered = sessions.filter((tour) => normalizePlayerSearch(`${tour.name} ${tour.id}`).includes(normalizePlayerSearch(search)) &&
    (!sessionDay || day(tour.startedAt || tour.createdAt) === sessionDay));
  return <section id="tournament-history" className="space-y-4" aria-labelledby="tournament-history-title">
    <h2 id="tournament-history-title" className="text-xl font-semibold text-content">Lịch sử giải đấu</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="Tìm tên giải hoặc mã phiên" value={search} onChange={(event) => setSearch(event.target.value)} /><Input label="Ngày bắt đầu phiên" type="date" value={sessionDay} onChange={(event) => setSessionDay(event.target.value)} /></div>
    {!filtered.length && <p role="status" className="rounded-xl border border-line bg-field p-4 text-sm text-muted">Chưa có phiên lịch sử phù hợp.</p>}
    {filtered.map((tour) => {
      const statistics = getTournamentStatistics(tour);
      const batch = requests.find((request) => request.id === tour.rewardBatchId && request.status === 'APPROVED');
      return <details key={tour.id} data-archived-session={tour.id} className="rounded-2xl border border-line bg-surface">
        <summary className="cursor-pointer rounded-2xl p-[var(--card-padding)] font-semibold text-content break-words">{tour.name} <span className="font-normal text-sm text-muted">· {date(tour.startedAt || tour.createdAt)} · {tour.archivedAt ? 'Đã lưu trữ' : 'Phiên đã lưu khi reset'}</span></summary>
        <div className="border-t border-line p-[var(--card-padding)] space-y-4">
          <p className="text-xs text-muted break-all">Mã phiên · {tour.id}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
            {[
              ['Bắt đầu', date(tour.startedAt || tour.createdAt)], ['Kết thúc', date(tour.endedAt)],
              ['Total Entries', statistics.entries], ['Unique Players', statistics.uniquePlayers], ['Players Remaining', statistics.playersRemaining],
              ['Total Stack', statistics.totalStack.toLocaleString('vi-VN')],
              ['Final Prize Pool', tour.finalResults ? `${formatRewardPoints(tour.finalResults.totalPrizePoints)} PTS` : '—'],
              ['Số TOP đã thưởng', batch?.topAssignments?.length || 0],
              ['Người đề xuất', batch?.requestedBy.name || '—'], ['Người duyệt', batch?.reviewedBy?.name || '—'],
              ['Duyệt lúc', date(batch?.reviewedAt)], ['Lưu trữ lúc', date(tour.archivedAt)],
            ].map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="mt-1 font-semibold text-content break-words">{value}</dd></div>)}
          </dl>
          {batch?.topAssignments && <TopTourAssignments assignments={batch.topAssignments} />}
          <Link className="inline-flex min-h-[var(--button-height)] items-center text-success underline underline-offset-4" to={`/tours/clock/${tour.id}`}>Xem thống kê và lịch sử phiên</Link>
        </div>
      </details>;
    })}
  </section>;
}
