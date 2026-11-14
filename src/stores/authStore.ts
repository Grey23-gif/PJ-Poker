import { create } from 'zustand';
import { User, UserRole } from '../types/auth';
import { INITIAL_USERS, INITIAL_ROLE_CONFIGS } from '../mocks/initialData';

interface AuthState {
  currentUser: User | null;
  users: User[];
  roleConfigs: typeof INITIAL_ROLE_CONFIGS;
  isAuthenticated: boolean;
  login: (username: string, role?: UserRole) => boolean;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
  updateProfile: (updated: Partial<User>) => void;
  changePassword: (oldPass: string, newPass: string) => { success: boolean; message: string };
  hasPermission: (permissionCode: string) => boolean;
  updateRolePermissions: (role: UserRole, permissions: string[]) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (id: string, updated: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
  resetUserPassword: (id: string) => string;
}

const STORAGE_KEY_AUTH = 'poker_cafe_auth_user';
const STORAGE_KEY_USERS = 'poker_cafe_users';
const STORAGE_KEY_ROLES = 'poker_cafe_roles';

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored user', e);
  }
  // Default to Admin demo account for convenience
  return INITIAL_USERS[0];
}

function loadStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored users', e);
  }
  return INITIAL_USERS;
}

function loadStoredRoles(): typeof INITIAL_ROLE_CONFIGS {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROLES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored roles', e);
  }
  return INITIAL_ROLE_CONFIGS;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialUser = loadStoredUser();
  const initialUsers = loadStoredUsers();
  const initialRoles = loadStoredRoles();

  return {
    currentUser: initialUser,
    users: initialUsers,
    roleConfigs: initialRoles,
    isAuthenticated: !!initialUser,

    login: (username: string, targetRole?: UserRole) => {
      const { users } = get();
      const found = users.find(
        (u) =>
          u.username.toLowerCase() === username.toLowerCase() ||
          (targetRole && u.role === targetRole)
      );
      if (found) {
        if (found.status === 'INACTIVE') {
          return false;
        }
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(found));
        set({ currentUser: found, isAuthenticated: true });
        return true;
      }
      return false;
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      set({ currentUser: null, isAuthenticated: false });
    },

    switchDemoRole: (role: UserRole) => {
      const { users } = get();
      const targetUser = users.find((u) => u.role === role && u.status === 'ACTIVE');
      if (targetUser) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(targetUser));
        set({ currentUser: targetUser, isAuthenticated: true });
      }
    },

    updateProfile: (updated: Partial<User>) => {
      const { currentUser, users } = get();
      if (!currentUser) return;
      const newUser = { ...currentUser, ...updated };
      const newUsers = users.map((u) => (u.id === currentUser.id ? newUser : u));
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
      set({ currentUser: newUser, users: newUsers });
    },

    changePassword: (_oldPass: string, _newPass: string) => {
      // Mock change password simulation
      return { success: true, message: 'Đổi mật khẩu thành công!' };
    },

    hasPermission: (permissionCode: string) => {
      const { currentUser, roleConfigs } = get();
      if (!currentUser) return false;
      if (currentUser.role === 'ADMIN') return true;
      const roleConfig = roleConfigs.find((r) => r.role === currentUser.role);
      if (!roleConfig) return false;
      return roleConfig.permissions.includes(permissionCode);
    },

    updateRolePermissions: (role: UserRole, permissions: string[]) => {
      const { roleConfigs } = get();
      const updated = roleConfigs.map((r) =>
        r.role === role ? { ...r, permissions } : r
      );
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(updated));
      set({ roleConfigs: updated });
    },

    addUser: (userData) => {
      const { users } = get();
      const newUser: User = {
        ...userData,
        id: `usr-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const newUsers = [newUser, ...users];
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
      set({ users: newUsers });
      return newUser;
    },

    updateUser: (id: string, updated: Partial<User>) => {
      const { users, currentUser } = get();
      const newUsers = users.map((u) => (u.id === id ? { ...u, ...updated } : u));
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
      set({ users: newUsers });
      if (currentUser && currentUser.id === id) {
        const updatedCurrentUser = { ...currentUser, ...updated };
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updatedCurrentUser));
        set({ currentUser: updatedCurrentUser });
      }
    },

    toggleUserStatus: (id: string) => {
      const { users } = get();
      const newUsers = users.map((u) =>
        u.id === id
          ? { ...u, status: u.status === 'ACTIVE' ? ('INACTIVE' as const) : ('ACTIVE' as const) }
          : u
      );
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
      set({ users: newUsers });
    },

    resetUserPassword: (id: string) => {
      const newPassword = `poker${Math.floor(1000 + Math.random() * 9000)}`;
      return newPassword;
    },
  };
});

