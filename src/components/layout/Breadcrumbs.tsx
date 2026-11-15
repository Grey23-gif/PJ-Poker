import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNameMap: Record<string, string> = {
  pos: 'Cafe POS Bán Hàng',
  tours: 'Giải Đấu Poker',
  clock: 'Giải đấu',
  'blind-structures': 'Cấu Trúc Blind',
  points: 'Quản Lý Điểm Hội Viên',
  leaderboard: 'Bảng Xếp Hạng',
  shifts: 'Quản Lý Ca Làm Việc',
  active: 'Ca Đang Hoạt Động',
  accounts: 'Quản Lý Tài Khoản',
  permissions: 'Ma Trận Phân Quyền',
  reports: 'Báo Cáo Doanh Thu',
  profile: 'Hồ Sơ Cá Nhân',
  player: 'Cổng Hội Viên',
  portal: 'Tổng Quan Cá Nhân',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (location.pathname === '/' || pathnames.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Đường dẫn trang" className="flex flex-wrap items-center gap-y-2 text-xs text-muted pt-2.5 px-[var(--page-padding)]">
      <Link to="/" className="flex items-center hover:text-content transition-colors">
        <Home className="w-3.5 h-3.5 mr-1 text-muted" />
        <span>Trang Chủ</span>
      </Link>

      {pathnames.map((segment, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNameMap[segment] || segment;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 mx-2 text-muted" />
            {isLast ? (
              <span aria-current="page" className="font-semibold text-success truncate max-w-[200px]">
                {displayName}
              </span>
            ) : (
              <Link to={segment === 'player' ? '/player/portal' : to} className="hover:text-content transition-colors">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

