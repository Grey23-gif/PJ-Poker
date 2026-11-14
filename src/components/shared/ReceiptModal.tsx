import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Order } from '../../types/pos';
import { formatVND, formatDateTime } from '../../utils/formatters';
import { Printer, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, order }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Hóa Đơn Thanh Toán Cafe Poker">
      <div className="space-y-4">
        {/* Printable thermal receipt view */}
        <div
          id="printable-receipt"
          className="bg-white text-slate-900 p-5 rounded-lg font-mono text-xs shadow-inner space-y-3 border border-slate-300"
        >
          <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
            <h2 className="text-base font-bold tracking-wider text-slate-900">ROYAL POKER CLUB & CAFE</h2>
            <p className="text-[11px] text-slate-600">Đẳng Cấp Thể Thao Trí Tuệ & Thưởng Thức Cafe</p>
            <p className="text-[11px] text-slate-600">Hotline: 090.888.POKER | 123 Đường Poker, Quận 1</p>
          </div>

          <div className="space-y-1 text-[11px] text-slate-700 border-b border-dashed border-slate-400 pb-2">
            <div className="flex justify-between">
              <span>Mã hóa đơn:</span>
              <span className="font-bold text-slate-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>{order.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Vị trí / Khách:</span>
              <span>{order.tableNumber} - {order.customerName}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2 border-b border-dashed border-slate-400 pb-3">
            <div className="flex justify-between font-bold text-slate-900 text-[11px] pb-1 border-b border-slate-200">
              <span className="w-1/2">Tên món</span>
              <span className="w-1/6 text-center">SL</span>
              <span className="w-1/3 text-right">T.Tiền</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px] items-center">
                <div className="w-1/2 pr-1">
                  <div className="font-medium text-slate-900">{item.productName}</div>
                  <div className="text-[10px] text-slate-500">Đơn giá: {formatVND(item.unitPrice)}</div>
                </div>
                <div className="w-1/6 text-center">{item.quantity}</div>
                <div className="w-1/3 text-right font-medium">{formatVND(item.subtotal)}</div>
              </div>
            ))}
          </div>

          {/* Financials */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2 text-slate-700">
            <div className="flex justify-between">
              <span>Tổng tiền hàng:</span>
              <span>{formatVND(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Giảm giá ({order.discountPercent}%):</span>
                <span>-{formatVND(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>THANH TOÁN:</span>
              <span className="text-emerald-700">{formatVND(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Hình thức:</span>
              <span className="font-semibold">
                {order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản (VietQR)'}
              </span>
            </div>
            {order.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between">
                  <span>Tiền khách đưa:</span>
                  <span>{formatVND(order.amountReceived || order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền thối lại:</span>
                  <span className="font-semibold">{formatVND(order.changeAmount || 0)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-500 pt-2 space-y-1">
            <p>Cảm ơn Quý Khách & Chúc Quý Khách May Mắn Tại Bàn Đấu!</p>
            <p className="italic">Wifi: RoyalPoker_Guest / Pass: RoyalPoker888</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center text-xs text-emerald-400">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Giao dịch đã được lưu vào hệ thống
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button variant="gold" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              In Hóa Đơn
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

