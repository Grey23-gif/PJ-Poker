import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { usePointsStore } from '../../stores/pointsStore';
import { useAuthStore } from '../../stores/authStore';
import { PointType } from '../../types/points';

interface PointAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PointAdjustmentModal: React.FC<PointAdjustmentModalProps> = ({ isOpen, onClose }) => {
  const { createRequest } = usePointsStore();
  const { users, currentUser } = useAuthStore();

  const players = users.filter((u) => u.role === 'PLAYER');

  const [playerId, setPlayerId] = useState(players[0]?.id || '');
  const [pointType, setPointType] = useState<PointType>('MANUAL_BONUS');
  const [amount, setAmount] = useState<string>('500');
  const [isDeduction, setIsDeduction] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetPlayer = players.find((p) => p.id === playerId);
    if (!targetPlayer) {
      setError('Vui lòng chọn người chơi');
      return;
    }

    const numAmount = Math.abs(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Số điểm điều chỉnh phải lớn hơn 0');
      return;
    }

    if (!reason.trim()) {
      setError('Vui lòng nêu rõ lý do điều chỉnh điểm');
      return;
    }

    const finalAmount = isDeduction ? -numAmount : numAmount;

    createRequest({
      playerId: targetPlayer.id,
      playerName: targetPlayer.fullName,
      playerPhone: targetPlayer.phone,
      amount: finalAmount,
      pointType,
      reason: reason.trim(),
      requestedBy: {
        id: currentUser?.id || 'cashier',
        name: currentUser?.fullName || 'Thu Ngân',
        role: currentUser?.role || 'CASHIER',
      },
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Tạo Yêu Cầu Điều Chỉnh Điểm Hội Viên">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Chọn hội viên (Người chơi) *"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName} ({p.phone || p.username}) - Điểm hiện có: {p.playerStats?.currentPoints || 0}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Loại hình thưởng / trừ"
            value={pointType}
            onChange={(e) => setPointType(e.target.value as PointType)}
          >
            <option value="MANUAL_BONUS">Thưởng phong trào / Hội đồng</option>
            <option value="TOUR_REWARD">Thưởng thành tích Tour</option>
            <option value="EVENT">Điểm sự kiện CLB</option>
            <option value="PENALTY">Trừ điểm vi phạm nội quy</option>
          </Select>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Hình thức cộng/trừ
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setIsDeduction(false)}
                className={`py-1 rounded text-xs font-semibold ${
                  !isDeduction ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                + Cộng Điểm
              </button>
              <button
                type="button"
                onClick={() => setIsDeduction(true)}
                className={`py-1 rounded text-xs font-semibold ${
                  isDeduction ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                - Trừ Điểm
              </button>
            </div>
          </div>
        </div>

        <Input
          label={`Số điểm ${isDeduction ? 'cần trừ' : 'cần cộng'} (Points) *`}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500, 1000..."
        />

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Lý do & Căn cứ điều chỉnh *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            rows={3}
            placeholder="Ví dụ: Thưởng đóng góp tích cực hỗ trợ giải đấu, hoặc Thưởng Quán Quân bảng phụ..."
          />
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          <strong>Lưu ý:</strong> Yêu cầu điều chỉnh điểm sau khi gửi sẽ ở trạng thái <strong>CHỜ DUYỆT (PENDING)</strong> và chỉ có hiệu lực cộng/trừ số dư sau khi Quản trị viên (Admin) phê duyệt.
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button variant="primary" type="submit">
            Gửi Yêu Cầu Duyệt Điểm
          </Button>
        </div>
      </form>
    </Modal>
  );
};

