import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BlindStructureEditor } from './BlindStructureEditor';
import { Tournament, BlindStructureConfig } from '../../types/tournament';
import { useTournamentStore } from '../../stores/tournamentStore';
import { useAuthStore } from '../../stores/authStore';

interface TourFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourToEdit?: Tournament | null;
}

export const TourFormModal: React.FC<TourFormModalProps> = ({
  isOpen,
  onClose,
  tourToEdit,
}) => {
  const { createTournament, updateTournament } = useTournamentStore();
  const { users, currentUser } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startingChips, setStartingChips] = useState('20000');
  const [maxPlayers, setMaxPlayers] = useState('24');
  const [scheduledStartTime, setScheduledStartTime] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );

  const [structure, setStructure] = useState<BlindStructureConfig>({
    preBreakDurationMinutes: 20,
    postBreakDurationMinutes: 15,
    initialSmallBlind: 100,
    initialBigBlind: 100,
    stages: [
      { id: 'stg-1', stageType: 'LEVEL', levelNumber: 1, smallBlind: 100, bigBlind: 100, ante: 0, durationMinutes: 20, name: 'Level 1' },
      { id: 'stg-2', stageType: 'LEVEL', levelNumber: 2, smallBlind: 100, bigBlind: 200, ante: 200, durationMinutes: 20, name: 'Level 2' },
      { id: 'stg-3', stageType: 'LEVEL', levelNumber: 3, smallBlind: 200, bigBlind: 400, ante: 400, durationMinutes: 20, name: 'Level 3' },
      { id: 'stg-brk-1', stageType: 'BREAK', durationMinutes: 10, name: 'Break 1 - Giải Lao 10 Phút' },
      { id: 'stg-4', stageType: 'LEVEL', levelNumber: 4, smallBlind: 300, bigBlind: 600, ante: 600, durationMinutes: 15, name: 'Level 4' },
      { id: 'stg-5', stageType: 'LEVEL', levelNumber: 5, smallBlind: 400, bigBlind: 800, ante: 800, durationMinutes: 15, name: 'Level 5' },
      { id: 'stg-6', stageType: 'LEVEL', levelNumber: 6, smallBlind: 500, bigBlind: 1000, ante: 1000, durationMinutes: 15, name: 'Level 6' },
      { id: 'stg-brk-2', stageType: 'BREAK', durationMinutes: 15, name: 'Break 2 - Giải Lao 15 Phút' },
      { id: 'stg-7', stageType: 'LEVEL', levelNumber: 7, smallBlind: 600, bigBlind: 1200, ante: 1200, durationMinutes: 15, name: 'Level 7' },
      { id: 'stg-8', stageType: 'LEVEL', levelNumber: 8, smallBlind: 800, bigBlind: 1600, ante: 1600, durationMinutes: 15, name: 'Level 8' },
      { id: 'stg-9', stageType: 'LEVEL', levelNumber: 9, smallBlind: 1000, bigBlind: 2000, ante: 2000, durationMinutes: 15, name: 'Level 9' },
    ],
  });

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Players list from authStore
  const players = users.filter((u) => u.role === 'PLAYER');

  useEffect(() => {
    if (tourToEdit) {
      setName(tourToEdit.name);
      setDescription(tourToEdit.description || '');
      setStartingChips(String(tourToEdit.startingChips));
      setMaxPlayers(String(tourToEdit.maxPlayers));
      setScheduledStartTime(tourToEdit.scheduledStartTime.slice(0, 16));
      setStructure(tourToEdit.structure);
      setSelectedPlayerIds(tourToEdit.participants.map((p) => p.playerId));
    } else {
      setName('ROYAL POKER CUP #WEEKEND');
      setDescription('Giải đấu cúp cuối tuần với cấu trúc Blind chuyên nghiệp.');
      setStartingChips('20000');
      setMaxPlayers('24');
      setSelectedPlayerIds(players.slice(0, 4).map((p) => p.id));
    }
    setError('');
  }, [tourToEdit, isOpen]);

  const togglePlayer = (pId: string) => {
    if (selectedPlayerIds.includes(pId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== pId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, pId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên giải đấu');
      return;
    }
    const chips = Number(startingChips);
    if (isNaN(chips) || chips <= 0) {
      setError('Số chip xuất phát phải lớn hơn 0');
      return;
    }

    const participantsData = selectedPlayerIds.map((id) => {
      const p = users.find((u) => u.id === id);
      return {
        playerId: id,
        playerName: p?.fullName || 'Người chơi',
        phone: p?.phone,
      };
    });

    if (tourToEdit) {
      updateTournament(tourToEdit.id, {
        name: name.trim(),
        description: description.trim(),
        startingChips: chips,
        maxPlayers: Number(maxPlayers) || 24,
        scheduledStartTime: new Date(scheduledStartTime).toISOString(),
        structure,
      });
    } else {
      createTournament({
        name: name.trim(),
        description: description.trim(),
        startingChips: chips,
        maxPlayers: Number(maxPlayers) || 24,
        scheduledStartTime: new Date(scheduledStartTime).toISOString(),
        structure,
        participants: participantsData,
        createdBy: currentUser?.fullName || 'Admin',
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={tourToEdit ? 'Chỉnh Sửa Thông Tin Giải Đấu' : 'Tạo Giải Đấu Poker & Thiết Lập Blind'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Tour Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tên giải đấu *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ROYAL POKER CUP #15..."
          />

          <Input
            label="Thời gian bắt đầu dự kiến *"
            type="datetime-local"
            value={scheduledStartTime}
            onChange={(e) => setScheduledStartTime(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Số chip xuất phát (Chip khởi đầu) *"
            type="number"
            value={startingChips}
            onChange={(e) => setStartingChips(e.target.value)}
            placeholder="20000"
          />

          <Input
            label="Số người chơi tối đa (Max Players)"
            type="number"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            placeholder="24"
          />
        </div>

        <Input
          label="Mô tả & thể lệ giải đấu"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả thể thức Deepstack, thời gian đăng ký muộn..."
        />

        {/* Participant Registration Picker */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Hội viên đăng ký tham gia ({selectedPlayerIds.length} người đã chọn):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900 border border-slate-800 rounded-xl">
            {players.map((p) => {
              const isSelected = selectedPlayerIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => togglePlayer(p.id)}
                  className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{p.fullName}</span>
                  <span className="text-xs ml-1">{isSelected ? '✓' : '+'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blind Structure Section */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            Cấu Trúc Blind & Breaks (Blind Structure)
          </h4>
          <BlindStructureEditor value={structure} onChange={setStructure} />
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button variant="gold" type="submit">
            {tourToEdit ? 'Lưu Thay Đổi' : 'Khởi Tạo Giải Đấu'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

