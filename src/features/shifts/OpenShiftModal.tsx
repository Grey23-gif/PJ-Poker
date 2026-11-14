import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useShiftStore } from '../../stores/shiftStore';
import { useAuthStore } from '../../stores/authStore';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { templates, openShift } = useShiftStore();
  const { users, currentUser } = useAuthStore();

  const cashiers = users.filter((u) => u.role === 'CASHIER' || u.role === 'ADMIN');

  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [selectedCashierId, setSelectedCashierId] = useState(currentUser?.id || cashiers[0]?.id || '');
  const [openingCash, setOpeningCash] = useState('1500000');
  const [notes, setNotes] = useState('Bắt đầu ca trực theo lịch phân công');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const template = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    const cashier = cashiers.find((c) => c.id === selectedCashierId) || currentUser;

    if (!cashier) {
      setError('Vui lòng chọn nhân viên thu ngân mở ca');
      return;
    }

    const numOpeningCash = Number(openingCash);
    if (isNaN(numOpeningCash) || numOpeningCash < 0) {
      setError('Số tiền mặt đầu ca không hợp lệ');
      return;
    }

    openShift({
      templateId: template.id,
      shiftName: template.name,
      cashierId: cashier.id,
      cashierName: cashier.fullName,
      openingCash: numOpeningCash,
      notes,
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Mở Ca Làm Việc Mới (Bắt Đầu Ca)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Chọn khung giờ ca làm việc *"
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
        >
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name} {tpl.isOvernight ? '(Qua đêm)' : ''}
            </option>
          ))}
        </Select>

        <Select
          label="Nhân viên thu ngân nhận ca *"
          value={selectedCashierId}
          onChange={(e) => setSelectedCashierId(e.target.value)}
        >
          {cashiers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} ({c.username})
            </option>
          ))}
        </Select>

        <Input
          label="Tiền mặt đầu ca trong két (VND) *"
          type="number"
          value={openingCash}
          onChange={(e) => setOpeningCash(e.target.value)}
          placeholder="1500000"
          helperText="Số tiền mặt ban đầu để thối tiền cho khách"
        />

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Ghi chú mở ca</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            rows={2}
          />
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button variant="emerald" type="submit">
            Xác Nhận Mở Ca
          </Button>
        </div>
      </form>
    </Modal>
  );
};

