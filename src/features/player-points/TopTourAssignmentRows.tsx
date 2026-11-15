import type { User } from '../../types/auth';
import type { PointRequest } from '../../types/points';
import { topMemberAssigned } from '../../stores/pointsStore';
import { PlayerCombobox } from '../../components/ui/PlayerCombobox';
import { formatRewardPoints } from '../../utils/formatters';

export function TopTourAssignmentRows({ sessionId, payouts, players, requests, assignments, attempted, onChange }: {
  sessionId: string; payouts: { place: number; points: number }[]; players: User[]; requests: PointRequest[];
  assignments: Record<number, string>; attempted: boolean; onChange: (rank: number, id: string) => void;
}) {
  return <>{payouts.map((payout) => <section key={`${sessionId}-${payout.place}`} data-top-rank={payout.place} className="rounded-xl border border-line bg-field p-3 space-y-2">
    <h3 className="text-sm font-semibold text-warning">TOP {payout.place} <span className="text-content">— {formatRewardPoints(payout.points)} PTS</span></h3>
    <PlayerCombobox players={players} value={assignments[payout.place] || ''} label={`Player TOP ${payout.place}`}
      error={attempted && !assignments[payout.place] ? 'Chọn Player từ kết quả tìm kiếm.' : undefined}
      disabledIds={players.filter((player) => Object.entries(assignments).some(([rank, id]) => Number(rank) !== payout.place && id === player.id) || topMemberAssigned(requests, sessionId, player.id)).map((player) => player.id)}
      onChange={(id) => onChange(payout.place, id)} />
  </section>)}</>;
}
