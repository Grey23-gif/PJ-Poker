import React, { useState } from 'react';
import { BlindStructureEditor } from './BlindStructureEditor';
import { BlindStructureConfig } from '../../types/tournament';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sliders, Save, Check, Info } from 'lucide-react';

export const BlindStructurePage: React.FC = () => {
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

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('poker_default_blind_structure', JSON.stringify(structure));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex flex-wrap items-center gap-2">
            Cấu Trúc Blind & Nghỉ Giải Lao (Blind Structure)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Tùy biến cấu trúc mức cược, bước tăng Blind, thời lượng vòng chơi và các quãng nghỉ Break
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          {saved ? 'Đã Lưu Thành Công!' : 'Lưu Mẫu Cấu Trúc'}
        </Button>
      </div>

      {/* Rules Notice */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white">Quy tắc cấu trúc Blind tiêu chuẩn:</strong>
          <ul className="list-disc list-inside text-slate-400 text-xs space-y-0.5">
            <li>Các Level trước kỳ nghỉ đầu tiên áp dụng thời lượng Pre-break (mặc định 20 phút).</li>
            <li>Các Level sau kỳ nghỉ đầu tiên áp dụng thời lượng Post-break (mặc định 15 phút).</li>
            <li>Có thể thiết lập nhiều quãng nghỉ (Break 1, Break 2...) với thời lượng riêng biệt.</li>
            <li>Big Blind (BB) luôn lớn hơn hoặc bằng Small Blind (SB) và là số nguyên dương.</li>
          </ul>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Sliders className="w-4 h-4 text-amber-400" />
            Trình Biên Soạn Cấu Trúc Vòng Đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BlindStructureEditor value={structure} onChange={setStructure} />
        </CardContent>
      </Card>
    </div>
  );
};

