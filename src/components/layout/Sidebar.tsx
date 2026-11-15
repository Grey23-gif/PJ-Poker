import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTournamentStore } from '../../stores/tournamentStore';
import {
  LayoutDashboard,
  Coffee,
  Trophy,
  Clock,
  Coins,
  Users,
  ShieldCheck,
  CalendarCheck,
  BarChart3,
  X,
  Sparkles,
  ChevronRight,
  Sliders,
  Spade,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, hasPermission } = useAuthStore();
  const { tournaments } = useTournamentStore();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button') || []).filter((element) => element.getClientRects().length > 0);
    controls()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [isOpen, onClose]);

  const runningTour = tournaments.find((t) => t.status === 'RUNNING');

  // Navigation Items defined with role/permission guards
  const navSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        {
          label: 'Bảng Điều Khiển',
          to: currentUser?.role === 'PLAYER' ? '/player/portal' : '/',
          icon: <LayoutDashboard className="w-5 h-5" />,
          show: true,
        },
      ],
    },
    {
      title: 'CAFE & BÁN HÀNG',
      items: [
        {
          label: 'Cafe POS Bán Hàng',
          to: '/pos',
          icon: <Coffee className="w-5 h-5" />,
          show: currentUser?.role === 'ADMIN' || hasPermission('POS_ORDER'),
          badge: undefined,
        },
      ],
    },
    {
      title: 'GIẢI ĐẤU POKER',
      items: [
        {
          label: 'Quản Lý Giải Đấu',
          to: '/tours',
          icon: <Trophy className="w-5 h-5" />,
          show: true,
        },
        {
          label: 'Giải đấu',
          to: '/tours/clock',
          icon: <Clock className="w-5 h-5" />,
          show: true,
          highlight: !!runningTour,
          badge: runningTour ? 'Trực tiếp' : undefined,
        },
        {
          label: 'Cấu Trúc Blind',
          to: '/tours/blind-structures',
          icon: <Sliders className="w-5 h-5" />,
          show: currentUser?.role === 'ADMIN' || hasPermission('TOUR_MANAGE'),
        },
      ],
    },
    {
      title: 'ĐIỂM THƯỞNG HỘI VIÊN',
      items: [
        {
          label: currentUser?.role === 'PLAYER' ? 'Điểm Của Tôi' : 'Quản Lý & Duyệt Điểm',
          to: '/points',
          icon: <Coins className="w-5 h-5" />,
          show: true,
        },
        {
          label: 'Bảng Xếp Hạng',
          to: '/leaderboard',
          icon: <Sparkles className="w-5 h-5" />,
          show: true,
        },
        {
          label: 'Top Tour',
          to: '/points?tab=top-tour',
          icon: <Trophy className="w-5 h-5" />,
          show: currentUser?.role === 'ADMIN' || currentUser?.role === 'CASHIER',
        },
      ],
    },
    {
      title: 'QUẢN LÝ CA TRỰC',
      items: [
        {
          label: 'Ca Đang Hoạt Động',
          to: '/shifts/active',
          icon: <CalendarCheck className="w-5 h-5" />,
          show: currentUser?.role === 'ADMIN' || hasPermission('SHIFT_VIEW'),
        },
        {
          label: 'Lịch Sử & Bàn Giao Ca',
          to: '/shifts',
          icon: <CalendarCheck className="w-5 h-5" />,
          show: currentUser?.role === 'ADMIN' || hasPermission('SHIFT_VIEW'),
        },
      ],
    },
    {
      title: 'HỆ THỐNG & BÁO CÁO',
      items: [
        {
          label: 'Quản Lý Tài Khoản',
          to: '/accounts',
          icon: <Users className="w-5 h-5" />,
          show: currentUser?.role === 'ADMIN' || hasPermission('ACCOUNT_VIEW'),
        },
        {
          label: 'Phân Quyền Vai Trò',
          to: '/permissions',
          icon: <ShieldCheck className="w-5 h-5" />,
          show: currentUser?.role === 'ADMIN',
        },
        {
          label: 'Báo Cáo Doanh Thu',
          to: '/reports',
          icon: <BarChart3 className="w-5 h-5" />,
          show: currentUser?.role === 'ADMIN' || hasPermission('REPORT_VIEW'),
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        ref={sidebarRef}
        aria-label="Điều hướng câu lạc bộ"
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen || undefined}
        className={`app-sidebar fixed top-0 bottom-0 left-0 z-50 w-[var(--sidebar-width)] bg-navigation border-r border-line/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible'
        }`}
      >
        {/* Brand header */}
        <div className="h-[var(--app-header-height)] shrink-0 px-4 border-b border-line/80 flex items-center justify-between bg-canvas">
          <NavLink to="/" className="flex items-center gap-2 group min-w-0" onClick={onClose}>
            <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <Spade className="w-5 h-5 text-success" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide text-content flex items-center gap-1.5">
                ROYAL POKER
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-warning font-mono border border-amber-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-muted">Quản lý câu lạc bộ</div>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            aria-label="Đóng điều hướng"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-muted hover:text-content hover:bg-raised lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div aria-label="Điều hướng chính" className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-medium text-muted uppercase tracking-wider mb-2">
                  {section.title}
                </div>
                {visibleItems.map((item, iIdx) => {
                  const topTourSelected = location.pathname === '/points' && new URLSearchParams(location.search).get('tab') === 'top-tour';
                  const isActive = item.to === '/points?tab=top-tour'
                    ? topTourSelected
                    : item.to === '/points'
                    ? location.pathname === '/points' && !topTourSelected
                    : item.to.startsWith('/tours/clock')
                    ? location.pathname.startsWith('/tours/clock')
                    : item.to === '/tours'
                    ? location.pathname === '/tours'
                    : item.to === '/shifts'
                    ? location.pathname === '/shifts'
                    : item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={iIdx}
                      to={item.to}
                      aria-current={isActive ? 'page' : false}
                      onClick={onClose}
                      className={`group flex items-center justify-between min-h-[var(--nav-item-height)] px-2.5 py-[var(--nav-padding-y)] rounded-lg text-sm leading-5 font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-500/10 text-success border-l-2 border-emerald-400 font-semibold'
                          : 'border-l-2 border-transparent text-muted hover:text-content hover:bg-raised/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`transition-colors ${
                            isActive
                              ? 'text-success'
                              : 'text-muted group-hover:text-content'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.badge === 'Trực tiếp'
                                ? 'bg-emerald-500/10 text-success'
                                : 'bg-raised text-secondary'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-success" />}
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info card */}
        <div className="p-2 border-t border-line/80 bg-canvas">
          <div className="p-2.5 rounded-xl bg-field/80 border border-line flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-secondary">Royal Poker Cafe Club</div>
              <div className="text-[10px] text-muted">Bản phát hành v2.5.0</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-green" title="Hệ thống trực tuyến" />
          </div>
        </div>
      </aside>
    </>
  );
};

