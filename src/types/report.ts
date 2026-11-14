export interface DailyRevenue {
  date: string;
  totalRevenue: number;
  orderCount: number;
  cashRevenue: number;
  bankRevenue: number;
}

export interface ShiftRevenueReport {
  shiftId: string;
  shiftName: string;
  date: string;
  cashierName: string;
  totalRevenue: number;
  orderCount: number;
  cashRevenue: number;
  bankRevenue: number;
  cashDiscrepancy: number;
}

export interface CashierRevenueReport {
  cashierId: string;
  cashierName: string;
  totalOrders: number;
  totalRevenue: number;
  cashRevenue: number;
  bankRevenue: number;
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface PaymentMethodBreakdown {
  name: string;
  value: number;
  count: number;
  color: string;
}

