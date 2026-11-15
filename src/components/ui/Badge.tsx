import React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?:
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'blue'
    | 'purple'
    | 'slate'
    | 'gold'
    | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variants = {
    emerald: 'bg-emerald-500/15 text-success border-emerald-500/30',
    amber: 'bg-amber-500/15 text-warning border-amber-500/30',
    rose: 'bg-rose-500/15 text-danger border-rose-500/30',
    blue: 'bg-sky-500/15 text-info border-sky-500/30',
    purple: 'bg-purple-500/15 text-accent border-purple-500/30',
    gold: 'bg-[#d8b56c]/10 text-gold border-[#d8b56c]/30',
    slate: 'bg-raised text-secondary border-line-strong',
    outline: 'bg-transparent text-secondary border-line-strong',
  };

  const dotColors = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    blue: 'bg-sky-400',
    purple: 'bg-purple-400',
    gold: 'bg-yellow-400',
    slate: 'bg-slate-400',
    outline: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-xs leading-5 px-1.5 gap-1',
    md: 'text-xs leading-5 px-2 py-0.5 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md whitespace-nowrap border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; label?: string }> = ({
  status,
  label,
}) => {
  switch (status) {
    // Tour
    case 'RUNNING':
      return <Badge variant="emerald" dot>{label || 'Đang diễn ra'}</Badge>;
    case 'PAUSED':
      return <Badge variant="amber" dot>{label || 'Tạm dừng'}</Badge>;
    case 'CREATED':
      return <Badge variant="blue">{label || 'Sắp diễn ra'}</Badge>;
    case 'FINISHED':
    case 'COMPLETED':
      return <Badge variant="slate">{label || 'Đã kết thúc'}</Badge>;
    case 'CANCELLED':
      return <Badge variant="rose">{label || 'Đã hủy'}</Badge>;

    // Points request
    case 'PENDING':
      return <Badge variant="amber" dot>{label || 'Chờ duyệt'}</Badge>;
    case 'APPROVED':
      return <Badge variant="emerald">{label || 'Đã duyệt'}</Badge>;
    case 'REJECTED':
      return <Badge variant="rose">{label || 'Từ chối'}</Badge>;

    // Shifts
    case 'OPEN':
      return <Badge variant="emerald" dot>{label || 'Đang mở'}</Badge>;
    case 'CLOSED':
      return <Badge variant="slate">{label || 'Đã đóng'}</Badge>;

    // User status
    case 'ACTIVE':
      return <Badge variant="emerald">{label || 'Hoạt động'}</Badge>;
    case 'INACTIVE':
      return <Badge variant="rose">{label || 'Đã khóa'}</Badge>;

    // Roles
    case 'ADMIN':
      return <Badge variant="gold">Quản trị viên</Badge>;
    case 'CASHIER':
      return <Badge variant="blue">Thu ngân</Badge>;
    case 'PLAYER':
      return <Badge variant="emerald">Người chơi</Badge>;

    // Tiers
    case 'DIAMOND':
      return <Badge variant="gold">Kim cương</Badge>;
    case 'PLATINUM':
      return <Badge variant="purple">Bạch kim</Badge>;
    case 'GOLD':
      return <Badge variant="amber">Vàng</Badge>;
    case 'SILVER':
      return <Badge variant="slate">Bạc</Badge>;
    case 'BRONZE':
      return <Badge variant="outline">Đồng</Badge>;

    default:
      return <Badge variant="slate">{label || status}</Badge>;
  }
};

