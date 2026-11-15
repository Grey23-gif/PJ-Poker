import type { BlindLevel, Tournament } from '../types/tournament';
import { isBuyInClosed, selectedBuyInBreak } from './tournamentRuntime';

export function clockStageName(stage: BlindLevel, stages: BlindLevel[]): string {
  const index = stages.findIndex((item) => item.id === stage.id);
  if (stage.stageType === 'BREAK') {
    return `Break ${stages.slice(0, index + 1).filter((item) => item.stageType === 'BREAK').length || 1}`;
  }
  return `Level ${stage.levelNumber || stages.slice(0, index + 1).filter((item) => item.stageType === 'LEVEL').length || 1}`;
}

export function registrationOptions(stages: BlindLevel[]) {
  return stages.filter((stage) => stage.stageType === 'LEVEL').map((stage) => {
    const index = stages.indexOf(stage);
    const precedingStage = stages[index - 1];
    const afterBreak = precedingStage?.stageType === 'BREAK' ? clockStageName(precedingStage, stages) : undefined;
    return { value: stage.id, label: `${clockStageName(stage, stages)}${afterBreak ? ` — sau ${afterBreak}` : ''}` };
  });
}

export function registrationSummary(tour: Tournament): string {
  const breakId = selectedBuyInBreak(tour);
  if (breakId) {
    const stage = tour.structure.stages.find((item) => item.id === breakId && item.stageType === 'BREAK');
    return stage ? `Đóng Buy-in sau ${clockStageName(stage, tour.structure.stages)}` : 'Vui lòng chọn lại Break đóng Buy-in';
  }
  if (!tour.registrationEndStageId) return 'Chưa chọn Break đóng Buy-in';
  const stage = tour.structure.stages.find((item) => item.id === tour.registrationEndStageId && item.stageType === 'LEVEL');
  if (!stage) return 'Vui lòng cấu hình lại thời điểm đóng Buy-in';
  const index = tour.structure.stages.indexOf(stage);
  const previous = tour.structure.stages[index - 1];
  const level = stage.levelNumber || tour.structure.stages.slice(0, index + 1).filter((item) => item.stageType === 'LEVEL').length;
  return `Đóng Buy-in tại Level ${level}${previous?.stageType === 'BREAK' ? ` — sau ${clockStageName(previous, tour.structure.stages)}` : ''}`;
}

// The clock display needs a stable, per-tournament registration endpoint.
// Newer configuration closes after a break; older records may point directly
// to the first Level after that break, so both forms resolve to the same text.
export function registrationEndDisplay(tour: Tournament): string {
  const stages = tour.structure.stages;
  const breakId = selectedBuyInBreak(tour);
  const breakIndex = stages.findIndex((stage) => stage.id === breakId && stage.stageType === 'BREAK');
  const configuredStage = breakIndex >= 0
    ? stages.slice(breakIndex + 1).find((stage) => stage.stageType === 'LEVEL')
    : stages.find((stage) => stage.id === tour.registrationEndStageId && stage.stageType === 'LEVEL');

  return configuredStage ? `Reg End: Start of ${clockStageName(configuredStage, stages)}` : 'Reg End: Not set';
}

export function registrationHasEnded(tour: Tournament): boolean {
  return isBuyInClosed(tour);
}
