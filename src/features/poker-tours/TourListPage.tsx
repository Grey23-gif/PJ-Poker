import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournamentStore } from '../../stores/tournamentStore';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { TourFormModal } from './TourFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Tournament, TourStatus } from '../../types/tournament';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import {
  Trophy,
  Plus,
  Clock,
  Play,
  Pause,
  Edit2,
  Trash2,
  Search,
  Users,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const TourListPage: React.FC = () => {
  const { tournaments, startTournament, pauseTournament, resumeTournament, deleteTournament } =
    useTournamentStore();
  const { currentUser, hasPermission } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [tourToEdit, setTourToEdit] = useState<Tournament | null>(null);
  const [tourToDelete, setTourToDelete] = useState<Tournament | null>(null);

  const canManage = currentUser?.role === 'ADMIN' || hasPermission('TOUR_MANAGE');
  const canOperate = currentUser?.role === 'ADMIN' || hasPermission('TOUR_OPERATE');

  const filteredTournaments = tournaments.filter((tour) => {
    const matchesSearch =
      tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || tour.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex flex-wrap items-center gap-2">
            Quản Lý Giải Đấu Poker
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Theo dõi, khởi tạo và điều hành giải đấu câu lạc bộ và đồng hồ giải đấu
          </p>
        </div>

        {canManage && (
          <Button
            variant="gold"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setTourToEdit(null);
              setIsFormModalOpen(true);
            }}
          >
            Tạo Giải Đấu Mới
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3.5 rounded-2xl border border-slate-800">
        <div className="w-full sm:w-80">
          <Input
            aria-label="Tìm kiếm giải đấu theo mã, tên giải..."
              placeholder="Tìm kiếm giải đấu theo mã, tên giải..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-400">Trạng thái:</span>
          <select
            aria-label="Lọc theo trạng thái"
              value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Tất cả trạng thái ({tournaments.length})</option>
            <option value="RUNNING">Đang diễn ra</option>
            <option value="PAUSED">Tạm dừng</option>
            <option value="CREATED">Sắp diễn ra</option>
            <option value="COMPLETED">Đã kết thúc</option>
          </select>
        </div>
      </div>

      {/* Tournament Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTournaments.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            Không tìm thấy giải đấu nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredTournaments.map((tour) => {
            const currentStage = tour.structure.stages[tour.currentStageIndex];
            const isRunning = tour.status === 'RUNNING';

            return (
              <Card
                key={tour.id}
                glow={isRunning ? 'green' : 'none'}
                className={`p-5 flex flex-col justify-between transition-all duration-200 ${
                  isRunning ? 'border-emerald-600/50 bg-[#0d162a]' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Status & Code */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {tour.code}
                    </span>
                    <StatusBadge status={tour.status} />
                  </div>

                  {/* Tour Name & Description */}
                  <div>
                    <h3 className="font-bold text-slate-100 text-base line-clamp-1">
                      {tour.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {tour.description || 'Giải đấu câu lạc bộ thể thao trí tuệ.'}
                    </p>
                  </div>

                  {/* Highlights info block */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface border border-slate-800/80 text-xs text-slate-300">
                    <div>
                      <span className="text-xs text-slate-500 block uppercase">Khởi tranh</span>
                      <span className="font-medium">{formatDateTime(tour.scheduledStartTime)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block uppercase">Chip khởi đầu</span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatNumber(tour.startingChips)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block uppercase">Vận động viên</span>
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {tour.participants.length} / {tour.maxPlayers}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block uppercase">Cấp độ hiện tại</span>
                      <span className="font-semibold text-emerald-400">
                        {currentStage?.name || 'Level 1'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <Link to={`/tours/clock/${tour.id}`}>
                    <Button
                      variant={isRunning ? 'gold' : 'secondary'}
                      size="sm"
                      leftIcon={<Clock className="w-3.5 h-3.5" />}
                      className={isRunning ? '' : ''}
                    >
                      Đồng Hồ Clock
                    </Button>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {canOperate && (
                      <>
                        {tour.status === 'RUNNING' && (
                          <button
                            onClick={() => pauseTournament(tour.id)}
                            className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                            title="Tạm dừng giải đấu"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {tour.status === 'PAUSED' && (
                          <button
                            onClick={() => resumeTournament(tour.id)}
                            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="Tiếp tục giải đấu"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {tour.status === 'CREATED' && (
                          <button
                            onClick={() => startTournament(tour.id)}
                            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="Bắt đầu ngay"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {canManage && (
                      <>
                        <button
                          onClick={() => {
                            setTourToEdit(tour);
                            setIsFormModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Chỉnh sửa giải đấu"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTourToDelete(tour)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                          title="Xóa giải đấu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Tour Create / Edit Modal */}
      <TourFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setTourToEdit(null);
        }}
        tourToEdit={tourToEdit}
      />

      {/* Delete Tour Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!tourToDelete}
        onClose={() => setTourToDelete(null)}
        onConfirm={() => {
          if (tourToDelete) deleteTournament(tourToDelete.id);
        }}
        title="Xác Nhận Xóa Giải Đấu"
        message={`Bạn có chắc muốn xóa giải đấu "${tourToDelete?.name}"? Mọi thông tin chip và lịch sử vòng chơi sẽ bị xóa vĩnh viễn.`}
        confirmText="Xác Nhận Xóa"
        variant="danger"
      />
    </div>
  );
};

