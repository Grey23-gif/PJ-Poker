export type ProductCategory = 'COFFEE' | 'TEA' | 'SNACK' | 'COLD_BEV' | 'FOOD' | 'POKER_SPECIAL';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  price: number; // in VND
  costPrice?: number;
  image?: string;
  description?: string;
  isAvailable: boolean;
  stock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export type OrderStatus = 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  changeAmount?: number;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  tableNumber?: string;
  notes?: string;
  status: OrderStatus;
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  createdAt: string;
}

