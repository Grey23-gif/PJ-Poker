import { useId, useRef, useState } from 'react';
import { useTournamentSessionStore } from '../../stores/tournamentSessionStore';
import { useAuthStore } from '../../stores/authStore';
import { usePointsStore } from '../../stores/pointsStore';
import { sessionHasRewardRequest } from '../../utils/tournamentRewards';
import type { TopTourAssignment } from '../../types/points';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { TopTourAssignmentRows } from './TopTourAssignmentRows';
import { TopTourAssignments } from './TopTourAssignments';
import { formatRewardPoints } from '../../utils/formatters';
import { toast } from 'sonner';

interface Preview { sessionId: string; name: string; date: string; finalizedAt: string; total: number; assignments: TopTourAssignment[] }

export function TopTourRequestModal({ onClose }: { onClose: () => void }) {
  const { tournaments } = useTournamentSessionStore();
  const { users } = useAuthStore();
  const { requests, createTopTourBatch } = usePointsStore();
  const formId = useId();
  const form = useRef<HTMLFormElement>(null);
  const [sessionId, setSessionId] = useState('');
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [attempted, setAttempted] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const eligible = tournaments.filter((tour) => ['FINISHED', 'COMPLETED'].includes(tour.status) && tour.finalResults && !tour.archivedAt && !sessionHasRewardRequest(requests, tour.id));
  const tour = eligible.find((item) => item.id === sessionId);
  const players = users.filter((user) => user.role === 'PLAYER' && user.status === 'ACTIVE');

  const prepare = () => {
    setAttempted(true); setError('');
    if (!tour?.finalResults) { setError('Chọn phiên đã kết thúc và chưa có yêu cầu thưởng.'); return; }
    const selected = tour.finalResults.payouts.map((payout) => ({ payout, player: players.find((player) => player.id === assignments[payout.place]) }));
    const missing = selected.find((item) => !item.player);
    if (missing) {
      setError('Chọn Player từ kết quả tìm kiếm cho mọi vị trí TOP.');
      form.current?.querySelector<HTMLInputElement>(`[data-top-rank="${missing.payout.place}"] input`)?.focus();
      return;
    }
    if (new Set(selected.map((item) => item.player!.id)).size !== selected.length) { setError('Mỗi Player chỉ được nhận một TOP trong phiên.'); return; }
    setPreview({ sessionId: tour.id, name: tour.name, date: tour.startedAt || tour.createdAt, finalizedAt: tour.finalResults.finalizedAt, total: tour.finalResults.totalPrizePoints,
      assignments: selected.map(({ payout, player }) => ({ rank: payout.place, memberId: player!.id, playerName: player!.fullName, playerPhone: player!.phone, points: payout.points })) });
  };

  const submit = () => {
    if (!preview || submitting) return;
    setSubmitting(true); setError('');
    try {
      const request = createTopTourBatch({ sessionId: preview.sessionId, assignments: preview.assignments.map((item) => ({ rank: item.rank, memberId: item.memberId })), expectedFinalizedAt: preview.finalizedAt });
      toast.success(`Đã gửi ${request.code}, chờ Admin duyệt toàn bộ TOP.`); onClose();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không gửi được yêu cầu.'); }
    finally { setSubmitting(false); }
  };

  return <>
    <Modal isOpen onClose={onClose} title="Cộng điểm Top Tour" maxWidth="2xl" footer={<>
      <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
      <Button type="submit" form={formId} disabled={!eligible.length}>Gửi yêu cầu Admin duyệt</Button>
    </>}>
      <form id={formId} ref={form} className="space-y-4" onSubmit={(event) => { event.preventDefault(); prepare(); }}>
        <Select label="Phiên giải đấu đã kết thúc" required value={sessionId} onChange={(event) => { setSessionId(event.target.value); setAssignments({}); setAttempted(false); setPreview(null); setError(''); }}>
          <option value="">Chọn phiên giải</option>
          {eligible.map((item) => <option key={item.id} value={item.id}>{item.name} · {new Date(item.startedAt || item.createdAt).toLocaleString('vi-VN')} · {item.id.slice(-8)}</option>)}
        </Select>
        {!eligible.length && <p role="status" className="text-sm text-muted">Không có phiên giải đấu đã kết thúc nào đang chờ phân bổ thưởng.</p>}
        {tour?.finalResults && <>
          <p className="text-sm font-semibold text-content">Quỹ thưởng đã chốt · {formatRewardPoints(tour.finalResults.totalPrizePoints)} PTS</p>
          <p className="text-xs text-muted break-all">Mã phiên · {tour.id}</p>
          <TopTourAssignmentRows sessionId={tour.id} payouts={tour.finalResults.payouts} players={players} requests={requests} assignments={assignments} attempted={attempted}
            onChange={(rank, id) => { setAssignments((current) => ({ ...current, [rank]: id })); setError(''); }} />
        </>}
        {!preview && error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </form>
    </Modal>
    {preview && <Modal isOpen onClose={() => { setPreview(null); setError(''); }} title="Xác nhận yêu cầu toàn bộ TOP" description={preview.name} maxWidth="2xl" footer={<>
      <Button variant="secondary" disabled={submitting} onClick={() => { setPreview(null); setError(''); }}>Quay lại</Button><Button isLoading={submitting} onClick={submit}>Xác nhận gửi</Button>
    </>}>
      <div className="space-y-4"><p className="text-sm text-muted">Phiên ngày {new Date(preview.date).toLocaleString('vi-VN')}</p>
        <p className="font-semibold">Quỹ thưởng đã chốt · {formatRewardPoints(preview.total)} PTS</p>
        <TopTourAssignments assignments={preview.assignments} />
        <p className="text-sm text-muted">Yêu cầu sẽ chờ Admin duyệt. Điểm được cộng và phiên được lưu trữ khi toàn bộ yêu cầu được duyệt.</p>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>}
  </>;
}
