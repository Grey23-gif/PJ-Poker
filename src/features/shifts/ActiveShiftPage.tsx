import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShiftStore } from '../../stores/shiftStore';
import { usePosStore } from '../../stores/posStore';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { StatsCard } from '../../components/ui/StatsCard';
import { OpenShiftModal } from './OpenShiftModal';
import { CloseShiftModal } from './CloseShiftModal';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { formatVND, formatDateTime } from '../../utils/formatters';
import { Order } from '../../types/pos';
import {
  CalendarCheck,
  Coffee,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Plus,
  LogOut,
  AlertCircle,
  Receipt,
  User,
} from 'lucide-react';

export const ActiveShiftPage: React.FC = () => {
  const { activeShift, getShiftOrdersSummary } = useShiftStore();
  const { orders } = usePosStore();
  const { currentUser } = useAuthStore();

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);

  if (!activeShift) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-warning flex items-center justify-center mx-auto">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-content">Chưa Có Ca Làm Việc Nào Đang Mở</h2>
        <p className="text-xs text-muted">
          Hiện tại chưa có ca làm việc hoạt động. Nhân viên thu ngân cần mở ca mới để ghi nhận doanh thu và bàn giao két tiền.
        </p>
        <Button
          variant="gold"
          size="lg"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsOpenModalOpen(true)}
        >
          Mở Ca Làm Việc Mới
        </Button>

        <OpenShiftModal
          isOpen={isOpenModalOpen}
          onClose={() => setIsOpenModalOpen(false)}
        />
      </div>
    );
  }

  const summary = getShiftOrdersSummary(activeShift.id);
  const shiftOrders = orders.filter((o) => o.shiftId === activeShift.id);

  return (
    <div className="space-y-[var(--section-gap)] max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--component-gap)] bg-canvas border border-emerald-500/30 p-[var(--card-padding)] rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 " />
            <StatusBadge status="OPEN" label="CA ĐANG HOẠT ĐỘNG" />
            <span className="font-mono text-xs text-warning font-bold">[{activeShift.code}]</span>
          </div>
          <h1 className="page-title text-xl sm:text-2xl font-semibold text-content">{activeShift.shiftName}</h1>
          <p className="text-xs text-muted">
            Thu ngân trực: <strong className="text-content">{activeShift.cashierName}</strong> •
            Mở lúc: {formatDateTime(activeShift.openedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/pos">
            <Button variant="emerald" size="sm" leftIcon={<Coffee className="w-4 h-4" />}>
              Bán Hàng POS
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={() => setIsCloseModalOpen(true)}
          >
            Kết Ca & Bàn Giao
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[var(--component-gap)]">
        <StatsCard
          title="Tiền Mặt Đầu Ca (Két)"
          value={formatVND(activeShift.openingCash)}
          subValue="Số dư ban đầu"
          icon={<DollarSign className="w-5 h-5 text-muted" />}
          iconBgColor="bg-raised text-secondary"
        />

        <StatsCard
          title="Doanh Thu Tiền Mặt"
          value={formatVND(summary.cashRevenue)}
          subValue="Đã thu vào két tiền"
          icon={<DollarSign className="w-5 h-5 text-success" />}
          iconBgColor="bg-emerald-500/10 text-success"
          glow="green"
        />

        <StatsCard
          title="Doanh Thu Chuyển Khoản"
          value={formatVND(summary.bankRevenue)}
          subValue="Thanh toán VietQR"
          icon={<CreditCard className="w-5 h-5 text-warning" />}
          iconBgColor="bg-amber-500/10 text-warning"
        />

        <StatsCard
          title="Tổng Doanh Thu Ca"
          value={formatVND(summary.totalRevenue)}
          subValue={`${summary.orderCount} hóa đơn hoàn thành`}
          icon={<ShoppingBag className="w-5 h-5 text-info" />}
          iconBgColor="bg-sky-500/10 text-info"
        />
      </div>

      {/* Orders in this shift */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              <Receipt className="w-4 h-4 text-success" />
              Danh Sách Đơn Hàng Trong Ca Hiện Tại ({shiftOrders.length})
            </CardTitle>
            <p className="text-xs text-muted mt-0.5">
              Tất cả các giao dịch được tạo và thanh toán trong ca làm việc này
            </p>
          </div>
          <Link to="/pos" className="text-xs text-success hover:underline">
            Tạo thêm đơn POS
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div tabIndex={0} role="region" aria-label="Bảng giao dịch trong ca có thể cuộn" className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface border-b border-line text-muted font-medium">
                <tr>
                  <th className="py-3 px-4">Số hóa đơn</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Bàn / Khách</th>
                  <th className="py-3 px-4">Số lượng món</th>
                  <th className="py-3 px-4">Phương thức</th>
                  <th className="py-3 px-4 text-right">Tổng tiền</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {shiftOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted">
                      Chưa có hóa đơn nào được tạo trong ca này.
                    </td>
                  </tr>
                ) : (
                  shiftOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-raised/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-content">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-muted">{formatDateTime(order.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-content">{order.tableNumber}</span>
                        <span className="text-muted ml-1">({order.customerName})</span>
                      </td>
                      <td className="py-3 px-4 text-secondary">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} món
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-secondary">
                          {order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'VietQR'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-success text-sm">
                        {formatVND(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedReceipt(order)}
                        >
                          Xem Hóa Đơn
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Close Shift Modal */}
      <CloseShiftModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        shift={activeShift}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        order={selectedReceipt}
      />
    </div>
  );
};

