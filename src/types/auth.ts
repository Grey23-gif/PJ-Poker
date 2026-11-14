export type UserRole = 'ADMIN' | 'CASHIER' | 'PLAYER';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  // Specific role attributes
  playerStats?: {
    currentPoints: number;
    totalToursPlayed: number;
    toursWon: number;
    rankTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  };
  cashierShiftId?: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface RolePermissionConfig {
  role: UserRole;
  name: string;
  description: string;
  permissions: string[]; // Permission codes
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

