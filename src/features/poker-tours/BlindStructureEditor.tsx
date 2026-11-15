import React from 'react';
import { clockStageName } from '../../utils/tournamentRegistration';
import { BlindStructureConfig, BlindLevel } from '../../types/tournament';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatNumber } from '../../utils/formatters';
import { Plus, Trash2, Coffee, Layers, ArrowUp, ArrowDown } from 'lucide-react';

interface BlindStructureEditorProps {
  value: BlindStructureConfig;
  onChange: (config: BlindStructureConfig) => void;
}

export const BlindStructureEditor: React.FC<BlindStructureEditorProps> = ({
  value,
  onChange,
}) => {
  // Preset templates
  const applyPreset = (presetType: 'STANDARD' | 'TURBO' | 'DEEPSTACK') => {
    if (presetType === 'STANDARD') {
      const stages: BlindLevel[] = [
        { id: 'lvl-1', stageType: 'LEVEL', levelNumber: 1, smallBlind: 100, bigBlind: 100, ante: 0, durationMinutes: 20, name: 'Level 1' },
        { id: 'lvl-2', stageType: 'LEVEL', levelNumber: 2, smallBlind: 100, bigBlind: 200, ante: 200, durationMinutes: 20, name: 'Level 2' },
        { id: 'lvl-3', stageType: 'LEVEL', levelNumber: 3, smallBlind: 200, bigBlind: 400, ante: 400, durationMinutes: 20, name: 'Level 3' },
        { id: 'brk-1', stageType: 'BREAK', durationMinutes: 10, name: 'Break 1 - Break 10 Phút' },
        { id: 'lvl-4', stageType: 'LEVEL', levelNumber: 4, smallBlind: 300, bigBlind: 600, ante: 600, durationMinutes: 15, name: 'Level 4' },
        { id: 'lvl-5', stageType: 'LEVEL', levelNumber: 5, smallBlind: 400, bigBlind: 800, ante: 800, durationMinutes: 15, name: 'Level 5' },
        { id: 'lvl-6', stageType: 'LEVEL', levelNumber: 6, smallBlind: 500, bigBlind: 1000, ante: 1000, durationMinutes: 15, name: 'Level 6' },
        { id: 'brk-2', stageType: 'BREAK', durationMinutes: 15, name: 'Break 2 - Break 15 Phút' },
        { id: 'lvl-7', stageType: 'LEVEL', levelNumber: 7, smallBlind: 600, bigBlind: 1200, ante: 1200, durationMinutes: 15, name: 'Level 7' },
        { id: 'lvl-8', stageType: 'LEVEL', levelNumber: 8, smallBlind: 800, bigBlind: 1600, ante: 1600, durationMinutes: 15, name: 'Level 8' },
        { id: 'lvl-9', stageType: 'LEVEL', levelNumber: 9, smallBlind: 1000, bigBlind: 2000, ante: 2000, durationMinutes: 15, name: 'Level 9' },
      ];
      onChange({
        preBreakDurationMinutes: 20,
        postBreakDurationMinutes: 15,
        initialSmallBlind: 100,
        initialBigBlind: 100,
        stages,
      });
    } else if (presetType === 'TURBO') {
      const stages: BlindLevel[] = [
        { id: 'lvl-1', stageType: 'LEVEL', levelNumber: 1, smallBlind: 100, bigBlind: 200, ante: 200, durationMinutes: 12, name: 'Level 1' },
        { id: 'lvl-2', stageType: 'LEVEL', levelNumber: 2, smallBlind: 200, bigBlind: 400, ante: 400, durationMinutes: 12, name: 'Level 2' },
        { id: 'lvl-3', stageType: 'LEVEL', levelNumber: 3, smallBlind: 300, bigBlind: 600, ante: 600, durationMinutes: 12, name: 'Level 3' },
        { id: 'brk-1', stageType: 'BREAK', durationMinutes: 8, name: 'Break 1 - Break 8 Phút' },
        { id: 'lvl-4', stageType: 'LEVEL', levelNumber: 4, smallBlind: 500, bigBlind: 1000, ante: 1000, durationMinutes: 10, name: 'Level 4' },
        { id: 'lvl-5', stageType: 'LEVEL', levelNumber: 5, smallBlind: 800, bigBlind: 1600, ante: 1600, durationMinutes: 10, name: 'Level 5' },
        { id: 'lvl-6', stageType: 'LEVEL', levelNumber: 6, smallBlind: 1000, bigBlind: 2000, ante: 2000, durationMinutes: 10, name: 'Level 6' },
      ];
      onChange({
        preBreakDurationMinutes: 12,
        postBreakDurationMinutes: 10,
        initialSmallBlind: 100,
        initialBigBlind: 200,
        stages,
      });
    } else {
      // DEEPSTACK
      const stages: BlindLevel[] = [
        { id: 'lvl-1', stageType: 'LEVEL', levelNumber: 1, smallBlind: 100, bigBlind: 100, ante: 0, durationMinutes: 25, name: 'Level 1' },
        { id: 'lvl-2', stageType: 'LEVEL', levelNumber: 2, smallBlind: 100, bigBlind: 200, ante: 200, durationMinutes: 25, name: 'Level 2' },
        { id: 'lvl-3', stageType: 'LEVEL', levelNumber: 3, smallBlind: 200, bigBlind: 400, ante: 400, durationMinutes: 25, name: 'Level 3' },
        { id: 'lvl-4', stageType: 'LEVEL', levelNumber: 4, smallBlind: 300, bigBlind: 600, ante: 600, durationMinutes: 25, name: 'Level 4' },
        { id: 'brk-1', stageType: 'BREAK', durationMinutes: 15, name: 'Break 1 - Nghỉ Ăn Nhẹ 15 Phút' },
        { id: 'lvl-5', stageType: 'LEVEL', levelNumber: 5, smallBlind: 400, bigBlind: 800, ante: 800, durationMinutes: 20, name: 'Level 5' },
        { id: 'lvl-6', stageType: 'LEVEL', levelNumber: 6, smallBlind: 500, bigBlind: 1000, ante: 1000, durationMinutes: 20, name: 'Level 6' },
        { id: 'lvl-7', stageType: 'LEVEL', levelNumber: 7, smallBlind: 600, bigBlind: 1200, ante: 1200, durationMinutes: 20, name: 'Level 7' },
        { id: 'brk-2', stageType: 'BREAK', durationMinutes: 10, name: 'Break 2 - Break 10 Phút' },
        { id: 'lvl-8', stageType: 'LEVEL', levelNumber: 8, smallBlind: 800, bigBlind: 1600, ante: 1600, durationMinutes: 20, name: 'Level 8' },
        { id: 'lvl-9', stageType: 'LEVEL', levelNumber: 9, smallBlind: 1000, bigBlind: 2000, ante: 2000, durationMinutes: 20, name: 'Level 9' },
      ];
      onChange({
        preBreakDurationMinutes: 25,
        postBreakDurationMinutes: 20,
        initialSmallBlind: 100,
        initialBigBlind: 100,
        stages,
      });
    }
  };

  const handleStageChange = (index: number, updatedFields: Partial<BlindLevel>) => {
    const newStages = [...value.stages];
    newStages[index] = { ...newStages[index], ...updatedFields };
    onChange({ ...value, stages: newStages });
  };

  const addLevel = () => {
    // Find last level
    const levels = value.stages.filter((s) => s.stageType === 'LEVEL');
    const lastLevel = levels[levels.length - 1];
    const nextLevelNum = (lastLevel?.levelNumber || 0) + 1;
    const lastSB = lastLevel?.smallBlind || 500;
    const lastBB = lastLevel?.bigBlind || 1000;

    // Check if break already occurred before this position
    const hasBreakOccurred = value.stages.some((s) => s.stageType === 'BREAK');
    const duration = hasBreakOccurred ? value.postBreakDurationMinutes : value.preBreakDurationMinutes;

    const newLevel: BlindLevel = {
      id: `lvl-${Date.now()}`,
      stageType: 'LEVEL',
      levelNumber: nextLevelNum,
      smallBlind: Math.round(lastSB * 1.5 / 100) * 100,
      bigBlind: Math.round(lastBB * 1.5 / 100) * 100,
      ante: Math.round(lastBB * 1.5 / 100) * 100,
      durationMinutes: duration || 15,
      name: `Level ${nextLevelNum}`,
    };

    onChange({ ...value, stages: [...value.stages, newLevel] });
  };

  const addBreak = () => {
    const breakCount = value.stages.filter((s) => s.stageType === 'BREAK').length + 1;
    const newBreak: BlindLevel = {
      id: `brk-${Date.now()}`,
      stageType: 'BREAK',
      durationMinutes: 10,
      name: `Break ${breakCount} - Break 10 Phút`,
    };

    onChange({ ...value, stages: [...value.stages, newBreak] });
  };

  const removeStage = (index: number) => {
    const newStages = value.stages.filter((_, idx) => idx !== index);
    // Renumber levels
    let currentLvl = 1;
    let currentBrk = 1;
    const renumbered = newStages.map((s) => {
      if (s.stageType === 'LEVEL') {
        const item = { ...s, levelNumber: currentLvl, name: `Level ${currentLvl}` };
        currentLvl++;
        return item;
      } else {
        const item = { ...s, name: `Break ${currentBrk} - Break ${s.durationMinutes} Phút` };
        currentBrk++;
        return item;
      }
    });

    onChange({ ...value, stages: renumbered });
  };

  const moveStage = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= value.stages.length) return;

    const newStages = [...value.stages];
    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    onChange({ ...value, stages: newStages });
  };

  return (
    <div className="space-y-4">
      {/* Preset Structure Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-field p-4 rounded-xl border border-line">
        <span className="text-sm text-secondary font-medium">Mẫu cấu trúc Blind có sẵn:</span>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset('STANDARD')}
          >
            Tiêu chuẩn (20m / 15m)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset('TURBO')}
          >
            Tốc chiến Turbo (12m / 10m)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset('DEEPSTACK')}
          >
            Deepstack Sâu (25m / 20m)
          </Button>
        </div>
      </div>

      {/* Global Default Duration Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--component-gap)] bg-field p-4 rounded-xl border border-line text-sm">
        <div>
          <label className="block text-muted mb-1">
            Thời lượng Level trước Break đầu (phút):
          </label>
          <Input
            type="number"
            value={value.preBreakDurationMinutes}
            onChange={(e) =>
              onChange({ ...value, preBreakDurationMinutes: Number(e.target.value) || 20 })
            }
          />
        </div>
        <div>
          <label className="block text-muted mb-1">
            Thời lượng Level sau Break đầu (phút):
          </label>
          <Input
            type="number"
            value={value.postBreakDurationMinutes}
            onChange={(e) =>
              onChange({ ...value, postBreakDurationMinutes: Number(e.target.value) || 15 })
            }
          />
        </div>
      </div>

      {/* Stages Table */}
      <div className="border border-line rounded-xl overflow-hidden">
        <div tabIndex={0} role="region" aria-label="Bảng Level và Break có thể cuộn" className="max-h-96 overflow-auto">
          <table className="w-full min-w-[760px] text-sm text-left">
            <thead className="sticky top-0 bg-field border-b border-line text-muted font-medium">
              <tr>
                <th className="py-2 px-3 w-12 text-center">#</th>
                <th className="py-2 px-3">Giai đoạn</th>
                <th className="py-2 px-3">Cược nhỏ (SB)</th>
                <th className="py-2 px-3">Cược lớn (BB)</th>
                <th className="py-2 px-3">Ante</th>
                <th className="py-2 px-3">Thời gian (Phút)</th>
                <th className="py-2 px-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {value.stages.map((stage, idx) => {
                const isBreak = stage.stageType === 'BREAK';

                return (
                  <tr
                    key={stage.id || idx}
                    className={
                      isBreak
                        ? 'bg-warning/10 text-warning font-medium'
                        : 'hover:bg-raised/30 text-content'
                    }
                  >
                    <td className="py-2 px-3 text-center text-muted font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-2 px-3 font-semibold">
                      {isBreak ? (
                        <span className="flex items-center gap-1.5 text-warning">
                          <Coffee className="w-3.5 h-3.5" />
                          {clockStageName(stage, value.stages)}
                        </span>
                      ) : (
                        <span className="text-success">{clockStageName(stage, value.stages)}</span>
                      )}
                    </td>

                    <td className="py-2 px-3">
                      {isBreak ? (
                        <span className="text-muted">--</span>
                      ) : (
                        <input
                          type="number"
                          value={stage.smallBlind || 0}
                          onChange={(e) =>
                            handleStageChange(idx, { smallBlind: Number(e.target.value) })
                          }
                          className="w-20 bg-field border border-line-strong rounded px-2 py-1 text-content font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      )}
                    </td>

                    <td className="py-2 px-3">
                      {isBreak ? (
                        <span className="text-muted">--</span>
                      ) : (
                        <input
                          type="number"
                          value={stage.bigBlind || 0}
                          onChange={(e) =>
                            handleStageChange(idx, { bigBlind: Number(e.target.value) })
                          }
                          className="w-20 bg-field border border-line-strong rounded px-2 py-1 text-content font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      )}
                    </td>

                    <td className="py-2 px-3">
                      {isBreak ? (
                        <span className="text-muted">--</span>
                      ) : (
                        <input
                          type="number"
                          value={stage.ante || 0}
                          onChange={(e) =>
                            handleStageChange(idx, { ante: Number(e.target.value) })
                          }
                          className="w-20 bg-field border border-line-strong rounded px-2 py-1 text-content font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      )}
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={stage.durationMinutes}
                          onChange={(e) =>
                            handleStageChange(idx, { durationMinutes: Number(e.target.value) })
                          }
                          className="w-16 bg-field border border-line-strong rounded px-2 py-1 text-content font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-xs text-muted">phút</span>
                      </div>
                    </td>

                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveStage(idx, 'UP')}
                          disabled={idx === 0}
                          className="p-1 text-muted hover:text-content disabled:opacity-20"
                          title="Lên trên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStage(idx, 'DOWN')}
                          disabled={idx === value.stages.length - 1}
                          className="p-1 text-muted hover:text-content disabled:opacity-20"
                          title="Xuống dưới"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStage(idx)}
                          className="p-1 text-muted hover:text-danger"
                          title="Xóa giai đoạn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Stage Action Bar */}
        <div className="p-4 bg-field border-t border-line flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">
            Tổng cộng: <strong>{value.stages.filter(s => s.stageType === 'LEVEL').length}</strong> Level,{' '}
            <strong>{value.stages.filter(s => s.stageType === 'BREAK').length}</strong> Break (Tổng thời gian dự kiến:{' '}
            {value.stages.reduce((sum, s) => sum + s.durationMinutes, 0)} phút)
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Coffee className="w-3.5 h-3.5 text-warning" />}
              onClick={addBreak}
            >
              + Thêm Break
            </Button>
            <Button
              type="button"
              variant="emerald"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={addLevel}
            >
              + Thêm Level mới
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

