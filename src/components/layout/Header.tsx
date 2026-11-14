import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Clock, LogOut, User, Shield, Menu, ChevronDown, FlaskConical } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTournamentStore } from '../../stores/tournamentStore';
import { useShiftStore } from '../../stores/shiftStore';
import { usePointsStore } from '../../stores/pointsStore';
import { UserRole } from '../../types/auth';

const roleNames: Record<UserRole, string> = { ADMIN: 'Quản trị viên', CASHIER: 'Thu ngân', PLAYER: 'Hội viên' };
const pageNames: Record<string, string> = { pos: 'Quầy bán hàng', tours: 'Giải đấu Poker', points: 'Điểm hội viên', leaderboard: 'Bảng xếp hạng', shifts: 'Ca làm việc', accounts: 'Tài khoản', permissions: 'Phân quyền', reports: 'Báo cáo doanh thu', profile: 'Hồ sơ cá nhân', player: 'Cổng hội viên' };

export const Header: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const { currentUser, switchDemoRole, logout } = useAuthStore();
  const { tournaments } = useTournamentStore();
  const { activeShift } = useShiftStore();
  const { requests } = usePointsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const runningTour = tournaments.find((tour) => tour.status === 'RUNNING');
  const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
  const closeMenus = () => headerRef.current?.querySelectorAll('details[open]').forEach((menu) => menu.removeAttribute('open'));

  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!headerRef.current?.contains(event.target as Node)) closeMenus(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { const menu = headerRef.current?.querySelector('details[open]'); menu?.removeAttribute('open'); menu?.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);

  const switchRole = (role: UserRole) => {
    switchDemoRole(role);
    closeMenus();
    navigate(role === 'ADMIN' ? '/' : role === 'CASHIER' ? '/pos' : '/player/portal');
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-30 h-20 bg-[#0c141f] border-b border-surface-border px-4 sm:px-6 xl:px-8 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onToggleSidebar} aria-label="Mở điều hướng" className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-300 hover:bg-surface-hover lg:hidden"><Menu className="w-5 h-5" /></button>
        <div className="hidden sm:block min-w-0">
          <p className="text-sm font-semibold truncate">{pageNames[location.pathname.split('/')[1]] || 'Tổng quan câu lạc bộ'}</p>
          <p className="text-xs text-slate-400">Royal Poker Club</p>
        </div>
        {runningTour && <Link to={`/tours/clock/${runningTour.id}`} title={runningTour.name} className="hidden xl:flex items-center gap-2 border-l border-surface-border ml-3 pl-5 text-xs text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><Clock className="w-3.5 h-3.5" /><span className="max-w-40 truncate">{runningTour.name}</span></Link>}
        {activeShift && <Link to="/shifts/active" className="hidden 2xl:flex items-center gap-2 text-xs text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-[#d8b56c]" />{activeShift.shiftName}</Link>}
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <details className="relative group">
          <summary className="list-none cursor-pointer min-h-11 flex items-center gap-2 px-3 rounded-lg border border-surface-border text-xs text-slate-300 hover:bg-surface-hover [&::-webkit-details-marker]:hidden" aria-label="Chuyển vai trò dùng thử">
            <FlaskConical className="w-4 h-4 text-[#d8b56c]" /><span className="hidden md:inline">Dùng thử</span><ChevronDown className="w-3.5 h-3.5" />
          </summary>
          <div className="absolute right-0 mt-3 w-56 surface-card p-2 shadow-2xl">
            <p className="text-xs text-slate-400 px-3 py-2">Chọn vai trò dùng thử</p>
            {(['ADMIN', 'CASHIER', 'PLAYER'] as UserRole[]).map((role) => <button key={role} onClick={() => switchRole(role)} aria-pressed={currentUser?.role === role} className={`w-full text-left min-h-11 px-3 rounded-lg text-sm hover:bg-surface-hover ${currentUser?.role === role ? 'text-emerald-300 bg-emerald-500/10' : 'text-slate-300'}`}>{roleNames[role]}</button>)}
          </div>
        </details>
        {currentUser?.role !== 'PLAYER' && <Link to="/points" aria-label={`${pendingCount} yêu cầu duyệt điểm đang chờ`} className="relative min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:bg-surface-hover"><Bell className="w-5 h-5" />{pendingCount > 0 && <span className="absolute top-0 right-0 min-w-4 h-4 px-1 text-[10px] leading-4 text-center rounded-full bg-[#d8b56c] text-slate-950">{pendingCount}</span>}</Link>}
        <details className="relative border-l border-surface-border pl-2 sm:pl-4">
          <summary className="list-none cursor-pointer flex items-center gap-3 min-h-11 [&::-webkit-details-marker]:hidden" aria-label="Tùy chọn tài khoản">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-sm font-semibold">{currentUser?.fullName.split(' ').slice(-1)[0]?.slice(0, 1)}</div>
            <div className="hidden md:block text-left max-w-40"><p className="text-xs font-semibold truncate">{currentUser?.fullName}</p><p className="text-xs text-slate-400">{currentUser && roleNames[currentUser.role]}</p></div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </summary>
          <div className="absolute right-0 mt-3 w-56 surface-card p-2 shadow-2xl text-sm">
            <Link to="/profile" onClick={closeMenus} className="min-h-11 px-3 flex items-center gap-2 rounded-lg hover:bg-surface-hover"><User className="w-4 h-4" />Hồ sơ cá nhân</Link>
            {currentUser?.role === 'ADMIN' && <Link to="/permissions" onClick={closeMenus} className="min-h-11 px-3 flex items-center gap-2 rounded-lg hover:bg-surface-hover"><Shield className="w-4 h-4" />Phân quyền vai trò</Link>}
            <button onClick={() => { closeMenus(); logout(); navigate('/login'); }} className="min-h-11 px-3 w-full flex items-center gap-2 rounded-lg text-rose-300 hover:bg-rose-500/10"><LogOut className="w-4 h-4" />Đăng xuất</button>
          </div>
        </details>
      </div>
    </header>
  );
};
