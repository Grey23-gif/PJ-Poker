import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { usePosStore } from '../../stores/posStore';
import { Order } from '../../types/pos';
import { formatVND, formatDateTime } from '../../utils/formatters';
import { Search, Printer, Ban, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReceipt: (order: Order) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectReceipt,
}) => {
  const { orders, cancelOrder } = usePosStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl" title="Lịch Sử Đơn Hàng Cafe & Hóa Đơn POS">
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-surface p-3 rounded-xl border border-line">
          <div className="w-full sm:w-72">
            <Input
              aria-label="Tìm theo số hóa đơn, tên khách, số bàn..."
              placeholder="Tìm theo số hóa đơn, tên khách, số bàn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-muted">Trạng thái:</span>
            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-raised border border-line-strong text-content text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">Tất cả ({orders.length})</option>
              <option value="COMPLETED">Hoàn thành ({orders.filter(o => o.status === 'COMPLETED').length})</option>
              <option value="CANCELLED">Đã hủy ({orders.filter(o => o.status === 'CANCELLED').length})</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto max-h-[55vh] border border-line rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-field border-b border-line text-muted font-medium">
              <tr>
                <th className="py-2.5 px-3">Mã đơn</th>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Bàn / Khách</th>
                <th className="py-2.5 px-3">Thu ngân</th>
                <th className="py-2.5 px-3">Phương thức</th>
                <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                <th className="py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    Không tìm thấy đơn hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-raised/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-content">
                      {order.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 text-muted">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-content">{order.tableNumber}</div>
                      <div className="text-xs text-muted">{order.customerName}</div>
                    </td>
                    <td className="py-2.5 px-3 text-secondary">{order.cashierName}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-secondary">
                        {order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'VietQR'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-success text-sm">
                      {formatVND(order.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge
                        status={order.status}
                        label={order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectReceipt(order)}
                          className="p-1.5 rounded-lg bg-raised hover:bg-raised text-secondary hover:text-content transition-colors"
                          title="Xem & in hóa đơn"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {order.status === 'COMPLETED' && (
                          <button
                            onClick={() => setOrderToCancel(order)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-danger border border-rose-500/30 transition-colors"
                            title="Hủy hóa đơn này"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Cancellation Dialog */}
      <ConfirmDialog
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={() => {
          if (orderToCancel) cancelOrder(orderToCancel.id);
        }}
        title="Xác Nhận Hủy Hóa Đơn"
        message={`Bạn có chắc chắn muốn hủy đơn hàng ${orderToCancel?.orderNumber} trị giá ${formatVND(orderToCancel?.totalAmount || 0)}? Thao tác này sẽ cập nhật trạng thái đơn thành ĐÃ HỦY.`}
        confirmText="Hủy Hóa Đơn"
        variant="danger"
      />
    </Modal>
  );
};

