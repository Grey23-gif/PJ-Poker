import React, { useState } from 'react';
import { usePointsStore } from '../../stores/pointsStore';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { PointAdjustmentModal } from './PointAdjustmentModal';
import { Modal } from '../../components/ui/Modal';
import { PointRequest } from '../../types/points';
import { formatNumber, formatDateTime } from '../../utils/formatters';
import {
  Coins,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Info,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PointsManagementPage: React.FC = () => {
  const { requests, transactions, approveRequest, rejectRequest, leaderboard } = usePointsStore();
  const { currentUser, hasPermission } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY' | 'TRANSACTIONS'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<PointRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';
  const isPlayer = currentUser?.role === 'PLAYER';
  const canRequest = isAdmin || currentUser?.role === 'CASHIER' || hasPermission('POINT_REQUEST');

  // Filter requests based on role
  const visibleRequests = isPlayer
    ? requests.filter((r) => r.playerId === currentUser.id)
    : requests;

  const pendingRequests = visibleRequests.filter((r) => r.status === 'PENDING');

  const filteredRequests = visibleRequests.filter((r) => {
    const matchesSearch =
      r.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const visibleTransactions = isPlayer
    ? transactions.filter((t) => t.playerId === currentUser.id)
    : transactions;

  const handleApprove = (req: PointRequest) => {
    if (!isAdmin) return;
    approveRequest(req.id, currentUser.id, currentUser.fullName, 'Phê duyệt hợp lệ');
  };

  const handleConfirmReject = () => {
    if (!rejectingRequest || !isAdmin) return;
    rejectRequest(
      rejectingRequest.id,
      currentUser.id,
      currentUser.fullName,
      rejectNotes || 'Từ chối bởi Quản trị viên'
    );
    setRejectingRequest(null);
    setRejectNotes('');
  };

  const tabsConfig = [
    {
      id: 'PENDING',
      label: 'Yêu Cầu Chờ Duyệt',
      badge: pendingRequests.length,
      icon: <Clock className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'HISTORY',
      label: 'Lịch Sử Tất Cả Yêu Cầu',
      icon: <ShieldCheck className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'TRANSACTIONS',
      label: 'Nhật Ký Biến Động Điểm',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex flex-wrap items-center gap-2">
            Quản Lý & Duyệt Điểm Thưởng Hội Viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Hệ thống tính điểm xếp hạng phong trào Poker Club, quy trình duyệt thưởng minh bạch
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/leaderboard">
            <Button variant="outline" size="sm">
              Xem Bảng Xếp Hạng
            </Button>
          </Link>
          {canRequest && (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAdjustModalOpen(true)}
            >
              Tạo Yêu Cầu Điều Chỉnh Điểm
            </Button>
          )}
        </div>
      </div>

      {/* Legal & Policy Disclaimer Banner */}
      <div className="p-3.5 bg-surface border border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
        <Info className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-amber-200">Quy Định Quản Lý Điểm Thưởng Thể Thao Phong Trào:</strong>
          <p className="text-slate-300 text-xs leading-relaxed">
            Điểm tích lũy câu lạc bộ Poker là điểm số xếp hạng thành tích giải trí phi thương mại, tôn vinh kỹ năng thi đấu và đóng góp cộng đồng. Điểm số tuyệt đối <strong>KHÔNG CÓ GIÁ TRỊ QUY ĐỔI</strong> thành tiền mặt hoặc các hiện vật dưới bất kỳ hình thức nào.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {/* Search Input */}
      <div className="w-full sm:w-80">
        <Input
          aria-label="Tìm theo mã yêu cầu, tên hội viên, lý do..."
              placeholder="Tìm theo mã yêu cầu, tên hội viên, lý do..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* TAB 1: PENDING REQUESTS */}
      {activeTab === 'PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Clock className="w-4 h-4 text-amber-400" />
              Danh Sách Yêu Cầu Chờ Admin Duyệt ({pendingRequests.length})
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Các điểm thưởng/phạt đang ở trạng thái chờ duyệt và chưa ảnh hưởng đến số dư chính thức
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">Mã yêu cầu</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Hội viên</th>
                    <th className="py-3 px-4">Điểm điều chỉnh</th>
                    <th className="py-3 px-4">Lý do & Căn cứ</th>
                    <th className="py-3 px-4">Người đề xuất</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    {isAdmin && <th className="py-3 px-4 text-center">Thao tác duyệt</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Tuyệt vời! Hiện không có yêu cầu duyệt điểm nào đang tồn đọng.
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {req.code}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{formatDateTime(req.createdAt)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {req.playerName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono font-semibold text-sm ${
                              req.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {req.amount > 0 ? `+${formatNumber(req.amount)}` : formatNumber(req.amount)} điểm
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs">{req.reason}</td>
                        <td className="py-3 px-4 text-slate-400">
                          <div>{req.requestedBy.name}</div>
                          <div className="text-xs text-slate-500">({req.requestedBy.role})</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={req.status} />
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="emerald"
                                size="sm"
                                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                                onClick={() => handleApprove(req)}
                              >
                                Duyệt
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                                onClick={() => setRejectingRequest(req)}
                              >
                                Từ Chối
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: REQUEST HISTORY */}
      {activeTab === 'HISTORY' && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch Sử Tất Cả Yêu Cầu Duyệt Điểm</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Toàn bộ đề xuất điểm kèm thông tin người duyệt và ghi chú phê duyệt
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">Mã</th>
                    <th className="py-3 px-4">Hội viên</th>
                    <th className="py-3 px-4">Điểm</th>
                    <th className="py-3 px-4">Lý do</th>
                    <th className="py-3 px-4">Người đề xuất</th>
                    <th className="py-3 px-4">Người duyệt & Ghi chú</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-slate-300 font-bold">{req.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{req.playerName}</td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={req.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {req.amount > 0 ? `+${formatNumber(req.amount)}` : formatNumber(req.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs">{req.reason}</td>
                      <td className="py-3 px-4 text-slate-400">{req.requestedBy.name}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {req.reviewedBy ? (
                          <div>
                            <span className="font-semibold text-slate-200">{req.reviewedBy.name}</span>
                            <div className="text-xs text-slate-400 italic">
                              "{req.reviewNotes}" • {formatDateTime(req.reviewedAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Chưa xử lý</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={req.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TRANSACTION LOG */}
      {activeTab === 'TRANSACTIONS' && (
        <Card>
          <CardHeader>
            <CardTitle>Nhật Ký Biến Động Số Dư Chính Thức</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Giao dịch điểm đã được cộng/trừ vào tài khoản người chơi sau khi được phê duyệt
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Hội viên</th>
                    <th className="py-3 px-4">Biến động</th>
                    <th className="py-3 px-4">Số dư sau GD</th>
                    <th className="py-3 px-4">Nội dung / Căn cứ</th>
                    <th className="py-3 px-4">Người thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {visibleTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Chưa có giao dịch biến động điểm nào.
                      </td>
                    </tr>
                  ) : (
                    visibleTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-slate-400">{formatDateTime(tx.createdAt)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{tx.playerName}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-sm">
                          <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {tx.amount > 0 ? `+${formatNumber(tx.amount)}` : formatNumber(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {formatNumber(tx.balanceAfter)} điểm
                        </td>
                        <td className="py-3 px-4 text-slate-300">{tx.description}</td>
                        <td className="py-3 px-4 text-slate-400">{tx.createdByName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Point Adjustment Modal */}
      <PointAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
      />

      {/* Rejection Notes Modal */}
      <Modal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        maxWidth="sm"
        title="Từ Chối Yêu Cầu Điểm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Bạn đang từ chối yêu cầu <strong>{rejectingRequest?.code}</strong> của hội viên{' '}
            <strong>{rejectingRequest?.playerName}</strong>. Vui lòng nêu rõ lý do:
          </p>
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            rows={3}
            placeholder="Nhập lý do từ chối (ví dụ: thiếu minh chứng giải đấu, số điểm không hợp lệ...)"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setRejectingRequest(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleConfirmReject}>
              Xác Nhận Từ Chối
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

