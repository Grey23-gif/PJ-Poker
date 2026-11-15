import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { ALL_PERMISSIONS } from '../../mocks/initialData';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { ShieldCheck, Check, Save, RotateCcw, History, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types/auth';

export const RoleMatrixPage: React.FC = () => {
  const { roleConfigs, updateRolePermissions, currentUser } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('CASHIER');
  const [activePermissions, setActivePermissions] = useState<string[]>(
    roleConfigs.find((r) => r.role === 'CASHIER')?.permissions || []
  );
  const [isSaved, setIsSaved] = useState(false);
  const [auditLogs, setAuditLogs] = useState<{ id: string; user: string; text: string; time: string }[]>([
    {
      id: 'log-1',
      user: 'Nguyễn Văn Quản Lý (Admin)',
      text: 'Đã cấp quyền POS_PRODUCT_MANAGE cho nhóm Thu Ngân',
      time: '2026-11-12 14:20',
    },
    {
      id: 'log-2',
      user: 'Nguyễn Văn Quản Lý (Admin)',
      text: 'Khởi tạo ma trận phân quyền hệ thống chuẩn v2.5',
      time: '2026-11-10 09:00',
    },
  ]);

  // Synchronize when selectedRole changes
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const config = roleConfigs.find((r) => r.role === role);
    setActivePermissions(config?.permissions || []);
    setIsSaved(false);
  };

  const togglePermission = (code: string) => {
    if (selectedRole === 'ADMIN') return; // Admin always retains all permissions
    if (activePermissions.includes(code)) {
      setActivePermissions(activePermissions.filter((p) => p !== code));
    } else {
      setActivePermissions([...activePermissions, code]);
    }
    setIsSaved(false);
  };

  const handleSave = () => {
    updateRolePermissions(selectedRole, activePermissions);
    setIsSaved(true);
    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        user: currentUser?.fullName || 'Admin',
        text: `Đã cập nhật quyền hạn cho vai trò ${selectedRole} (${activePermissions.length} quyền kích hoạt)`,
        time: new Date().toLocaleString('vi-VN'),
      },
      ...auditLogs,
    ]);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Group permissions by module
  const modules = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.module)));

  return (
    <div className="space-y-[var(--section-gap)] max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="page-title text-2xl font-semibold text-content flex flex-wrap items-center gap-2">
          Ma Trận Phân Quyền & Vai Trò
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Thiết lập quyền truy cập chi tiết từng phân hệ cho Quản Trị Viên, Thu Ngân và Hội Viên
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {roleConfigs.map((config) => {
          const isSelected = selectedRole === config.role;
          return (
            <div
              key={config.role}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleRoleSelect(config.role); } }}
              onClick={() => handleRoleSelect(config.role)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-success/10 border-emerald-500'
                  : 'bg-surface border-line hover:border-line-strong'
              }`}
            >
              <div className="flex items-center justify-between">
                <StatusBadge status={config.role} />
                <span className="text-xs text-muted font-mono">
                  {config.permissions.length} quyền
                </span>
              </div>
              <h4 className="font-bold text-content text-sm mt-2">{config.name}</h4>
              <p className="text-xs text-muted mt-1 line-clamp-2">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Permission Matrix Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>
              <ShieldCheck className="w-5 h-5 text-success" />
              Chi Tiết Quyền Của Vai Trò: {selectedRole}
            </CardTitle>
            <p className="text-xs text-muted mt-1">
              Bật hoặc tắt các chức năng cụ thể để kiểm soát phân quyền thời gian thực
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSaved && (
              <span className="text-xs text-success font-medium flex items-center gap-1 animate-fade-in">
                <Check className="w-4 h-4" /> Đã cập nhật thành công!
              </span>
            )}
            <Button
              variant="emerald"
              size="sm"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSave}
              disabled={selectedRole === 'ADMIN'}
            >
              Lưu Cấu Hình Quyền
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-[var(--section-gap)]">
          {selectedRole === 'ADMIN' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-warning flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
              <span>
                Quản Trị Viên (Admin) mặc định có toàn quyền truy cập tất cả các phân hệ và không thể hủy kích hoạt.
              </span>
            </div>
          )}

          {modules.map((moduleName) => {
            const modulePerms = ALL_PERMISSIONS.filter((p) => p.module === moduleName);

            return (
              <div key={moduleName} className="space-y-2">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-line">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Phân Hệ: {moduleName}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {modulePerms.map((perm) => {
                    const isChecked =
                      selectedRole === 'ADMIN' || activePermissions.includes(perm.code);

                    return (
                      <label
                        key={perm.id}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                          selectedRole === 'ADMIN'
                            ? 'bg-field/40 border-line cursor-not-allowed opacity-80'
                            : isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 cursor-pointer'
                            : 'bg-surface border-line hover:border-line-strong cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={selectedRole === 'ADMIN'}
                          onChange={() => togglePermission(perm.code)}
                          aria-label={perm.name}
                          className="mt-0.5 rounded text-success focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="space-y-0.5">
                          <span className="block font-semibold text-content">{perm.name}</span>
                          <span className="block font-mono text-xs text-muted">[{perm.code}]</span>
                          <span className="block text-xs text-muted mt-1">{perm.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Permission Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>
            <History className="w-4 h-4 text-muted" />
            Nhật Ký Thay Đổi Phân Quyền (Audit Trail)
          </CardTitle>
          <p className="text-xs text-muted mt-0.5">
            Ghi nhận các lượt điều chỉnh vai trò và quyền hạn quản trị
          </p>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-surface rounded-xl border border-line flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-content">{log.user}: </span>
                <span className="text-secondary">{log.text}</span>
              </div>
              <span className="text-xs text-muted shrink-0 ml-2">{log.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

