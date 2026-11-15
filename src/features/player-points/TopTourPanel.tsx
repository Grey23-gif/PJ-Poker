import { useState } from 'react';
import type { PointRequest } from '../../types/points';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { TopTourRequestModal } from './TopTourRequestModal';
import { TopTourAssignments } from './TopTourAssignments';
import { formatRewardPoints } from '../../utils/formatters';
import { normalizePlayerSearch } from '../../utils/playerSearch';

const date = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '—';
export function TopTourPanel({ requests, isAdmin, onApprove, onReject }: {
  requests: PointRequest[]; isAdmin: boolean; onApprove: (request: PointRequest) => void; onReject: (request: PointRequest) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [detailsId, setDetailsId] = useState('');
  const [search, setSearch] = useState('');
  const [session, setSession] = useState('');
  const [status, setStatus] = useState('ALL');
  const topRequests = requests.filter((request) => request.pointType === 'TOUR_REWARD');
  const details = topRequests.find((request) => request.id === detailsId);
  const sessions = [...new Map(topRequests.map((request) => [request.sessionId || request.tournamentId || 'legacy', request.tournamentName || 'Yêu cầu Tour cũ'])).entries()];
  const filtered = topRequests.filter((request) => (status === 'ALL' || request.status === status) &&
    (!session || (request.sessionId || request.tournamentId || 'legacy') === session) &&
    normalizePlayerSearch(`${request.code} ${request.id} ${request.tournamentName || ''} ${request.sessionId || request.tournamentId || ''} ${request.playerName} ${request.playerId} ${request.topAssignments?.map((item) => `${item.playerName} ${item.playerPhone} ${item.memberId}`).join(' ') || ''}`).includes(normalizePlayerSearch(search)));
  return <section className="space-y-4" aria-labelledby="top-tour-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="top-tour-title" className="text-lg font-semibold text-content">Top Tour — Yêu cầu & lịch sử</h2><Button onClick={() => setFormOpen(true)}>Cộng điểm Top Tour</Button></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Input label="Tìm Tour, Player, điện thoại hoặc mã" value={search} onChange={(event) => setSearch(event.target.value)} />
      <Select label="Lọc Tour / phiên giải" value={session} onChange={(event) => setSession(event.target.value)}><option value="">Tất cả phiên</option>{sessions.map(([id, name]) => <option key={id} value={id}>{name} · {id.slice(-8)}</option>)}</Select>
      <Select label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Tất cả</option><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Đã từ chối</option></Select>
    </div>
    <div tabIndex={0} role="region" aria-label="Bảng yêu cầu Top Tour có thể cuộn" className="max-w-full overflow-x-auto rounded-2xl border border-line bg-surface"><table className="w-full text-sm text-left">
      <caption className="sr-only">Yêu cầu và lịch sử thưởng toàn bộ TOP theo phiên giải</caption>
      <thead className="bg-field text-muted"><tr>{['Mã yêu cầu', 'Tour / Phiên giải', 'Hội viên', 'Vị trí TOP', 'Tổng điểm thưởng', 'Người đề xuất', 'Thời gian đề xuất', 'Trạng thái', 'Người duyệt / từ chối', 'Thao tác'].map((heading) => <th scope="col" key={heading} className="px-3 py-3 whitespace-nowrap">{heading}</th>)}</tr></thead>
      <tbody className="divide-y divide-line">{filtered.length ? filtered.map((request) => <tr key={request.id}>
        <td className="px-3 font-mono text-warning"><span title={request.id}>{request.code}</span>{!request.topAssignments && <p className="text-xs text-muted">Thưởng lẻ cũ</p>}</td>
        <td className="px-3 min-w-48"><p className="font-semibold text-content">{request.tournamentName || 'Tour cũ'}</p><p className="text-xs text-muted break-all">{request.sessionId || request.tournamentId || 'Chưa liên kết phiên'}</p><p className="text-xs text-muted">{date(request.sessionDate)}</p></td>
        <td className="px-3 min-w-36"><p>{request.playerName}</p>{!request.topAssignments && <p className="text-xs text-muted">{request.playerId}</p>}</td>
        <td className="px-3 whitespace-nowrap">{request.topAssignments ? `${request.topAssignments.length} TOP` : request.tournamentRank ? `TOP ${request.tournamentRank}` : '—'}</td>
        <td className="px-3 whitespace-nowrap font-semibold text-success">{formatRewardPoints(request.amount)} PTS</td>
        <td className="px-3">{request.requestedBy.name}</td><td className="px-3 whitespace-nowrap">{date(request.createdAt)}</td>
        <td className="px-3"><StatusBadge status={request.status} /></td>
        <td className="px-3 min-w-44"><p>{request.reviewedBy?.name || 'Chưa xử lý'}</p><p className="text-xs text-muted">{date(request.reviewedAt)}</p><p className="text-xs text-muted">{request.reviewNotes}</p></td>
        <td className="px-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setDetailsId(request.id)}>Chi tiết</Button>{isAdmin && request.status === 'PENDING' && <><Button size="sm" onClick={() => onApprove(request)}>Duyệt</Button><Button size="sm" variant="danger" onClick={() => onReject(request)}>Từ chối</Button></>}</div></td>
      </tr>) : <tr><td colSpan={10} className="p-6 text-center text-muted">Chưa có yêu cầu Top Tour phù hợp.</td></tr>}</tbody>
    </table></div>
    {formOpen && <TopTourRequestModal onClose={() => setFormOpen(false)} />}
    {details && <Modal isOpen onClose={() => setDetailsId('')} title={`Chi tiết ${details.code}`} description={details.tournamentName} maxWidth="2xl"><div className="space-y-4 text-sm">
      <p className="break-all">Mã yêu cầu · {details.id}</p><p className="break-all">Mã phiên · {details.sessionId || details.tournamentId || '—'}</p><p>Ngày phiên · {date(details.sessionDate)}</p><p className="break-all">Mã mẫu · {details.templateId || '—'}</p>
      <p className="font-semibold">Tổng thưởng · {formatRewardPoints(details.amount)} PTS</p>
      {details.topAssignments ? <TopTourAssignments assignments={details.topAssignments} /> : <p>TOP {details.tournamentRank || '—'} · {details.playerName} · {details.playerPhone} · {formatRewardPoints(details.amount)} PTS</p>}
      {!details.topAssignments && <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Yêu cầu thưởng lẻ cũ được giữ trong lịch sử. Có thể từ chối yêu cầu đang chờ để gán lại toàn bộ TOP. Phiên đã có thưởng lẻ được duyệt cần đối soát trước khi tạo đợt mới.</p>}
      {details.rewardSnapshot && <p>Quỹ thưởng đã chốt · {formatRewardPoints(details.rewardSnapshot.totalPrizePoints)} PTS · {date(details.rewardSnapshot.finalizedAt)}</p>}
      <div className="rounded-xl border border-line bg-field p-3 space-y-2"><p>Đề xuất · {details.requestedBy.name} · {date(details.createdAt)}</p><p><StatusBadge status={details.status} /></p>
        <p>Xử lý · {details.reviewedBy?.name || 'Chưa xử lý'} · {date(details.reviewedAt)}</p><p>{details.reviewNotes}</p>
        {details.archivedAt && <p>Lưu trữ phiên · {date(details.archivedAt)}</p>}
      </div>
    </div></Modal>}
  </section>;
}
