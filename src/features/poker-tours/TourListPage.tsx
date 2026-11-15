import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTournamentTemplateStore } from '../../stores/tournamentTemplateStore';
import { useTournamentSessionStore } from '../../stores/tournamentSessionStore';
import { useAuthStore } from '../../stores/authStore';
import type { TournamentTemplate } from '../../types/tournamentTemplate';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TournamentCover } from './TournamentCover';
import { TourFormModal } from './TourFormModal';
import { getTournamentStatistics } from '../../utils/tournamentStatistics';
import { clockStageName } from '../../utils/tournamentRegistration';
import { TournamentHistory } from './TournamentHistory';

const statuses = { CREATED: 'Chưa bắt đầu', PAUSED: 'Tạm dừng', RUNNING: 'Đang chạy', FINISHED: 'Đã chốt · FINISHED', COMPLETED: 'Đã kết thúc', CANCELLED: 'Đã lưu lịch sử' };
export const TourListPage = () => {
  const { templates, deleteTemplate, loadError } = useTournamentTemplateStore();
  const { tournaments, createSession } = useTournamentSessionStore();
  const { currentUser, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<TournamentTemplate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<TournamentTemplate | null>(null);
  const canManage = currentUser?.role === 'ADMIN' || hasPermission('TOUR_MANAGE');
  const currentSessions = tournaments.filter((tour) => !tour.archivedAt && tour.status !== 'CANCELLED');
  const historicalSessions = tournaments.filter((tour) => tour.archivedAt || tour.status === 'CANCELLED');
  const matches = (name: string) => name.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  return <section className="space-y-[var(--section-gap)]">
    <div className="flex flex-wrap justify-between gap-[var(--component-gap)]">
      <div><h1 className="page-title text-2xl font-semibold text-content">Quản lý giải đấu</h1><p className="mt-2 text-sm text-muted">Mẫu giải lưu cấu hình cố định. Mỗi phiên giải có đồng hồ, người chơi và lịch sử riêng.</p></div>
      {canManage && <Button variant="gold" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>Tạo mẫu giải</Button>}
    </div>
    <Input label="Tìm mẫu hoặc phiên giải" value={query} onChange={(event) => setQuery(event.target.value)} />
    {loadError && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">{loadError}</p>}
    <div className="space-y-4"><h2 className="text-xl font-semibold text-content">Mẫu giải đấu</h2>
      <div className="tour-card-grid">
        {templates.filter((item) => matches(item.name)).map((template) => <article key={template.id} className="rounded-2xl border border-line bg-surface p-[var(--card-padding)] space-y-4">
          <TournamentCover config={template.tourBackground} title={template.name} />
          <h3 className="text-lg font-semibold text-content break-words">{template.name}</h3>
          <p className="text-sm text-muted">{template.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">Starting Stack</dt><dd className="font-semibold text-content">{template.startingChips.toLocaleString('vi-VN')}</dd></div><div><dt className="text-muted">Blinds / Break</dt><dd className="text-content">{template.structure.stages.filter((stage) => stage.stageType === 'LEVEL').length} Level / {template.structure.stages.filter((stage) => stage.stageType === 'BREAK').length} Break</dd></div></dl>
          <div className="flex flex-wrap gap-2">
            {currentUser?.role === 'ADMIN' && <Button onClick={() => { try { const session = createSession(template.id); navigate(`/tours/clock/${session.id}`); } catch (error) { toast.error(error instanceof Error ? error.message : 'Không tạo được phiên giải.'); } }}>Tạo phiên mới</Button>}
            {canManage && <><Button variant="outline" aria-label={`Chỉnh sửa mẫu ${template.name}`} leftIcon={<Edit2 className="w-4 h-4" />} onClick={() => { setEditing(template); setFormOpen(true); }}>Chỉnh sửa mẫu</Button><Button variant="outline" aria-label={`Xóa mẫu ${template.name}`} onClick={() => setDeleting(template)}><Trash2 className="w-4 h-4" /></Button></>}
          </div>
        </article>)}
      </div>
      {!templates.length && <p className="text-muted">Chưa có mẫu giải. Tạo mẫu trước khi mở phiên.</p>}
    </div>
    <div className="space-y-4"><h2 className="text-xl font-semibold text-content">Các phiên giải hiện tại</h2>
      <div className="tour-card-grid">{currentSessions.filter((item) => matches(item.name)).map((session) => {
        const statistics = getTournamentStatistics(session); const stage = session.structure.stages[session.currentStageIndex];
        return <article key={session.id} className="rounded-2xl border border-line bg-surface p-[var(--card-padding)] space-y-3">
          <h3 className="font-semibold text-content break-words">{session.name}</h3>
          <p className="text-sm text-muted">{new Date(session.createdAt).toLocaleString('vi-VN')} · {statuses[session.status]}{session.rewardStatus === 'TOP_REWARD_PENDING' ? ' · Chờ duyệt TOP' : ''}</p>
          <p className="text-xs text-muted break-all">Mã phiên: {session.id}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">Total Entries</dt><dd className="text-content">{statistics.entries}</dd></div><div><dt className="text-muted">Players Remaining / Unique Players</dt><dd className="text-content">{statistics.playersRemaining} / {statistics.uniquePlayers}</dd></div></dl>
          <p className="text-sm text-secondary">{stage && clockStageName(stage, session.structure.stages)}</p>
          <Link className="inline-flex min-h-[var(--button-height)] items-center text-success underline underline-offset-4" to={`/tours/clock/${session.id}`}>Mở phiên giải</Link>
        </article>;
      })}</div>
      {!currentSessions.length && <p className="text-muted">Chưa có phiên giải hiện tại. Chọn một mẫu và tạo phiên mới; mọi chỉ số bắt đầu từ 0.</p>}
    </div>
    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'CASHIER') && <TournamentHistory sessions={historicalSessions} />}
    {formOpen && <TourFormModal isOpen onClose={() => { setFormOpen(false); setEditing(null); }} tourToEdit={editing} />}
    <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} title="Xóa mẫu giải?" message={`Xóa mẫu “${deleting?.name}”? Các phiên đang chạy và lịch sử vẫn được giữ nguyên.`} confirmText="Xóa mẫu" variant="danger" onConfirm={() => { if (deleting) { try { deleteTemplate(deleting.id); setDeleting(null); } catch (error) { toast.error(error instanceof Error ? error.message : 'Không xóa được mẫu.'); } } }} />
  </section>;
};
