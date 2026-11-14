import { create } from 'zustand';
import { Product, CartItem, Order, ProductCategory, PaymentMethod } from '../types/pos';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from '../mocks/initialData';

interface PosState {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  selectedCategory: ProductCategory | 'ALL';
  searchQuery: string;
  discountPercent: number;
  customerName: string;
  tableNumber: string;
  notes: string;
  paymentMethod: PaymentMethod;
  amountReceived: number;

  // Cart operations
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  setDiscountPercent: (percent: number) => void;
  setCustomerInfo: (name: string, table: string) => void;
  setNotes: (notes: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountReceived: (amount: number) => void;
  clearCart: () => void;

  // Checkout
  checkout: (cashierId: string, cashierName: string, shiftId?: string) => Order | null;
  cancelOrder: (orderId: string) => void;

  // Product CRUD
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;

  // Filters
  setSelectedCategory: (cat: ProductCategory | 'ALL') => void;
  setSearchQuery: (query: string) => void;
}

const STORAGE_KEY_PRODUCTS = 'poker_cafe_products';
const STORAGE_KEY_ORDERS = 'poker_cafe_orders';

function loadStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading products', e);
  }
  return INITIAL_PRODUCTS;
}

function loadStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading orders', e);
  }
  return INITIAL_ORDERS;
}

export const usePosStore = create<PosState>((set, get) => {
  const initialProducts = loadStoredProducts();
  const initialOrders = loadStoredOrders();

  return {
    products: initialProducts,
    orders: initialOrders,
    cart: [],
    selectedCategory: 'ALL',
    searchQuery: '',
    discountPercent: 0,
    customerName: '',
    tableNumber: 'Bàn 1',
    notes: '',
    paymentMethod: 'CASH',
    amountReceived: 0,

    addToCart: (product: Product) => {
      const { cart } = get();
      const existing = cart.find((item) => item.product.id === product.id);
      let updatedCart: CartItem[];
      if (existing) {
        updatedCart = cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [...cart, { product, quantity: 1 }];
      }
      set({ cart: updatedCart });
    },

    removeFromCart: (productId: string) => {
      const { cart } = get();
      set({ cart: cart.filter((item) => item.product.id !== productId) });
    },

    updateQuantity: (productId: string, quantity: number) => {
      const { cart } = get();
      if (quantity <= 0) {
        set({ cart: cart.filter((item) => item.product.id !== productId) });
        return;
      }
      set({
        cart: cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      });
    },

    updateItemNotes: (productId: string, notes: string) => {
      const { cart } = get();
      set({
        cart: cart.map((item) =>
          item.product.id === productId ? { ...item, notes } : item
        ),
      });
    },

    setDiscountPercent: (percent: number) => {
      set({ discountPercent: Math.max(0, Math.min(100, percent)) });
    },

    setCustomerInfo: (name: string, table: string) => {
      set({ customerName: name, tableNumber: table });
    },

    setNotes: (notes: string) => {
      set({ notes });
    },

    setPaymentMethod: (method: PaymentMethod) => {
      set({ paymentMethod: method });
    },

    setAmountReceived: (amount: number) => {
      set({ amountReceived: amount });
    },

    clearCart: () => {
      set({
        cart: [],
        discountPercent: 0,
        customerName: '',
        tableNumber: 'Bàn 1',
        notes: '',
        amountReceived: 0,
      });
    },

    checkout: (cashierId: string, cashierName: string, shiftId?: string) => {
      const {
        cart,
        discountPercent,
        customerName,
        tableNumber,
        notes,
        paymentMethod,
        amountReceived,
        orders,
      } = get();

      if (cart.length === 0) return null;

      const subtotal = cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const discountAmount = Math.round((subtotal * discountPercent) / 100);
      const totalAmount = subtotal - discountAmount;
      const actualReceived = paymentMethod === 'BANK_TRANSFER' ? totalAmount : (amountReceived || totalAmount);
      const changeAmount = Math.max(0, actualReceived - totalAmount);

      const now = new Date();
      const dateCode = now.toISOString().slice(2, 10).replace(/-/g, '');
      const orderNumber = `POS-${dateCode}-${String(orders.length + 1).padStart(3, '0')}`;

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity,
          notes: item.notes,
        })),
        subtotal,
        discountPercent,
        discountAmount,
        totalAmount,
        paymentMethod,
        amountReceived: actualReceived,
        changeAmount,
        customerName: customerName.trim() || 'Khách vãng lai',
        tableNumber: tableNumber.trim() || 'Bàn Cafe',
        notes,
        status: 'COMPLETED',
        cashierId,
        cashierName,
        shiftId,
        createdAt: now.toISOString(),
      };

      const updatedOrders = [newOrder, ...orders];
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders));

      // Reset cart
      set({
        orders: updatedOrders,
        cart: [],
        discountPercent: 0,
        customerName: '',
        tableNumber: 'Bàn 1',
        notes: '',
        amountReceived: 0,
      });

      return newOrder;
    },

    cancelOrder: (orderId: string) => {
      const { orders } = get();
      const updated = orders.map((o) =>
        o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o
      );
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
      set({ orders: updated });
    },

    addProduct: (prodData) => {
      const { products } = get();
      const newProduct: Product = {
        ...prodData,
        id: `prod-${Date.now()}`,
      };
      const updated = [newProduct, ...products];
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
      set({ products: updated });
      return newProduct;
    },

    updateProduct: (id: string, updated: Partial<Product>) => {
      const { products } = get();
      const newProducts = products.map((p) =>
        p.id === id ? { ...p, ...updated } : p
      );
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(newProducts));
      set({ products: newProducts });
    },

    deleteProduct: (id: string) => {
      const { products } = get();
      const updated = products.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
      set({ products: updated });
    },

    toggleProductAvailability: (id: string) => {
      const { products } = get();
      const updated = products.map((p) =>
        p.id === id ? { ...p, isAvailable: !p.isAvailable } : p
      );
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
      set({ products: updated });
    },

    setSelectedCategory: (cat) => set({ selectedCategory: cat }),
    setSearchQuery: (query) => set({ searchQuery: query }),
  };
});

