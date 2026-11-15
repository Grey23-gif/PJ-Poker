import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatVND } from '../../utils/formatters';
import { QrCode, Copy, Check, CheckCircle2 } from 'lucide-react';

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  totalAmount: number;
  orderNumber?: string;
  tableNumber?: string;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  totalAmount,
  orderNumber = 'POS-ORDER',
  tableNumber = 'Bàn Cafe',
}) => {
  const [copied, setCopied] = useState(false);
  const bankName = 'MB BANK (Ngân hàng Quân Đội)';
  const accountNumber = '999988887777';
  const accountHolder = 'ROYAL POKER CLUB CAFE';
  const transferContent = `ROYAL ${orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

  const handleCopyContent = () => {
    navigator.clipboard.writeText(transferContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Thanh Toán Chuyển Khoản VietQR">
      <div className="space-y-4">
        {/* QR Code Card */}
        <div className="bg-field border border-line rounded-xl p-4 flex flex-col items-center text-center">
          <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 mb-3">
            {/* SVG Simulated VietQR Code */}
            <svg
              className="w-48 h-48 sm:w-56 sm:h-56"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Corner position locators */}
              <rect x="15" y="15" width="45" height="45" rx="6" fill="#0f172a" />
              <rect x="23" y="23" width="29" height="29" rx="3" fill="white" />
              <rect x="29" y="29" width="17" height="17" rx="2" fill="#059669" />

              <rect x="140" y="15" width="45" height="45" rx="6" fill="#0f172a" />
              <rect x="148" y="23" width="29" height="29" rx="3" fill="white" />
              <rect x="154" y="29" width="17" height="17" rx="2" fill="#059669" />

              <rect x="15" y="140" width="45" height="45" rx="6" fill="#0f172a" />
              <rect x="23" y="148" width="29" height="29" rx="3" fill="white" />
              <rect x="29" y="154" width="17" height="17" rx="2" fill="#059669" />

              {/* QR Pattern dots */}
              <circle cx="75" cy="25" r="4" fill="#0f172a" />
              <circle cx="95" cy="25" r="4" fill="#0f172a" />
              <circle cx="115" cy="25" r="4" fill="#0f172a" />
              <circle cx="75" cy="45" r="4" fill="#0f172a" />
              <circle cx="115" cy="45" r="4" fill="#0f172a" />

              <circle cx="25" cy="75" r="4" fill="#0f172a" />
              <circle cx="45" cy="75" r="4" fill="#0f172a" />
              <circle cx="65" cy="75" r="4" fill="#0f172a" />
              <circle cx="85" cy="75" r="4" fill="#0f172a" />
              <circle cx="105" cy="75" r="4" fill="#059669" />
              <circle cx="125" cy="75" r="4" fill="#0f172a" />
              <circle cx="145" cy="75" r="4" fill="#0f172a" />
              <circle cx="175" cy="75" r="4" fill="#0f172a" />

              <circle cx="25" cy="95" r="4" fill="#0f172a" />
              <circle cx="65" cy="95" r="4" fill="#0f172a" />
              <circle cx="85" cy="95" r="4" fill="#0f172a" />
              <circle cx="135" cy="95" r="4" fill="#0f172a" />
              <circle cx="175" cy="95" r="4" fill="#0f172a" />

              {/* Center Logo Badge */}
              <circle cx="100" cy="100" r="16" fill="#10b981" />
              <text x="93" y="106" fill="white" fontSize="16" fontWeight="bold">♠</text>

              <circle cx="25" cy="115" r="4" fill="#0f172a" />
              <circle cx="45" cy="115" r="4" fill="#0f172a" />
              <circle cx="85" cy="115" r="4" fill="#0f172a" />
              <circle cx="115" cy="115" r="4" fill="#0f172a" />
              <circle cx="155" cy="115" r="4" fill="#0f172a" />

              <circle cx="75" cy="145" r="4" fill="#0f172a" />
              <circle cx="95" cy="145" r="4" fill="#0f172a" />
              <circle cx="125" cy="145" r="4" fill="#0f172a" />
              <circle cx="165" cy="145" r="4" fill="#0f172a" />

              <circle cx="75" cy="175" r="4" fill="#0f172a" />
              <circle cx="105" cy="175" r="4" fill="#059669" />
              <circle cx="145" cy="175" r="4" fill="#0f172a" />
              <circle cx="175" cy="175" r="4" fill="#0f172a" />
            </svg>
          </div>

          <div className="text-xl font-bold text-warning">
            {formatVND(totalAmount)}
          </div>
          <p className="text-xs text-muted mt-0.5">Quét mã bằng ứng dụng ngân hàng bất kỳ (24/7)</p>
        </div>

        {/* Bank Details */}
        <div className="bg-field/60 border border-line rounded-lg p-3 text-xs space-y-2 text-secondary">
          <div className="flex justify-between">
            <span className="text-muted">Ngân hàng:</span>
            <span className="font-semibold text-content">{bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Số tài khoản:</span>
            <span className="font-mono font-bold text-success">{accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Chủ tài khoản:</span>
            <span className="font-semibold text-content">{accountHolder}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-line">
            <span className="text-muted">Nội dung CK:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-warning bg-raised/80 px-2 py-0.5 rounded">
              <span>{transferContent}</span>
              <button
                onClick={handleCopyContent}
                className="text-muted hover:text-content p-0.5"
                title="Sao chép nội dung"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button
            variant="emerald"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() => {
              onConfirmPayment();
              onClose();
            }}
          >
            Đã Nhận Chuyển Khoản Thành Công
          </Button>
        </div>
      </div>
    </Modal>
  );
};

