import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { changePassword } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!oldPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      changePassword(oldPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" title="Đổi Mật Khẩu">
      {success ? (
        <div className="py-6 text-center space-y-2 animate-fade-in">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h4 className="text-base font-semibold text-slate-100">Đổi Mật Khẩu Thành Công!</h4>
          <p className="text-xs text-slate-400">Mật khẩu mới của bạn đã được cập nhật.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mật khẩu hiện tại"
            type={showPassword ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Input
            label="Mật khẩu mới"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Input
            label="Xác nhận mật khẩu mới"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Cập Nhật Mật Khẩu
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

