import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Eye, EyeOff, Lock, User, Sparkles, CheckCircle2, Spade } from 'lucide-react';
import { UserRole } from '../../types/auth';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuthStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const success = login(username.trim());
      if (success) {
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser?.role === 'ADMIN') navigate('/');
        else if (currentUser?.role === 'CASHIER') navigate('/pos');
        else navigate('/player/portal');
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác hoặc tài khoản bị khóa.');
      }
    }, 400);
  };

  const handleQuickDemo = (role: UserRole) => {
    switchDemoRole(role);
    if (role === 'ADMIN') navigate('/');
    else if (role === 'CASHIER') navigate('/pos');
    else navigate('/player/portal');
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface border border-emerald-500/40 shadow-2xl shadow-emerald-950/60 mb-2">
            <Spade className="w-8 h-8 text-emerald-300" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            ROYAL POKER CLUB
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Hệ Thống Quản Lý Cafe & Giải Đấu Poker Chuyên Nghiệp
          </p>
        </div>

        {/* 1-Click Demo Accounts Selector */}
        <div className="bg-surface border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" /> Tài khoản dùng thử:
            </span>
            <span className="text-xs text-slate-500 font-normal">Đăng nhập nhanh</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all  group"
            >
              <div className="text-xs font-bold text-amber-300">Quản trị</div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">Toàn quyền hệ thống</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('CASHIER')}
              className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-left transition-all  group"
            >
              <div className="text-xs font-bold text-sky-300">Thu ngân</div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">POS & Quản lý Ca</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('PLAYER')}
              className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all  group"
            >
              <div className="text-xs font-bold text-emerald-300">Hội viên</div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">Điểm & Bảng hạng</div>
            </button>
          </div>
        </div>

        {/* Standard Login Form */}
        <div className="bg-surface backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Tên đăng nhập"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin, cashier, player..."
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Mật khẩu"
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {error && (
              <p role="alert" className="text-xs text-rose-400 font-medium bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="emerald"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
            >
              Đăng Nhập Vào Hệ Thống
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Bảo mật hệ thống CLB Poker nội bộ & Giải trí
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

