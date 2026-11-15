import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Shift } from '../../types/shift';
import { useShiftStore } from '../../stores/shiftStore';
import { formatVND } from '../../utils/formatters';
import { AlertCircle, CheckCircle, Calculator } from 'lucide-react';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift;
  onSuccess?: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  shift,
  onSuccess,
}) => {
  const { closeShift, getShiftOrdersSummary } = useShiftStore();

  const summary = getShiftOrdersSummary(shift.id);
  const expectedDrawerTotal = shift.openingCash + summary.cashRevenue;

  const [actualCashCounted, setActualCashCounted] = useState<string>(String(expectedDrawerTotal));
  const [handoverNotes, setHandoverNotes] = useState('');
  const [error, setError] = useState('');

  const numActualCash = Number(actualCashCounted) || 0;
  const difference = numActualCash - expectedDrawerTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numActualCash) || numActualCash < 0) {
      setError('Số tiền thực tế kiểm đếm không hợp lệ');
      return;
    }

    closeShift(shift.id, {
      actualCashCounted: numActualCash,
      handoverNotes: handoverNotes.trim() || 'Bàn giao ca hoàn tất.',
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Kết Thúc Ca & Kiểm Đếm Bàn Giao Tiền">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Shift Financial Overview */}
        <div className="bg-surface border border-line rounded-xl p-4 text-xs space-y-2 text-secondary">
          <div className="flex justify-between">
            <span className="text-muted">Ca làm việc:</span>
            <span className="font-bold text-content">{shift.shiftName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Thu ngân kết ca:</span>
            <span className="text-content">{shift.cashierName}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-line">
            <span className="text-muted">1. Tiền mặt đầu ca (Két):</span>
            <span className="font-mono font-medium">{formatVND(shift.openingCash)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">2. Doanh thu tiền mặt theo bill ({summary.orderCount} đơn):</span>
            <span className="font-mono font-bold text-success">+{formatVND(summary.cashRevenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">3. Doanh thu VietQR (Chuyển khoản):</span>
            <span className="font-mono text-warning">+{formatVND(summary.bankRevenue)}</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-line-strong text-sm font-bold text-content">
            <span>Tiền mặt lý thuyết phải có trong két (1+2):</span>
            <span className="text-success">{formatVND(expectedDrawerTotal)}</span>
          </div>
        </div>

        {/* Input Actual Cash */}
        <Input
          label="Tiền mặt thực tế kiểm đếm trong két (VND) *"
          type="number"
          value={actualCashCounted}
          onChange={(e) => setActualCashCounted(e.target.value)}
          placeholder="Nhập số tiền mặt đếm được..."
          leftIcon={<Calculator className="w-4 h-4" />}
        />

        {/* Discrepancy indicator */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            difference === 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-success'
              : difference > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-warning'
              : 'bg-rose-500/10 border-rose-500/30 text-danger'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {difference === 0 ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>
              {difference === 0
                ? 'Tiền kiểm đếm khớp 100% với hệ thống'
                : difference > 0
                ? `Thừa tiền so với hệ thống: +${formatVND(difference)}`
                : `Thiếu hụt tiền so với hệ thống: ${formatVND(difference)}`}
            </span>
          </div>
          <span className="font-mono text-sm">{formatVND(difference)}</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Ghi chú bàn giao ca
          </label>
          <textarea
            value={handoverNotes}
            onChange={(e) => setHandoverNotes(e.target.value)}
            className="w-full bg-field border border-line-strong/80 rounded-lg p-2.5 text-xs text-content placeholder-muted focus:outline-none focus:border-emerald-500"
            rows={2}
            placeholder="Ghi chú tình trạng két tiền, hóa đơn hoặc bàn giao ca sau..."
          />
        </div>

        {error && <p className="text-xs text-danger font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button variant="danger" type="submit">
            Xác Nhận Đóng Ca & Bàn Giao
          </Button>
        </div>
      </form>
    </Modal>
  );
};

