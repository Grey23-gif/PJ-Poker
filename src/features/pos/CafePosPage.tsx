import React, { useState } from 'react';
import { usePosStore } from '../../stores/posStore';
import { useAuthStore } from '../../stores/authStore';
import { useShiftStore } from '../../stores/shiftStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProductManagementModal } from './ProductManagementModal';
import { OrderHistoryModal } from './OrderHistoryModal';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { VietQRModal } from '../../components/shared/VietQRModal';
import { formatVND, formatNumber } from '../../utils/formatters';
import { Product, ProductCategory, Order } from '../../types/pos';
import {
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Search,
  Receipt,
  QrCode,
  Banknote,
  Percent,
  Edit2,
  AlertCircle,
  FileText,
  LayoutGrid,
  Leaf,
  GlassWater,
  UtensilsCrossed,
  Cookie,
  Spade,
} from 'lucide-react';

export const CafePosPage: React.FC = () => {
  const {
    products,
    cart,
    selectedCategory,
    searchQuery,
    discountPercent,
    customerName,
    tableNumber,
    notes,
    paymentMethod,
    amountReceived,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemNotes,
    setDiscountPercent,
    setCustomerInfo,
    setNotes,
    setPaymentMethod,
    setAmountReceived,
    clearCart,
    checkout,
    setSelectedCategory,
    setSearchQuery,
  } = usePosStore();

  const { currentUser, hasPermission } = useAuthStore();
  const { activeShift, addOrderToActiveShift } = useShiftStore();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isVietQRModalOpen, setIsVietQRModalOpen] = useState(false);
  const [showItemNotesId, setShowItemNotesId] = useState<string | null>(null);

  // Category definitions with icons
  const categories: { id: ProductCategory | 'ALL'; name: string; icon: React.ReactNode }[] = [
    { id: 'ALL', name: 'Tất cả món', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'COFFEE', name: 'Cà phê đặc biệt', icon: <Coffee className="w-4 h-4" /> },
    { id: 'TEA', name: 'Trà & Trà sữa', icon: <Leaf className="w-4 h-4" /> },
    { id: 'COLD_BEV', name: 'Nước ép & Tăng lực', icon: <GlassWater className="w-4 h-4" /> },
    { id: 'FOOD', name: 'Món ăn nóng', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'SNACK', name: 'Món nhắm Poker', icon: <Cookie className="w-4 h-4" /> },
    { id: 'POKER_SPECIAL', name: 'Combo All-In', icon: <Spade className="w-4 h-4" /> },
  ];

  // Filter products by selected category and search
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'ALL' || prod.category === selectedCategory;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Financial calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalAmount = subtotal - discountAmount;
  const currentReceived = paymentMethod === 'BANK_TRANSFER' ? totalAmount : (amountReceived || totalAmount);
  const changeAmount = Math.max(0, currentReceived - totalAmount);

  // Handle Checkout
  const handleProceedCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'BANK_TRANSFER') {
      setIsVietQRModalOpen(true);
      return;
    }

    finalizeCheckout();
  };

  const finalizeCheckout = () => {
    const cashierId = currentUser?.id || 'usr-cashier-1';
    const cashierName = currentUser?.fullName || 'Thu Ngân';
    const shiftId = activeShift?.id;

    const order = checkout(cashierId, cashierName, shiftId);
    if (order) {
      if (shiftId) {
        addOrderToActiveShift(order.id);
      }
      setCompletedOrder(order);
      setIsReceiptModalOpen(true);
    }
  };

  const handleEditProduct = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const canManageProducts = currentUser?.role === 'ADMIN' || hasPermission('POS_PRODUCT_MANAGE');

  return (
    <div className="pos-page flex flex-col gap-5">
      {/* Top Banner with Active Shift Notice */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-[var(--component-gap)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-success">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="page-title text-2xl font-semibold text-content flex items-center gap-2">
              Quầy bán hàng
              
            </h1>
            <div className="text-xs text-muted flex items-center gap-3 mt-0.5">
              {activeShift ? (
                <span className="flex items-center gap-1 text-success">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {activeShift.shiftName} (Thu ngân: {activeShift.cashierName})
                </span>
              ) : (
                <span className="text-warning flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Chưa mở ca làm việc chính thức
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageProducts && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setProductToEdit(null);
                setIsProductModalOpen(true);
              }}
            >
              Thêm Món Mới
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Receipt className="w-4 h-4" />}
            onClick={() => setIsHistoryModalOpen(true)}
          >
            Lịch Sử Hóa Đơn
          </Button>
        </div>
      </div>

      {/* Product catalog and checkout workspace */}
      <div className="pos-workspace">
        <div className="pos-catalog flex flex-col gap-3">
        {/* Category filters */}
        <div className="pos-categories">
          
          {categories.map((cat) => {
            const count =
              cat.id === 'ALL'
                ? products.length
                : products.filter((p) => p.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={isSelected}
                className={`pos-category flex items-center justify-between gap-3 px-3 py-[var(--control-padding-y)] rounded-lg text-xs font-medium transition-colors whitespace-nowrap text-left ${
                  isSelected
                    ? 'font-semibold'
                    : 'text-secondary hover:bg-raised/80 hover:text-content'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
                <span
                  className={`hidden md:inline-block text-[11px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-success/10 text-success' : 'bg-raised text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and product catalog */}
        <div className="flex flex-col gap-[var(--component-gap)] min-w-0">
          {/* Search bar */}
          <div className="relative shrink-0">
            <Input
              aria-label="Tìm món theo tên hoặc mã sản phẩm"
              placeholder="Tìm món theo tên hoặc mã sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Product cards grid */}
          <div className="pos-products">
            {filteredProducts.length === 0 ? (
              <div role="status" className="col-span-full py-16 text-center text-muted text-xs">
                Không tìm thấy món nào trong danh mục này.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    className="pos-product group flex flex-col justify-between"
                  >
                    <button type="button" aria-label={`Thêm ${product.name} vào đơn hàng`} onClick={() => addToCart(product)} className="absolute inset-0 z-[1] rounded-xl focus-visible:outline-offset-[-4px]" />
                    {/* Badge if item is in cart */}
                    {inCart && (
                      <span className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md animate-fade-in">
                        {inCart.quantity}
                      </span>
                    )}

                    {/* Edit button */}
                    {canManageProducts && (
                      <button
                        onClick={(e) => handleEditProduct(product, e)}
                        className="product-edit absolute top-2 left-2 z-10 min-w-9 min-h-9 flex items-center justify-center p-1.5 rounded-lg bg-black/60 text-white hover:text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Chỉnh sửa sản phẩm"
                        aria-label={`Chỉnh sửa ${product.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Product Image */}
                    <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2.5 bg-field">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300'}
                        alt={product.name}
                        className="w-full h-full object-cover  transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                      <span className="absolute bottom-1.5 left-2 font-mono text-[10px] text-secondary font-bold bg-field/80 px-1.5 py-0.5 rounded">
                        {product.code}
                      </span>
                    </div>

                    {/* Product Name & Price */}
                    <div>
                      <h4 className="font-semibold text-content text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-success transition-colors">
                        {product.name}
                      </h4>
                      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1">
                        <span className="text-success font-bold text-xs sm:text-sm">
                          {formatVND(product.price)}
                        </span>
                        <span className="text-[10px] text-muted">
                          Kho: {product.stock || 50}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        </div>
        {/* Sticky order summary and checkout */}
        <div className="pos-cart flex flex-col gap-[var(--component-gap)]">
          {/* Cart Header & Customer Inputs */}
          <div className="space-y-3 pb-3 border-b border-line shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-content text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-success" />
                Đơn Hàng Hiện Tại
                {cart.length > 0 && (
                  <span className="text-xs text-success">({cart.reduce((s, i) => s + i.quantity, 0)} món)</span>
                )}
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-danger hover:text-danger flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
                </button>
              )}
            </div>

            {/* Table & Customer Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label htmlFor="pos-table" className="block text-xs text-muted mb-1">Vị trí bàn</label>
                <select
                  id="pos-table"
                  value={tableNumber}
                  onChange={(e) => setCustomerInfo(customerName, e.target.value)}
                  className="w-full bg-field border border-line-strong rounded-lg p-1.5 text-content text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Bàn 1">Bàn Cafe 1</option>
                  <option value="Bàn 2">Bàn Cafe 2</option>
                  <option value="Bàn 3">Bàn Cafe 3</option>
                  <option value="Bàn Poker 1">Bàn Poker 1</option>
                  <option value="Bàn Poker 2">Bàn Poker 2</option>
                  <option value="Bàn VIP 1">Bàn VIP 1</option>
                  <option value="Quầy Bar">Quầy Bar</option>
                  <option value="Mang Về">Mang Về (Take away)</option>
                </select>
              </div>

              <div>
                <label htmlFor="pos-customer" className="block text-xs text-muted mb-1">Tên khách / SĐT</label>
                <input
                  type="text"
                  id="pos-customer"
                  placeholder="Khách vãng lai..."
                  value={customerName}
                  onChange={(e) => setCustomerInfo(e.target.value, tableNumber)}
                  className="w-full bg-field border border-line-strong rounded-lg p-1.5 text-content text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="max-h-[360px] overflow-y-auto py-2 space-y-3 min-h-[140px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-[var(--card-padding)] text-muted space-y-2">
                <Coffee className="w-10 h-10 text-muted" />
                <p className="text-xs">Chưa có món nào được chọn</p>
                <p className="text-[11px] text-muted">Nhấn vào các món bên menu để thêm vào đơn hàng</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-field/90 border border-line rounded-xl p-2.5 text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-content">{item.product.name}</div>
                      <div className="text-[11px] text-muted">
                        {formatVND(item.product.price)} x {item.quantity} ={' '}
                        <strong className="text-success font-bold">
                          {formatVND(item.product.price * item.quantity)}
                        </strong>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 bg-raised rounded-lg p-0.5 border border-line-strong shrink-0">
                      <button
                        aria-label={`Giảm số lượng ${item.product.name}`}
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 text-secondary hover:text-content hover:bg-raised rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-content text-xs">
                        {item.quantity}
                      </span>
                      <button
                        aria-label={`Tăng số lượng ${item.product.name}`}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 text-secondary hover:text-content hover:bg-raised rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Item note input toggle */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-line/60">
                    <button
                      onClick={() =>
                        setShowItemNotesId(showItemNotesId === item.product.id ? null : item.product.id)
                      }
                      className="text-muted hover:text-success flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      {item.notes ? item.notes : '+ Ghi chú món'}
                    </button>
                    <button
                      aria-label={`Xóa ${item.product.name} khỏi đơn`}
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {showItemNotesId === item.product.id && (
                    <input
                      type="text"
                      aria-label={`Ghi chú cho ${item.product.name}`}
                      placeholder="Ít đá, không đường, ít ngọt..."
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                      className="w-full bg-field border border-line-strong rounded px-2 py-1 text-[11px] text-content focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Cart Financial Summary & Checkout Options */}
          <div className="pt-3 border-t border-line space-y-3 shrink-0">
            {/* Discount selector */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-warning" /> Giảm giá hội viên (%):
              </span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    aria-pressed={discountPercent === pct}
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      discountPercent === pct
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-raised text-muted hover:text-content'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs text-secondary">
              <div className="flex justify-between">
                <span className="text-muted">Tạm tính hàng:</span>
                <span>{formatVND(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Giảm trừ:</span>
                  <span>-{formatVND(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1 border-t border-line">
                <span className="text-sm font-bold text-content">Tổng Phải Thu:</span>
                <span className="text-2xl font-semibold text-success">{formatVND(totalAmount)}</span>
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                aria-pressed={paymentMethod === 'CASH'}
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-raised/80 text-muted hover:text-content'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tiền Mặt</span>
              </button>

              <button
                type="button"
                aria-pressed={paymentMethod === 'BANK_TRANSFER'}
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-raised/80 text-muted hover:text-content'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>VietQR (CK)</span>
              </button>
            </div>

            {/* Quick Cash Buttons if CASH */}
            {paymentMethod === 'CASH' && cart.length > 0 && (
              <div className="space-y-1.5 bg-field/60 p-2.5 rounded-xl border border-line text-xs">
                <div className="flex justify-between items-center text-[11px] text-muted">
                  <span>Khách đưa:</span>
                  <div className="flex gap-1">
                    {[totalAmount, 100000, 200000, 500000].map((amt, idx) => {
                      if (idx > 0 && amt < totalAmount) return null;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAmountReceived(amt)}
                          className="px-1.5 py-0.5 rounded bg-raised text-[10px] text-secondary hover:bg-raised"
                        >
                          {amt === totalAmount ? 'Vừa đủ' : `${amt / 1000}k`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-line/60">
                  <span className="text-muted">Tiền thối lại:</span>
                  <span className="font-bold text-success">{formatVND(changeAmount)}</span>
                </div>
              </div>
            )}

            {/* Checkout Action Button */}
            <Button
              variant="emerald"
              size="lg"
              className="w-full font-bold shadow-lg shadow-emerald-950/60"
              disabled={cart.length === 0}
              onClick={handleProceedCheckout}
            >
              {paymentMethod === 'BANK_TRANSFER'
                ? 'Tạo Mã VietQR Thanh Toán'
                : 'Thanh Toán & In Hóa Đơn'}
            </Button>
          </div>
        </div>
      </div>

      {/* Product Management Modal */}
      <ProductManagementModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectReceipt={(ord) => {
          setCompletedOrder(ord);
          setIsReceiptModalOpen(true);
        }}
      />

      {/* Printable Receipt Preview Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={completedOrder}
      />

      {/* VietQR Bank Transfer Modal */}
      <VietQRModal
        isOpen={isVietQRModalOpen}
        onClose={() => setIsVietQRModalOpen(false)}
        onConfirmPayment={finalizeCheckout}
        totalAmount={totalAmount}
        orderNumber={tableNumber}
      />
    </div>
  );
};

