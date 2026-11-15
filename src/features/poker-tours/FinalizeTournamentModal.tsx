import { useState } from 'react';
import type { Tournament } from '../../types/tournament';
import { getTournamentStatistics } from '../../utils/tournamentStatistics';
import { getTournamentPrizePayouts } from '../../utils/tournamentPrizes';
import { finalizationSignature } from '../../utils/tournamentFinalization';
import { useTournamentSessionStore } from '../../stores/tournamentSessionStore';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

export function FinalizeTournamentModal({ tour, onClose }: { tour: Tournament; onClose: () => void }) {
  const [preview] = useState(() => ({ statistics: getTournamentStatistics(tour), prizes: getTournamentPrizePayouts(getTournamentStatistics(tour).entries, tour.prizeConfiguration), signature: finalizationSignature(tour) }));
  const [error, setError] = useState('');
  const number = (value: number) => value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <Modal isOpen onClose={onClose} title="Chốt và kết thúc giải?" description={tour.name} maxWidth="lg">
    <div className="space-y-4">
      <p className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Phiên sẽ chuyển sang FINISHED. Thống kê, giải thưởng và lịch sử bị khóa vĩnh viễn; không thể reset hoặc mở lại bằng điều khiển thông thường.</p>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">{[['Total Entries', preview.statistics.entries], ['Unique Players', preview.statistics.uniquePlayers], ['Players Remaining', preview.statistics.playersRemaining]].map(([label, value]) => <div key={label} className="rounded-xl border border-line bg-field p-3"><dt className="text-muted">{label}</dt><dd className="mt-1 font-semibold text-content">{value}</dd></div>)}</dl>
      <p className="font-semibold text-content">Total Prize Pool: {number(preview.prizes.totalPrizePoints)} PTS</p>
      <dl className="grid grid-cols-2 gap-3">{preview.prizes.payouts.map((payout) => <div key={payout.place} className="rounded-xl border border-line bg-field p-3"><dt className="text-sm text-muted">TOP {payout.place}</dt><dd className="mt-1 font-semibold text-success">{number(payout.points)} PTS</dd></div>)}</dl>
      <p className="text-sm text-muted">Sau khi chốt, dùng “Cộng điểm Top Tour” để chọn hội viên và gửi Admin duyệt. Chốt giải chưa cộng điểm vào tài khoản.</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-line pt-4"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button variant="danger" onClick={() => {
        const result = useTournamentSessionStore.getState().endTournament(tour.id, preview.signature);
        if (!result.success) setError(result.message); else { toast.success('Đã chốt kết quả phiên.'); onClose(); }
      }}>Xác nhận chốt giải</Button></div>
    </div>
  </Modal>;
}
