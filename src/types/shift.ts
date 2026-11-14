export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface ShiftTemplate {
  id: string;
  name: string; // e.g. "Ca Sáng", "Ca Chiều", "Ca Đêm"
  startTime: string; // "08:00"
  endTime: string; // "14:00"
  isOvernight?: boolean;
}

export interface CashReconciliation {
  openingBalance: number; // Tiền mặt đầu ca
  expectedCashSales: number; // Doanh thu tiền mặt theo hệ thống
  expectedBankSales: number; // Doanh thu chuyển khoản theo hệ thống
  totalSales: number;
  actualCashCounted: number; // Tiền mặt thực tế kiểm đếm lúc kết ca
  difference: number; // actualCashCounted - (openingBalance + expectedCashSales)
  handoverNotes?: string; // Ghi chú bàn giao
}

export interface Shift {
  id: string;
  code: string;
  templateId: string;
  shiftName: string;
  cashierId: string;
  cashierName: string;
  date: string;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingReconciliation?: CashReconciliation;
  orderIds: string[]; // Orders created during this shift
  notes?: string;
}

