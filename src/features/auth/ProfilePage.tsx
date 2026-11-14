import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { ChangePasswordModal } from './ChangePasswordModal';
import { formatNumber, formatDate } from '../../utils/formatters';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Check,
  Trophy,
  Coins,
  Crown,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useAuthStore();
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isSaved, setIsSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ fullName, email, phone, avatar });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Hồ Sơ Cá Nhân</h1>
        <p className="text-sm text-slate-400">
          Xem và quản lý thông tin tài khoản, cấp bậc hội viên và bảo mật
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Avatar & Summary */}
        <Card className="p-6 text-center space-y-4">
          <div className="relative inline-block mx-auto">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
              alt={fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/50 shadow-xl mx-auto"
            />
            <div className="absolute bottom-0 right-0 p-1.5 bg-slate-900 rounded-full border border-slate-700">
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100">{currentUser?.fullName}</h3>
            <p className="text-xs text-slate-400 font-mono">@{currentUser?.username}</p>
            <div className="mt-2 flex justify-center gap-1.5">
              <StatusBadge status={currentUser?.role || 'PLAYER'} />
              {currentUser?.playerStats && (
                <StatusBadge status={currentUser.playerStats.rankTier} />
              )}
            </div>
          </div>

          {currentUser?.playerStats && (
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 text-left bg-surface p-3 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> Điểm Tích Lũy
                </span>
                <span className="text-base font-bold text-amber-400">
                  {formatNumber(currentUser.playerStats.currentPoints)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Tour Vô Địch
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {currentUser.playerStats.toursWon} / {currentUser.playerStats.totalToursPlayed}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              leftIcon={<KeyRound className="w-4 h-4" />}
              onClick={() => setShowPasswordModal(true)}
            >
              Đổi Mật Khẩu
            </Button>
          </div>
        </Card>

        {/* Right Card: Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thông Tin Chi Tiết</CardTitle>
            <CardDescription>Cập nhật số điện thoại và thông tin liên hệ của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  label="Tên đăng nhập (Username)"
                  value={currentUser?.username}
                  disabled
                  helperText="Tên đăng nhập cố định"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email liên lạc"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              <Input
                label="Đường dẫn ảnh đại diện (Avatar URL)"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
              />

              <div className="p-3 bg-surface rounded-xl border border-slate-800 text-xs flex justify-between items-center text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Trạng thái tài khoản:
                </span>
                <span className="font-semibold text-emerald-400">Đã Kích Hoạt (Hoạt Động)</span>
                <span>Ngày tạo: {formatDate(currentUser?.createdAt)}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                {isSaved && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Đã lưu thông tin
                  </span>
                )}
                <Button variant="primary" type="submit">
                  Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

