import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { AccountFormModal } from './AccountFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { User, UserRole } from '../../types/auth';
import { formatDate, formatDateTime, formatNumber } from '../../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Filter,
  KeyRound,
  ShieldAlert,
  Edit2,
  Lock,
  Unlock,
  Check,
  Copy,
  Sparkles,
} from 'lucide-react';

export const AccountListPage: React.FC = () => {
  const { users, toggleUserStatus, resetUserPassword, currentUser } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ user: User; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleResetPassword = (user: User) => {
    const tempPass = resetUserPassword(user.id);
    setResetPasswordResult({ user, pass: tempPass });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex flex-wrap items-center gap-2">
            Quản Lý Tài Khoản Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Quản lý danh sách Quản trị viên, Thu ngân và Hội viên câu lạc bộ Poker
          </p>
        </div>

        <Button
          variant="gold"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setUserToEdit(null);
            setIsFormModalOpen(true);
          }}
        >
          Thêm Tài Khoản Mới
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3.5 rounded-2xl border border-slate-800">
        <div className="w-full sm:w-80">
          <Input
            aria-label="Tìm theo họ tên, username, SĐT, email..."
              placeholder="Tìm theo họ tên, username, SĐT, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Vai trò:</span>
            <select
              aria-label="Lọc theo vai trò"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">Tất cả vai trò ({users.length})</option>
              <option value="ADMIN">Quản trị viên ({users.filter(u => u.role === 'ADMIN').length})</option>
              <option value="CASHIER">Thu ngân ({users.filter(u => u.role === 'CASHIER').length})</option>
              <option value="PLAYER">Hội viên người chơi ({users.filter(u => u.role === 'PLAYER').length})</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Trạng thái:</span>
            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Đã khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tài khoản & Họ tên</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Thông tin hội viên</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Không tìm thấy tài khoản nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={user.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-slate-200">{user.fullName}</div>
                            <div className="font-mono text-xs text-slate-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-300">{user.phone}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={user.role} />
                      </td>

                      <td className="py-3 px-4">
                        {user.role === 'PLAYER' && user.playerStats ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={user.playerStats.rankTier} />
                              <span className="font-mono font-bold text-amber-400">
                                {formatNumber(user.playerStats.currentPoints)} điểm
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">
                              Tour: {user.playerStats.toursWon} vô địch / {user.playerStats.totalToursPlayed} tham gia
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Nhân viên nội bộ</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={user.status} />
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setUserToEdit(user);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                            title="Cấp lại mật khẩu mới"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => setUserToToggle(user)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                user.status === 'ACTIVE'
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}
                              title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            >
                              {user.status === 'ACTIVE' ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Account Create / Edit Modal */}
      <AccountFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
      />

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!userToToggle}
        onClose={() => setUserToToggle(null)}
        onConfirm={() => {
          if (userToToggle) toggleUserStatus(userToToggle.id);
        }}
        title={userToToggle?.status === 'ACTIVE' ? 'Khóa Tài Khoản' : 'Kích Hoạt Tài Khoản'}
        message={
          userToToggle?.status === 'ACTIVE'
            ? `Bạn có chắc muốn khóa tài khoản của ${userToToggle?.fullName}? Người dùng này sẽ không thể đăng nhập vào hệ thống.`
            : `Kích hoạt lại quyền truy cập cho tài khoản ${userToToggle?.fullName}?`
        }
        confirmText={userToToggle?.status === 'ACTIVE' ? 'Khóa Ngay' : 'Kích Hoạt'}
        variant={userToToggle?.status === 'ACTIVE' ? 'danger' : 'info'}
      />

      {/* Reset Password Modal Result */}
      <Modal
        isOpen={!!resetPasswordResult}
        onClose={() => setResetPasswordResult(null)}
        maxWidth="sm"
        title="Cấp Lại Mật Khẩu Thành Công"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100">
              {resetPasswordResult?.user.fullName}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Mật khẩu tạm thời mới đã được tạo cho tài khoản{' '}
              <strong>@{resetPasswordResult?.user.username}</strong>
            </p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between font-mono text-base font-bold text-emerald-400">
            <span>{resetPasswordResult?.pass}</span>
            <button
              onClick={() => copyToClipboard(resetPasswordResult?.pass || '')}
              className="text-slate-400 hover:text-white p-1"
              title="Sao chép mật khẩu"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Vui lòng gửi mật khẩu này cho người dùng và yêu cầu đổi mật khẩu sau khi đăng nhập.
          </p>

          <Button variant="primary" className="w-full" onClick={() => setResetPasswordResult(null)}>
            Đã Lưu & Hoàn Tất
          </Button>
        </div>
      </Modal>
    </div>
  );
};

