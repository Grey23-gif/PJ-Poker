import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BlindStructureEditor } from './BlindStructureEditor';
import { BlindStructureConfig } from '../../types/tournament';
import { useTournamentTemplateStore } from '../../stores/tournamentTemplateStore';
import type { TournamentTemplate } from '../../types/tournamentTemplate';
import { useAuthStore } from '../../stores/authStore';
import { backgroundAssetIsUsed } from '../../utils/tournamentRepository';
import { Select } from '../../components/ui/Select';
import { PrizeDistributionEditor } from './PrizeDistributionEditor';
import type { TournamentPrizeConfiguration } from '../../types/tournamentPrizes';
import { legacyPrizeConfiguration, validatePrizeConfiguration } from '../../utils/tournamentPrizes';

import { clockStageName } from '../../utils/tournamentRegistration';
import { BackgroundEditor } from './BackgroundEditor';
import { defaultBackground, saveBackgroundFile, deleteBackgroundFile, validateBackground, type BackgroundDraft } from '../../utils/tournamentBackgrounds';

interface TourFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourToEdit?: TournamentTemplate | null;
}

export const TourFormModal: React.FC<TourFormModalProps> = ({
  isOpen,
  onClose,
  tourToEdit,
}) => {
  const { createTemplate, updateTemplate } = useTournamentTemplateStore();
  const { currentUser } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startingChips, setStartingChips] = useState('20000');
  const [maxPlayers, setMaxPlayers] = useState('24');
  const [registrationEndStageId, setRegistrationEndStageId] = useState('');
  const [tourBackground, setTourBackground] = useState<BackgroundDraft>({ config: defaultBackground() });
  const [clockBackground, setClockBackground] = useState<BackgroundDraft>({ config: defaultBackground() });
  const [backgroundBusy, setBackgroundBusy] = useState({ tour: false, clock: false });
  const [saving, setSaving] = useState(false);
  const [prizeConfiguration, setPrizeConfiguration] = useState<TournamentPrizeConfiguration>(() => ({ ...legacyPrizeConfiguration(), guaranteedPoints: 65, entriesThreshold: 30 }));
  const prizeErrors = validatePrizeConfiguration(prizeConfiguration);


  const [structure, setStructure] = useState<BlindStructureConfig>({
    preBreakDurationMinutes: 20,
    postBreakDurationMinutes: 15,
    initialSmallBlind: 100,
    initialBigBlind: 100,
    stages: [
      { id: 'stg-1', stageType: 'LEVEL', levelNumber: 1, smallBlind: 100, bigBlind: 100, ante: 0, durationMinutes: 20, name: 'Level 1' },
      { id: 'stg-2', stageType: 'LEVEL', levelNumber: 2, smallBlind: 100, bigBlind: 200, ante: 200, durationMinutes: 20, name: 'Level 2' },
      { id: 'stg-3', stageType: 'LEVEL', levelNumber: 3, smallBlind: 200, bigBlind: 400, ante: 400, durationMinutes: 20, name: 'Level 3' },
      { id: 'stg-brk-1', stageType: 'BREAK', durationMinutes: 10, name: 'Break 1 - Break 10 Phút' },
      { id: 'stg-4', stageType: 'LEVEL', levelNumber: 4, smallBlind: 300, bigBlind: 600, ante: 600, durationMinutes: 15, name: 'Level 4' },
      { id: 'stg-5', stageType: 'LEVEL', levelNumber: 5, smallBlind: 400, bigBlind: 800, ante: 800, durationMinutes: 15, name: 'Level 5' },
      { id: 'stg-6', stageType: 'LEVEL', levelNumber: 6, smallBlind: 500, bigBlind: 1000, ante: 1000, durationMinutes: 15, name: 'Level 6' },
      { id: 'stg-brk-2', stageType: 'BREAK', durationMinutes: 15, name: 'Break 2 - Break 15 Phút' },
      { id: 'stg-7', stageType: 'LEVEL', levelNumber: 7, smallBlind: 600, bigBlind: 1200, ante: 1200, durationMinutes: 15, name: 'Level 7' },
      { id: 'stg-8', stageType: 'LEVEL', levelNumber: 8, smallBlind: 800, bigBlind: 1600, ante: 1600, durationMinutes: 15, name: 'Level 8' },
      { id: 'stg-9', stageType: 'LEVEL', levelNumber: 9, smallBlind: 1000, bigBlind: 2000, ante: 2000, durationMinutes: 15, name: 'Level 9' },
    ],
  });

  const [error, setError] = useState('');


  useEffect(() => {
    if (tourToEdit) {
      setPrizeConfiguration(structuredClone(tourToEdit.prizeConfiguration || legacyPrizeConfiguration()));
      setTourBackground({ config: tourToEdit.tourBackground || defaultBackground() });
      setClockBackground({ config: tourToEdit.clockBackground || defaultBackground() });
      setName(tourToEdit.name);
      setDescription(tourToEdit.description || '');
      setStartingChips(String(tourToEdit.startingChips));
      setMaxPlayers(String(tourToEdit.maxPlayers));
      setStructure(tourToEdit.structure);
      setRegistrationEndStageId(tourToEdit.buyInCloseBreakId || tourToEdit.structure.stages[tourToEdit.structure.stages.findIndex((stage) => stage.id === tourToEdit.registrationEndStageId) - 1]?.id || '');
    } else {
      setPrizeConfiguration(currentUser?.role === 'ADMIN' ? { ...legacyPrizeConfiguration(), guaranteedPoints: 65, entriesThreshold: 30 } : legacyPrizeConfiguration());
      setTourBackground({ config: defaultBackground() });
      setClockBackground({ config: defaultBackground() });
      setName('ROYAL POKER CUP #WEEKEND');
      setDescription('Giải đấu cúp cuối tuần với cấu trúc Blind chuyên nghiệp.');
      setStartingChips('20000');
      setMaxPlayers('24');
      setRegistrationEndStageId('');
    }
    setError('');
    setBackgroundBusy({ tour: false, clock: false });
  }, [tourToEdit, isOpen, currentUser?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || backgroundBusy.tour || backgroundBusy.clock) return;
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên giải đấu');
      return;
    }
    const chips = Number(startingChips);
    if (!Number.isSafeInteger(chips) || chips <= 0) {
      setError('Số chip xuất phát phải là số nguyên dương hợp lệ');
      return;
    }
    if (!Number.isSafeInteger(Number(maxPlayers)) || Number(maxPlayers) < 1) {
      setError('Giới hạn người chơi phải là số nguyên dương.'); return;
    }

    if (Object.keys(prizeErrors).length) { setError(Object.values(prizeErrors)[0]); return; }

    if (registrationEndStageId && !structure.stages.some((stage) => stage.id === registrationEndStageId && stage.stageType === 'BREAK')) {
      setError('Break đóng Buy-in không còn trong cấu trúc. Vui lòng chọn lại.');
      return;
    }

    const newAssets: string[] = [];
    setSaving(true);
    try {
      const prepare = async (draft: BackgroundDraft) => {
        if (!draft.file) { validateBackground(draft.config); return draft.config; }
        const assetId = await saveBackgroundFile(draft.file);
        newAssets.push(assetId);
        return { source: 'upload' as const, assetId, fileName: draft.file.name.slice(0, 255), overlay: draft.config.overlay };
      };
      const savedTourBackground = await prepare(tourBackground);
      const savedClockBackground = await prepare(clockBackground);
      if (tourToEdit) {
        updateTemplate(tourToEdit.id, {
          ...(currentUser?.role === 'ADMIN' ? { prizeConfiguration } : {}),
          name: name.trim(),
          description: description.trim(),
          startingChips: chips,
          maxPlayers: Number(maxPlayers) || 24,
          structure,
          ...(currentUser?.role === 'ADMIN' ? { buyInCloseBreakId: registrationEndStageId || undefined, registrationEndStageId: undefined } : {}),
          tourBackground: savedTourBackground,
          clockBackground: savedClockBackground,
        });
      } else {
        createTemplate({
          ...(currentUser?.role === 'ADMIN' ? { prizeConfiguration } : {}),
          name: name.trim(),
          description: description.trim(),
          startingChips: chips,
          maxPlayers: Number(maxPlayers) || 24,
          structure,
          buyInCloseBreakId: registrationEndStageId || undefined,
          registrationEndStageId: undefined,
          tourBackground: savedTourBackground,
          clockBackground: savedClockBackground,
          createdBy: currentUser?.fullName || 'Admin',
        });
      }
      // Delete superseded uploads only after the tournament reference was committed.
      for (const config of [tourToEdit?.tourBackground, tourToEdit?.clockBackground]) {
        if (config?.source !== 'upload') continue;
        const stillUsed = backgroundAssetIsUsed(config.assetId);
        if (!stillUsed) void deleteBackgroundFile(config.assetId).catch(() => {});
      }
      onClose();
    } catch (failure) {
      await Promise.all(newAssets.map((assetId) => deleteBackgroundFile(assetId).catch(() => {})));
      setError(failure instanceof Error ? failure.message : 'Không lưu được giải đấu. Vui lòng thử lại.');
    } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!saving) onClose(); }}
      maxWidth="4xl"
      title={tourToEdit ? 'Chỉnh sửa mẫu giải' : 'Tạo mẫu giải đấu'}
    >
      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={saving}>
        <fieldset disabled={saving} className="min-w-0 space-y-5">
        {/* Basic Tour Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--component-gap)]">
          <Input
            label="Tên giải đấu *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ROYAL POKER CUP #15..."
          />


        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--component-gap)]">
          <Input
            label="Starting Stack *"
            type="number"
            value={startingChips}
            onChange={(e) => setStartingChips(e.target.value)}
            placeholder="20000"
          />

          <Input
            label="Số người chơi tối đa"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--component-gap)]">
          <BackgroundEditor key={`tour-${tourToEdit?.id || 'new'}-${isOpen}`} label="Ảnh nền giải đấu" description="Ảnh bìa trên danh sách và phần quản lý giải. Không áp dụng cho đồng hồ."
            value={tourBackground} onChange={setTourBackground} onBusyChange={(busy) => setBackgroundBusy((state) => ({ ...state, tour: busy }))} />
          <BackgroundEditor key={`clock-${tourToEdit?.id || 'new'}-${isOpen}`} label="Ảnh nền đồng hồ" description="Hiển thị sau đồng hồ, Blind, Break, đăng ký và thống kê; hỗ trợ toàn màn hình TV."
            value={clockBackground} onChange={setClockBackground} onBusyChange={(busy) => setBackgroundBusy((state) => ({ ...state, clock: busy }))} />
        </div>

        {/* Blind Structure Section */}
        <div className="pt-2 border-t border-line space-y-2">
          <h4 className="text-sm font-semibold text-content flex items-center gap-2">
            Cấu trúc cược và Break
          </h4>
          <BlindStructureEditor value={structure} onChange={setStructure} />
          <Select label="Tự động đóng Buy-in sau Break" value={registrationEndStageId} disabled={currentUser?.role !== 'ADMIN'} onChange={(event) => setRegistrationEndStageId(event.target.value)}
            helperText="Buy-in tự đóng khi Break được chọn kết thúc, không cần bấm nút trên Clock. Thay đổi mẫu áp dụng cho phiên mới.">
            <option value="">Không tự động đóng</option>
            {registrationEndStageId && !structure.stages.some((stage) => stage.id === registrationEndStageId && stage.stageType === 'BREAK') && <option value={registrationEndStageId}>Break đã bị xóa — chọn lại</option>}
            {structure.stages.filter((stage) => stage.stageType === 'BREAK').map((stage) => <option key={stage.id} value={stage.id}>{clockStageName(stage, structure.stages)}</option>)}
          </Select>
        </div>

        <PrizeDistributionEditor value={prizeConfiguration} onChange={setPrizeConfiguration} disabled={currentUser?.role !== 'ADMIN'} />

        {error && <p role="alert" className="text-sm text-danger font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button variant="gold" type="submit" isLoading={saving} disabled={backgroundBusy.tour || backgroundBusy.clock || Object.keys(prizeErrors).length > 0}>
            {tourToEdit ? 'Lưu Thay Đổi' : 'Tạo mẫu giải'}
          </Button>
        </div>
        </fieldset>
      </form>
    </Modal>
  );
};

