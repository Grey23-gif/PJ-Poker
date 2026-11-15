import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { User, UserRole } from '../../types/auth';
import { useAuthStore } from '../../stores/authStore';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
}) => {
  const { addUser, updateUser } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('PLAYER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [initialPoints, setInitialPoints] = useState('1000');
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.fullName);
      setUsername(userToEdit.username);
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone);
      setRole(userToEdit.role);
      setStatus(userToEdit.status);
      setInitialPoints(String(userToEdit.playerStats?.currentPoints || 0));
    } else {
      setFullName('');
      setUsername('');
      setEmail('');
      setPhone('');
      setRole('PLAYER');
      setStatus('ACTIVE');
      setInitialPoints('1000');
    }
    setError('');
  }, [userToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !username.trim()) {
      setError('Vui lòng nhập họ tên và tên đăng nhập');
      return;
    }

    if (userToEdit) {
      updateUser(userToEdit.id, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        status,
        playerStats:
          role === 'PLAYER'
            ? {
                currentPoints: Number(initialPoints) || 0,
                totalToursPlayed: userToEdit.playerStats?.totalToursPlayed || 0,
                toursWon: userToEdit.playerStats?.toursWon || 0,
                rankTier: userToEdit.playerStats?.rankTier || 'BRONZE',
              }
            : undefined,
      });
    } else {
      addUser({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim() || `${username.trim().toLowerCase()}@pokerclub.vn`,
        phone: phone.trim() || '0900000000',
        role,
        status,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        playerStats:
          role === 'PLAYER'
            ? {
                currentPoints: Number(initialPoints) || 0,
                totalToursPlayed: 0,
                toursWon: 0,
                rankTier: 'BRONZE',
              }
            : undefined,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={userToEdit ? 'Chỉnh Sửa Thông Tin Tài Khoản' : 'Tạo Mới Tài Khoản Hệ Thống'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--component-gap)]">
          <Input
            label="Họ và tên *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A..."
          />
          <Input
            label="Tên đăng nhập (Username) *"
            value={username}
            disabled={!!userToEdit}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="nguyenvana..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--component-gap)]">
          <Input
            label="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@pokerclub.vn"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--component-gap)]">
          <Select
            label="Vai trò (Role) *"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="PLAYER">Người chơi (Player / Hội viên)</option>
            <option value="CASHIER">Thu ngân (Cashier)</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
          </Select>

          <Select
            label="Trạng thái tài khoản"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="INACTIVE">Khóa tạm thời (Inactive)</option>
          </Select>
        </div>

        {role === 'PLAYER' && (
          <Input
            label="Điểm tích lũy khởi điểm (Points)"
            type="number"
            value={initialPoints}
            onChange={(e) => setInitialPoints(e.target.value)}
            placeholder="1000"
          />
        )}

        {error && <p className="text-xs text-danger font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button variant="primary" type="submit">
            {userToEdit ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

