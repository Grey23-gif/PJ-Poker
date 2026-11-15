import React, { useState } from 'react';
import { usePosStore } from '../../stores/posStore';
import { useShiftStore } from '../../stores/shiftStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatsCard } from '../../components/ui/StatsCard';
import { formatVND, formatNumber, formatDate } from '../../utils/formatters';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const RevenueReportPage: React.FC = () => {
  const { orders, products } = usePosStore();
  const { shifts } = useShiftStore();

  const [dateRange, setDateRange] = useState<'7DAYS' | '30DAYS' | 'THIS_MONTH'>('7DAYS');

  // Filter completed orders
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCash = completedOrders
    .filter((o) => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalBank = completedOrders
    .filter((o) => o.paymentMethod === 'BANK_TRANSFER')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const cancelledRevenue = cancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Revenue by Day chart data (7 days)
  const revenueByDayData = [
    { date: '08/11', revenue: 3200000, cash: 1800000, bank: 1400000, orders: 18 },
    { date: '09/11', revenue: 4100000, cash: 2200000, bank: 1900000, orders: 24 },
    { date: '10/11', revenue: 3850000, cash: 2000000, bank: 1850000, orders: 20 },
    { date: '11/11', revenue: 5200000, cash: 2800000, bank: 2400000, orders: 29 },
    { date: '12/11', revenue: 4600000, cash: 2500000, bank: 2100000, orders: 25 },
    { date: '13/11', revenue: 6450000, cash: 3450000, bank: 3000000, orders: 36 },
    { date: '14/11', revenue: Math.max(345000, totalRevenue), cash: Math.max(155000, totalCash), bank: Math.max(190000, totalBank), orders: completedOrders.length },
  ];

  // Revenue by Shift chart data
  const shiftRevenueData = shifts.map((s) => ({
    shiftName: s.shiftName.split('(')[0].trim(),
    cashier: s.cashierName.split(' ').slice(-2).join(' '),
    revenue: s.closingReconciliation?.totalSales || 345000,
    cash: s.closingReconciliation?.expectedCashSales || 155000,
    bank: s.closingReconciliation?.expectedBankSales || 190000,
  }));

  // Top Selling Products
  const topProductsMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  completedOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!topProductsMap[item.productId]) {
        topProductsMap[item.productId] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      topProductsMap[item.productId].quantity += item.quantity;
      topProductsMap[item.productId].revenue += item.subtotal;
    });
  });

  const topProductsData = Object.values(topProductsMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Fallback for top products if orders are few
  const displayTopProducts =
    topProductsData.length > 0
      ? topProductsData
      : [
          { name: 'Cà Phê Muối Hoàng Gia', quantity: 48, revenue: 1680000 },
          { name: 'Combo All-In Thắng Lớn', quantity: 24, revenue: 2640000 },
          { name: 'Trà Đào Cam Sả Tươi', quantity: 35, revenue: 1575000 },
          { name: 'Khô Bò Cay Chanh Tỏi', quantity: 28, revenue: 1680000 },
          { name: 'Mì Bò Trứng Xúc Xích', quantity: 22, revenue: 1210000 },
          { name: 'Bò Húc Thái (Red Bull)', quantity: 40, revenue: 1000000 },
        ];

  // Payment Breakdown
  const paymentBreakdownData = [
    { name: 'Tiền mặt (Cash)', value: totalCash || 155000, color: 'var(--chart-green)' },
    { name: 'Chuyển khoản (VietQR)', value: totalBank || 190000, color: 'var(--chart-gold)' },
  ];

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Mã Đơn', 'Thời Gian', 'Bàn', 'Khách Hàng', 'Thu Ngân', 'Phương Thức', 'Tổng Tiền (VND)', 'Trạng Thái'];
    const rows = orders.map((o) => [
      o.orderNumber,
      formatDate(o.createdAt),
      o.tableNumber,
      `"${o.customerName}"`,
      `"${o.cashierName}"`,
      o.paymentMethod === 'CASH' ? 'Tiền mặt' : 'VietQR',
      o.totalAmount,
      o.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_Poker_Cafe_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-[var(--section-gap)] max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--component-gap)]">
        <div>
          <h1 className="page-title text-2xl font-semibold text-content flex flex-wrap items-center gap-2">
            Báo Cáo Doanh Thu & Phân Tích Dịch Vụ
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Thống kê doanh số bán hàng Cafe, phân bổ theo ca, nhân viên thu ngân và cơ cấu thanh toán
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-field border border-line-strong rounded-xl p-1 flex flex-wrap text-xs [&_button]:min-h-[var(--button-height)]">
            <button
              onClick={() => setDateRange('7DAYS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateRange === '7DAYS' ? 'bg-emerald-700 text-white' : 'text-muted hover:text-content'
              }`}
            >
              7 ngày
            </button>
            <button
              onClick={() => setDateRange('30DAYS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateRange === '30DAYS' ? 'bg-emerald-700 text-white' : 'text-muted hover:text-content'
              }`}
            >
              30 ngày
            </button>
            <button
              onClick={() => setDateRange('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateRange === 'THIS_MONTH' ? 'bg-emerald-700 text-white' : 'text-muted hover:text-content'
              }`}
            >
              Tháng này
            </button>
          </div>

          <Button
            variant="gold"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Xuất File CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[var(--component-gap)]">
        <StatsCard
          title="Tổng Doanh Thu Hợp Lệ"
          value={formatVND(totalRevenue)}
          change={{ value: '+18.2%', isPositive: true }}
          icon={<DollarSign className="w-5 h-5 text-success" />}
          iconBgColor="bg-emerald-500/10 text-success"
          glow="green"
        />

        <StatsCard
          title="Doanh Thu Tiền Mặt"
          value={formatVND(totalCash)}
          subValue="Chiếm 45% tổng doanh số"
          icon={<DollarSign className="w-5 h-5 text-success" />}
          iconBgColor="bg-emerald-500/10 text-success"
        />

        <StatsCard
          title="Doanh Thu Chuyển Khoản"
          value={formatVND(totalBank)}
          subValue="Chiếm 55% qua VietQR"
          icon={<CreditCard className="w-5 h-5 text-warning" />}
          iconBgColor="bg-amber-500/10 text-warning"
          glow="gold"
        />

        <StatsCard
          title="Hóa Đơn Đã Hủy"
          value={cancelledOrders.length}
          subValue={formatVND(cancelledRevenue)}
          icon={<RotateCcw className="w-5 h-5 text-danger" />}
          iconBgColor="bg-rose-500/10 text-danger"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left 2 Cols: Revenue Trend Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>
              <TrendingUp className="w-4 h-4 text-success" />
              Biểu Đồ Doanh Thu Theo Ngày & Phân Bổ Tiền Mặt / VietQR
            </CardTitle>
            <p className="text-xs text-muted mt-0.5">
              So sánh cơ cấu doanh thu theo từng ngày trong tuần
            </p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted)" fontSize={11} />
                <YAxis
                  stroke="var(--color-muted)"
                  fontSize={11}
                  tickFormatter={(v) => `${v / 1000000}M`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatVND(Number(value) || 0),
                    name === 'cash' ? 'Tiền mặt' : name === 'bank' ? 'VietQR' : 'Tổng',
                  ]}
                  contentStyle={{ backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend
                  formatter={(val) => (val === 'cash' ? 'Tiền mặt' : 'VietQR (Chuyển khoản)')}
                />
                <Bar dataKey="cash" stackId="a" fill="var(--chart-green)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="bank" stackId="a" fill="var(--chart-gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right 1 Col: Payment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cơ Cấu Phương Thức Thanh Toán</CardTitle>
            <p className="text-xs text-muted mt-0.5">Tỷ lệ thanh toán không tiền mặt vs tiền mặt</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-80">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatVND(Number(val) || 0), 'Doanh thu']}
                  contentStyle={{ backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-2 mt-3 text-xs">
              <div className="flex justify-between items-center bg-surface p-2 rounded-lg border border-line">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-secondary">Tiền mặt:</span>
                </div>
                <strong className="text-success">{formatVND(totalCash)}</strong>
              </div>
              <div className="flex justify-between items-center bg-surface p-2 rounded-lg border border-line">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-secondary">VietQR:</span>
                </div>
                <strong className="text-warning">{formatVND(totalBank)}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top-Selling Products & Shifts Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--section-gap)]">
        {/* Top Selling Products List */}
        <Card>
          <CardHeader>
            <CardTitle>
              <ShoppingBag className="w-4 h-4 text-success" />
              Top Món Cafe & Snack Bán Chạy Nhất
            </CardTitle>
            <p className="text-xs text-muted mt-0.5">Xếp hạng theo doanh số và số lượng phục vụ</p>
          </CardHeader>
          <CardContent className="p-0">
          <div tabIndex={0} role="region" aria-label="Bảng báo cáo có thể cuộn" className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface text-muted font-semibold border-b border-line">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Tên món</th>
                    <th className="py-2.5 px-4 text-center">Đã bán</th>
                    <th className="py-2.5 px-4 text-right">Doanh số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {displayTopProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-raised/30">
                      <td className="py-2.5 px-4 font-bold text-muted w-10">#{idx + 1}</td>
                      <td className="py-2.5 px-4 font-semibold text-content">{p.name}</td>
                      <td className="py-2.5 px-4 text-center text-secondary font-bold">
                        {p.quantity} phần
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-success">
                        {formatVND(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Shift */}
        <Card>
          <CardHeader>
            <CardTitle>
              <BarChart3 className="w-4 h-4 text-warning" />
              Doanh Thu Theo Ca Làm Việc
            </CardTitle>
            <p className="text-xs text-muted mt-0.5">Hiệu suất doanh số giữa các ca trực thu ngân</p>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="shiftName" stroke="var(--color-muted)" fontSize={11} />
                <YAxis
                  stroke="var(--color-muted)"
                  fontSize={11}
                  tickFormatter={(v) => `${v / 1000000}M`}
                />
                <Tooltip
                  formatter={(val: any) => [formatVND(Number(val) || 0), 'Doanh thu']}
                  contentStyle={{ backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="var(--chart-green)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

