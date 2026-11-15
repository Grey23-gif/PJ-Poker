import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useTournamentStore } from '../../stores/tournamentStore';
import { clockStageName } from '../../utils/tournamentRegistration';
import { selectedBuyInBreak, isBuyInClosed } from '../../utils/tournamentRuntime';

export function RegistrationEndModal({ tourId, onClose }: { tourId: string; onClose: () => void }) {
  const { tournaments, setBuyInCloseBreak } = useTournamentStore();
  const tour = tournaments.find((item) => item.id === tourId);
  const [stageId, setStageId] = useState(tour ? selectedBuyInBreak(tour) || '' : '');
  const [error, setError] = useState('');
  return <Modal isOpen onClose={onClose} title="Thiết lập đóng Buy-in" description={tour?.name}>
    <form className="space-y-5" onSubmit={(event) => {
      event.preventDefault();
      const result = setBuyInCloseBreak(tourId, stageId);
      if (!result.success) { setError(result.message); return; }
      toast.success('Đã lưu thời điểm đóng Buy-in.');
      onClose();
    }}>
      <Select label="Tự động đóng Buy-in sau Break" value={stageId} onChange={(event) => setStageId(event.target.value)} error={error}
        helperText="Buy-in tự động đóng khi Break được chọn kết thúc, kể cả khi đang xem giải khác.">
        <option value="">Không tự động đóng</option>
        {tour?.structure.stages.filter((stage) => stage.stageType === 'BREAK').map((stage) => <option key={stage.id} value={stage.id}>{clockStageName(stage, tour.structure.stages)}</option>)}
      </Select>
      <p className="text-sm text-muted">Sau khi đóng, không nhận Buy-in, mua lại hoặc tái tham gia. Thống kê và bổ sung chip vẫn có thể cập nhật theo quyền hiện có.</p>
      {tour && isBuyInClosed(tour) && <p className="text-sm text-warning">Buy-in đã đóng. Đổi cấu hình không mở lại Buy-in.</p>}
      <div className="flex justify-end gap-3 border-t border-line pt-4"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit">Lưu</Button></div>
    </form>
  </Modal>;
}
