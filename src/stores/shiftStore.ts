import { create } from 'zustand';
import { Shift, ShiftTemplate, CashReconciliation } from '../types/shift';
import { INITIAL_SHIFTS, INITIAL_SHIFT_TEMPLATES } from '../mocks/initialData';
import { usePosStore } from './posStore';

interface ShiftState {
  shifts: Shift[];
  templates: ShiftTemplate[];
  activeShift: Shift | null;

  // Shift Operations
  openShift: (data: {
    templateId: string;
    shiftName: string;
    cashierId: string;
    cashierName: string;
    openingCash: number;
    notes?: string;
  }) => Shift;

  closeShift: (
    shiftId: string,
    reconciliation: {
      actualCashCounted: number;
      handoverNotes?: string;
    }
  ) => void;

  addOrderToActiveShift: (orderId: string) => void;
  getShiftOrdersSummary: (shiftId: string) => {
    totalRevenue: number;
    cashRevenue: number;
    bankRevenue: number;
    orderCount: number;
  };
}

const STORAGE_KEY_SHIFTS = 'poker_cafe_shifts';

function loadStoredShifts(): Shift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHIFTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading shifts', e);
  }
  return INITIAL_SHIFTS;
}

export const useShiftStore = create<ShiftState>((set, get) => {
  const initialShifts = loadStoredShifts();
  const currentActive = initialShifts.find((s) => s.status === 'OPEN') || null;

  return {
    shifts: initialShifts,
    templates: INITIAL_SHIFT_TEMPLATES,
    activeShift: currentActive,

    openShift: (data) => {
      const { shifts } = get();
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const codeDate = now.toISOString().slice(2, 10).replace(/-/g, '');
      const code = `SHIFT-${codeDate}-${String(shifts.length + 1).padStart(2, '0')}`;

      const newShift: Shift = {
        id: `shift-${Date.now()}`,
        code,
        templateId: data.templateId,
        shiftName: data.shiftName,
        cashierId: data.cashierId,
        cashierName: data.cashierName,
        date: dateStr,
        status: 'OPEN',
        openedAt: now.toISOString(),
        openingCash: data.openingCash,
        orderIds: [],
        notes: data.notes,
      };

      const updated = [newShift, ...shifts];
      localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(updated));
      set({ shifts: updated, activeShift: newShift });
      return newShift;
    },

    closeShift: (shiftId: string, reconciliationData) => {
      const { shifts, getShiftOrdersSummary } = get();
      const shift = shifts.find((s) => s.id === shiftId);
      if (!shift || shift.status !== 'OPEN') return;

      const summary = getShiftOrdersSummary(shiftId);
      const expectedTotalCashInDrawer = shift.openingCash + summary.cashRevenue;
      const difference = reconciliationData.actualCashCounted - expectedTotalCashInDrawer;

      const closingReconciliation: CashReconciliation = {
        openingBalance: shift.openingCash,
        expectedCashSales: summary.cashRevenue,
        expectedBankSales: summary.bankRevenue,
        totalSales: summary.totalRevenue,
        actualCashCounted: reconciliationData.actualCashCounted,
        difference,
        handoverNotes: reconciliationData.handoverNotes || 'Bàn giao ca thành công.',
      };

      const now = new Date().toISOString();
      const updated = shifts.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              status: 'CLOSED' as const,
              closedAt: now,
              closingReconciliation,
            }
          : s
      );

      localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(updated));
      set({
        shifts: updated,
        activeShift: null,
      });
    },

    addOrderToActiveShift: (orderId: string) => {
      const { activeShift, shifts } = get();
      if (!activeShift) return;

      const updatedShift: Shift = {
        ...activeShift,
        orderIds: [orderId, ...activeShift.orderIds],
      };

      const updatedShifts = shifts.map((s) => (s.id === activeShift.id ? updatedShift : s));
      localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(updatedShifts));
      set({ activeShift: updatedShift, shifts: updatedShifts });
    },

    getShiftOrdersSummary: (shiftId: string) => {
      const { shifts } = get();
      const shift = shifts.find((s) => s.id === shiftId);
      if (!shift) {
        return { totalRevenue: 0, cashRevenue: 0, bankRevenue: 0, orderCount: 0 };
      }

      const orders = usePosStore.getState().orders;
      const shiftOrders = orders.filter(
        (o) => o.shiftId === shiftId && o.status === 'COMPLETED'
      );

      const cashRevenue = shiftOrders
        .filter((o) => o.paymentMethod === 'CASH')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const bankRevenue = shiftOrders
        .filter((o) => o.paymentMethod === 'BANK_TRANSFER')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        totalRevenue: cashRevenue + bankRevenue,
        cashRevenue,
        bankRevenue,
        orderCount: shiftOrders.length,
      };
    },
  };
});

