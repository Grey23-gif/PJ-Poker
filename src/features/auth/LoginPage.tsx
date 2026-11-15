import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Eye, EyeOff, Lock, User, Sparkles, CheckCircle2, Spade } from 'lucide-react';
import { UserRole } from '../../types/auth';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

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
    <div className="login-page min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-8 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md space-y-[var(--section-gap)] relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface border border-emerald-500/40 mb-1">
            <Spade className="w-6 h-6 text-success" aria-hidden="true" />
          </div>
          <h1 className="page-title text-2xl sm:text-3xl font-semibold tracking-tight text-content">
            ROYAL POKER CLUB
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Hệ Thống Quản Lý Cafe & Giải Đấu Poker Chuyên Nghiệp
          </p>
        </div>

        {/* 1-Click Demo Accounts Selector */}
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-secondary">
            <span className="flex items-center gap-1.5 text-warning">
              <Sparkles className="w-3.5 h-3.5" /> Tài khoản dùng thử:
            </span>
            <span className="text-xs text-muted font-normal">Đăng nhập nhanh</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all  group"
            >
              <div className="text-xs font-bold text-warning">Quản trị</div>
              <div className="text-xs text-muted mt-0.5 truncate">Toàn quyền hệ thống</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('CASHIER')}
              className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-left transition-all  group"
            >
              <div className="text-xs font-bold text-info">Thu ngân</div>
              <div className="text-xs text-muted mt-0.5 truncate">POS & Quản lý Ca</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('PLAYER')}
              className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all  group"
            >
              <div className="text-xs font-bold text-success">Hội viên</div>
              <div className="text-xs text-muted mt-0.5 truncate">Điểm & Bảng hạng</div>
            </button>
          </div>
        </div>

        {/* Standard Login Form */}
        <div className="bg-surface border border-line rounded-2xl p-[var(--card-padding)] space-y-4">
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
                  className="text-muted hover:text-content"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {error && (
              <p role="alert" className="text-xs text-danger font-medium bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
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

          <div className="pt-2 border-t border-line text-center">
            <p className="text-xs text-muted flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Bảo mật hệ thống CLB Poker nội bộ & Giải trí
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

