import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePosStore } from '../../stores/posStore';
import { useTournamentStore } from '../../stores/tournamentStore';
import { usePointsStore } from '../../stores/pointsStore';
import { useShiftStore } from '../../stores/shiftStore';
import { StatsCard } from '../../components/ui/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { formatVND, formatDateTime, formatNumber } from '../../utils/formatters';
import { Order } from '../../types/pos';
import {
  DollarSign,
  ShoppingBag,
  Trophy,
  Users,
  Clock,
  Coins,
  ArrowRight,
  Coffee,
  CheckCircle,
  XCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { orders } = usePosStore();
  const { tournaments } = useTournamentStore();
  const { requests, leaderboard, approveRequest, rejectRequest } = usePointsStore();
  const { activeShift } = useShiftStore();

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Today's Date String
  const todayStr = '2026-11-14'; // Or new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(
    (o) => o.createdAt.startsWith(todayStr) && o.status === 'COMPLETED'
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const runningTour = tournaments.find((t) => t.status === 'RUNNING');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const recentOrders = orders.slice(0, 5);

  // Revenue 7-day trend mock data
  const revenueTrendData = [
    { day: '08/11', revenue: 3200000, orders: 18 },
    { day: '09/11', revenue: 4100000, orders: 24 },
    { day: '10/11', revenue: 3850000, orders: 20 },
    { day: '11/11', revenue: 5200000, orders: 29 },
    { day: '12/11', revenue: 4600000, orders: 25 },
    { day: '13/11', revenue: 6450000, orders: 36 },
    { day: '14/11 (Hôm nay)', revenue: Math.max(345000, todayRevenue), orders: Math.max(2, todayOrders.length) },
  ];

  // Payment Breakdown
  const cashTotal = orders
    .filter((o) => o.paymentMethod === 'CASH' && o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const bankTotal = orders
    .filter((o) => o.paymentMethod === 'BANK_TRANSFER' && o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const paymentData = [
    { name: 'Tiền mặt', value: cashTotal, color: '#10b981' },
    { name: 'Chuyển khoản (VietQR)', value: bankTotal, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 pb-2">
        <div>
          <p className="page-eyebrow mb-2">Trung tâm điều hành</p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-white">
              Tổng quan hoạt động
            </h1>
            
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Xin chào, {currentUser?.fullName}. Theo dõi hoạt động câu lạc bộ tại một nơi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/pos">
            <Button variant="emerald" size="sm" leftIcon={<Coffee className="w-4 h-4" />}>
              Bán Hàng POS
            </Button>
          </Link>
          {runningTour ? (
            <Link to={`/tours/clock/${runningTour.id}`}>
              <Button
                variant="gold"
                size="sm"
                leftIcon={<Clock className="w-4 h-4" />}
                className=""
              >
                Mở Đồng Hồ Tour Clock
              </Button>
            </Link>
          ) : (
            <Link to="/tours">
              <Button variant="secondary" size="sm" leftIcon={<Trophy className="w-4 h-4" />}>
                Xem Giải Đấu
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatsCard
          title="Doanh Thu Hôm Nay"
          value={formatVND(todayRevenue)}
          change={{ value: '+14.5%', isPositive: true }}
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          iconBgColor="bg-emerald-500/10 text-emerald-400"
          glow="green"
        />

        <StatsCard
          title="Đơn Hàng Cafe"
          value={todayOrders.length}
          subValue="Hóa đơn hoàn tất hôm nay"
          icon={<ShoppingBag className="w-5 h-5 text-sky-400" />}
          iconBgColor="bg-sky-500/10 text-sky-400"
        />

        <StatsCard
          title="Tour Đang Chạy"
          value={runningTour ? '1 Đang Chạy' : '0 Đang Chạy'}
          subValue={runningTour ? runningTour.name : 'Không có giải trực tiếp'}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          iconBgColor="bg-amber-500/10 text-amber-400"
          glow={runningTour ? 'gold' : 'none'}
        />

        <StatsCard
          title="Tổng Hội Viên"
          value={leaderboard.length + 3}
          subValue="Người chơi có xếp hạng"
          icon={<Users className="w-5 h-5 text-purple-400" />}
          iconBgColor="bg-purple-500/10 text-purple-400"
        />

        <StatsCard
          title="Ca Hoạt Động"
          value={activeShift ? activeShift.shiftName.split(' ')[0] : 'Chưa Mở'}
          subValue={activeShift ? activeShift.cashierName : 'Vui lòng mở ca'}
          icon={<Trophy className="w-5 h-5 text-emerald-400" />}
          iconBgColor="bg-emerald-500/10 text-emerald-400"
        />

        <StatsCard
          title="Duyệt Điểm Chờ"
          value={pendingRequests.length}
          subValue="Yêu cầu cần Admin duyệt"
          icon={<Coins className="w-5 h-5 text-amber-400" />}
          iconBgColor="bg-amber-500/10 text-amber-400"
          glow={pendingRequests.length > 0 ? 'gold' : 'none'}
        />
      </div>

      {/* Main Charts & Running Tour Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Doanh thu 7 ngày qua
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Biểu đồ thống kê doanh thu dịch vụ Cafe và đồ uống theo ngày
              </p>
            </div>
            <Link to="/reports" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="h-72" role="img" aria-label="Biểu đồ doanh thu dịch vụ trong 7 ngày qua">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#a5b4c5" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#a5b4c5"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [formatVND(Number(value) || 0), 'Doanh thu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right 1 Col: Payment Method Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Phương thức thanh toán</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Phân bổ Tiền Mặt vs Chuyển Khoản VietQR</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-72">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatVND(Number(val) || 0), 'Doanh thu']}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-around gap-3 w-full mt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Tiền mặt: {formatVND(cashTotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-300">VietQR: {formatVND(bankTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currently Running Tour Highlight (if any) */}
      {runningTour && (
        <Card variant="table" className="p-5 border-emerald-800/60 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 " />
                <StatusBadge status="RUNNING" label="TOUR ĐANG TRỰC TIẾP" />
                <span className="text-xs text-slate-400 font-mono">[{runningTour.code}]</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">{runningTour.name}</h2>
              <div className="text-xs text-slate-300 flex flex-wrap gap-4 pt-1">
                <span>
                  Giai đoạn hiện tại:{' '}
                  <strong className="text-emerald-400">
                    {runningTour.structure.stages[runningTour.currentStageIndex]?.name || 'Level 1'}
                  </strong>
                </span>
                <span>
                  Blinds:{' '}
                  <strong className="text-amber-400">
                    {runningTour.structure.stages[runningTour.currentStageIndex]?.smallBlind || 100} /{' '}
                    {runningTour.structure.stages[runningTour.currentStageIndex]?.bigBlind || 200}
                  </strong>
                </span>
                <span>
                  Hội viên tham gia:{' '}
                  <strong className="text-slate-100">{runningTour.participants.length} người</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to={`/tours/clock/${runningTour.id}`}>
                <Button
                  variant="gold"
                  size="md"
                  leftIcon={<Clock className="w-4 h-4" />}
                  className=" font-bold"
                >
                  Điều Khiển Đồng Hồ Clock
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Bottom 2 Columns: Pending Approvals & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Point Approvals Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                <Coins className="w-4 h-4 text-amber-400" />
                Yêu cầu chờ duyệt
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Phê duyệt điểm thưởng giải đấu hoặc điểm điều chỉnh cho hội viên
              </p>
            </div>
            <Link to="/points" className="text-xs text-emerald-400 hover:underline">
              Xem tất cả ({pendingRequests.length})
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div role="status" className="py-8 text-center text-slate-500 text-xs">
                Không có yêu cầu duyệt điểm nào đang chờ xử lý.
              </div>
            ) : (
              pendingRequests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{req.playerName}</span>
                      <span className={`font-bold ${req.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {req.amount > 0 ? `+${req.amount}` : req.amount} điểm
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate max-w-xs">{req.reason}</p>
                    <p className="text-slate-500 text-[10px]">Đề xuất bởi: {req.requestedBy.name}</p>
                  </div>

                  {currentUser?.role === 'ADMIN' ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          approveRequest(req.id, currentUser.id, currentUser.fullName, 'Duyệt nhanh từ Dashboard')
                        }
                        className="min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                        title="Duyệt yêu cầu"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          rejectRequest(req.id, currentUser.id, currentUser.fullName, 'Từ chối từ Dashboard')
                        }
                        className="min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        title="Từ chối"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <StatusBadge status="PENDING" />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent POS Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                <Coffee className="w-4 h-4 text-emerald-400" />
                Hóa đơn gần đây
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">Các giao dịch thanh toán bàn gần nhất</p>
            </div>
            <Link to="/pos" className="text-xs text-emerald-400 hover:underline">
              Vào POS Bán Hàng
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentOrders.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Chưa có hóa đơn. Các giao dịch mới sẽ xuất hiện tại đây.</p>}
            {recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedReceiptOrder(order)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedReceiptOrder(order); } }}
                className="p-3 bg-slate-900/80 hover:bg-slate-800/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{order.orderNumber}</span>
                    <span className="text-slate-400 font-mono">({order.tableNumber})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {order.customerName} • {formatDateTime(order.createdAt)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-emerald-400">{formatVND(order.totalAmount)}</div>
                  <div className="text-[10px] text-slate-400">
                    {order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'VietQR'}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              <Trophy className="w-4 h-4 text-amber-400" />
              Hội viên dẫn đầu
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Điểm xếp hạng thể thao trí tuệ phong trào của câu lạc bộ
            </p>
          </div>
          <Link to="/leaderboard" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
            Xem toàn bộ bảng hạng <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium pb-2">
                  <th className="py-2.5 px-3">Hạng</th>
                  <th className="py-2.5 px-3">Hội viên</th>
                  <th className="py-2.5 px-3">Hạng bậc</th>
                  <th className="py-2.5 px-3 text-center">Tour tham gia</th>
                  <th className="py-2.5 px-3 text-center">Vô địch</th>
                  <th className="py-2.5 px-3 text-right">Điểm tích lũy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard.slice(0, 5).map((player) => (
                  <tr key={player.playerId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                          player.rank === 1
                            ? 'bg-amber-400 text-slate-950 '
                            : player.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : player.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {player.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {player.playerName}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={player.tier} />
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{player.totalToursPlayed}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{player.toursWon}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400 text-sm">
                      {formatNumber(player.currentPoints)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />
    </div>
  );
};

