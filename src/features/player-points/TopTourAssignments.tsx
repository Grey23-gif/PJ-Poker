import type { TopTourAssignment } from '../../types/points';
import { formatRewardPoints } from '../../utils/formatters';

export function TopTourAssignments({ assignments }: { assignments: TopTourAssignment[] }) {
  return <dl className="space-y-2">{assignments.map((assignment) => <div key={assignment.rank} className="grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-line bg-field p-3">
    <dt className="text-sm font-semibold text-warning">TOP {assignment.rank}</dt>
    <dd className="min-w-0 text-sm"><p className="font-semibold text-content break-words">{assignment.playerName}</p><p className="text-xs text-muted">{assignment.playerPhone || 'Chưa có số điện thoại'}</p><p className="text-xs text-muted break-all">{assignment.memberId}</p></dd>
    <dd className="col-start-2 sm:col-auto font-mono text-sm font-semibold text-success">{formatRewardPoints(assignment.points)} PTS</dd>
  </div>)}</dl>;
}
