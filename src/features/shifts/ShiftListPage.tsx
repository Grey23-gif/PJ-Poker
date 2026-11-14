import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShiftStore } from '../../stores/shiftStore';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { OpenShiftModal } from './OpenShiftModal';
import { Modal } from '../../components/ui/Modal';
import { Shift } from '../../types/shift';
import { formatVND, formatDateTime, formatDate } from '../../utils/formatters';
import {
  CalendarCheck,
  Plus,
  Search,
  Eye,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const ShiftListPage: React.FC = () => {
  const { shifts, activeShift } = useShiftStore();
  const { currentUser, hasPermission } = useAuthStore();

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState<Shift | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const canOperate = currentUser?.role === 'ADMIN' || hasPermission('SHIFT_OPERATE');

  const filteredShifts = shifts.filter((s) => {
    return (
      s.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex flex-wrap items-center gap-2">
            Quản Lý Ca Làm Việc & Bàn Giao Két
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Theo dõi ca trực thu ngân, đối soát doanh thu tiền mặt và biên bản bàn giao két
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeShift && (
            <Link to="/shifts/active">
              <Button variant="emerald" size="sm" leftIcon={<CalendarCheck className="w-4 h-4" />}>
                Xem Ca Đang Hoạt Động
              </Button>
            </Link>
          )}
          {canOperate && !activeShift && (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsOpenModalOpen(true)}
            >
              Mở Ca Mới
            </Button>
          )}
        </div>
      </div>

      {/* Shifts Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Lịch Sử Các Ca Làm Việc ({shifts.length})</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Danh sách các ca trực kèm số liệu kiểm đếm tiền mặt
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Tìm theo mã ca, tên thu ngân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã ca & Tên ca</th>
                  <th className="py-3 px-4">Thu ngân trực</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Tiền đầu ca</th>
                  <th className="py-3 px-4 text-right">Tổng doanh thu</th>
                  <th className="py-3 px-4 text-center">Chênh lệch két</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredShifts.map((shift) => {
                  const recon = shift.closingReconciliation;

                  return (
                    <tr key={shift.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-200">{shift.shiftName}</div>
                        <div className="font-mono text-xs text-amber-400">{shift.code}</div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-300">
                        {shift.cashierName}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        <div>Mở: {formatDateTime(shift.openedAt)}</div>
                        {shift.closedAt && (
                          <div className="text-xs text-slate-500">
                            Đóng: {formatDateTime(shift.closedAt)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatVND(shift.openingCash)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {recon ? formatVND(recon.totalSales) : '--'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        {recon ? (
                          recon.difference === 0 ? (
                            <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Khớp 100%
                            </span>
                          ) : (
                            <span
                              className={`font-bold flex items-center justify-center gap-1 ${
                                recon.difference > 0 ? 'text-amber-400' : 'text-rose-400'
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {recon.difference > 0 ? `+${formatVND(recon.difference)}` : formatVND(recon.difference)}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500">Đang hoạt động</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={shift.status} />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedShiftForDetail(shift)}
                        >
                          Biên Bản
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Shift Detail / Reconciliation Report Modal */}
      <Modal
        isOpen={!!selectedShiftForDetail}
        onClose={() => setSelectedShiftForDetail(null)}
        maxWidth="md"
        title="Biên Bản Kiểm Đếm & Bàn Giao Ca"
      >
        {selectedShiftForDetail && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex justify-between font-bold text-sm text-white">
                <span>{selectedShiftForDetail.shiftName}</span>
                <span className="font-mono text-amber-400">{selectedShiftForDetail.code}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Thu ngân phụ trách:</span>
                <span className="text-slate-200">{selectedShiftForDetail.cashierName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Thời gian trực:</span>
                <span>
                  {formatDateTime(selectedShiftForDetail.openedAt)} ➔{' '}
                  {selectedShiftForDetail.closedAt
                    ? formatDateTime(selectedShiftForDetail.closedAt)
                    : 'Hiện tại'}
                </span>
              </div>
            </div>

            {selectedShiftForDetail.closingReconciliation ? (
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                  Bảng Đối Soát Tài Chính Ca
                </h4>
                <div className="space-y-1.5 bg-surface p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span>1. Tiền mặt ban đầu trong két:</span>
                    <span className="font-mono font-semibold">
                      {formatVND(selectedShiftForDetail.closingReconciliation.openingBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>2. Doanh thu tiền mặt bán hàng:</span>
                    <span className="font-mono font-bold">
                      +{formatVND(selectedShiftForDetail.closingReconciliation.expectedCashSales)}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>3. Doanh thu VietQR (Chuyển khoản):</span>
                    <span className="font-mono font-bold">
                      +{formatVND(selectedShiftForDetail.closingReconciliation.expectedBankSales)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-100 pt-1 border-t border-slate-700">
                    <span>Tổng doanh thu ca:</span>
                    <span className="text-emerald-400">
                      {formatVND(selectedShiftForDetail.closingReconciliation.totalSales)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-100">
                    <span>Tiền mặt lý thuyết phải có (1 + 2):</span>
                    <span className="text-white">
                      {formatVND(
                        selectedShiftForDetail.closingReconciliation.openingBalance +
                          selectedShiftForDetail.closingReconciliation.expectedCashSales
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-700">
                    <span>Tiền mặt thực tế kiểm đếm:</span>
                    <span className="text-amber-400 font-mono text-sm">
                      {formatVND(selectedShiftForDetail.closingReconciliation.actualCashCounted)}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between font-semibold text-sm pt-1 border-t border-slate-700 ${
                      selectedShiftForDetail.closingReconciliation.difference === 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    <span>Chênh lệch (Thực tế - Lý thuyết):</span>
                    <span>
                      {selectedShiftForDetail.closingReconciliation.difference === 0
                        ? '0 ₫ (Khớp 100%)'
                        : formatVND(selectedShiftForDetail.closingReconciliation.difference)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">
                    Ghi chú bàn giao:
                  </span>
                  <p className="text-slate-300 italic">
                    "{selectedShiftForDetail.closingReconciliation.handoverNotes || 'Không có ghi chú thêm.'}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-amber-400">
                Ca này hiện đang mở và chưa đóng kiểm đếm bàn giao.
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setSelectedShiftForDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Open Shift Modal */}
      <OpenShiftModal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
      />
    </div>
  );
};

