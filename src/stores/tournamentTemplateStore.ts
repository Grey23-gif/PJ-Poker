import { create } from 'zustand';
import type { TournamentTemplate, TemplateInput } from '../types/tournamentTemplate';
import { useAuthStore } from './authStore';
import { TOURNAMENT_REPOSITORY_KEY, extractTemplate, loadTournamentRepository, saveTemplates } from '../utils/tournamentRepository';
import { validateBackground } from '../utils/tournamentBackgrounds';
import { validatePrizeConfiguration } from '../utils/tournamentPrizes';

function requireManager() {
  const auth = useAuthStore.getState();
  if (auth.currentUser?.role !== 'ADMIN' && !auth.hasPermission('TOUR_MANAGE')) throw new Error('Bạn không có quyền quản lý mẫu giải.');
}

export function validateTemplate(template: TournamentTemplate) {
  if (template.prizeConfiguration) {
    const errors = validatePrizeConfiguration(template.prizeConfiguration);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  }
  if (!template.name.trim() || !Number.isSafeInteger(template.startingChips) || template.startingChips <= 0 ||
    !Number.isSafeInteger(template.maxPlayers) || template.maxPlayers < 1 || !template.structure.stages.some((stage) => stage.stageType === 'LEVEL')) throw new Error('Kiểm tra tên, Starting Stack, giới hạn người chơi và cấu trúc Level.');
  if (new Set(template.structure.stages.map((stage) => stage.id)).size !== template.structure.stages.length ||
    template.structure.stages.some((stage) => !Number.isFinite(stage.durationMinutes) || stage.durationMinutes <= 0 ||
      (stage.stageType === 'LEVEL' && [stage.smallBlind ?? 0, stage.bigBlind ?? 0, stage.ante ?? 0].some((value) => !Number.isSafeInteger(value) || value < 0)))) throw new Error('Cấu trúc Blinds/Break không hợp lệ.');
  if (template.buyInCloseBreakId && !template.structure.stages.some((stage) => stage.id === template.buyInCloseBreakId && stage.stageType === 'BREAK')) throw new Error('Break đóng Buy-in không hợp lệ.');
  if (template.registrationEndStageId && !template.structure.stages.some((stage) => stage.id === template.registrationEndStageId && stage.stageType === 'LEVEL')) throw new Error('Level đóng Buy-in không hợp lệ.');
  validateBackground(template.tourBackground); validateBackground(template.clockBackground);
}

interface TemplateState {
  loadError: string | null;
  templates: TournamentTemplate[];
  createTemplate: (data: TemplateInput) => TournamentTemplate;
  updateTemplate: (id: string, data: Partial<TemplateInput>) => void;
  deleteTemplate: (id: string) => void;
}

export const useTournamentTemplateStore = create<TemplateState>((set, get) => {
  const loaded = loadTournamentRepository();
  return {
  loadError: loaded.error,
  templates: loaded.data.templates,
  createTemplate: (data) => {
    requireManager();
    if (data.prizeConfiguration && useAuthStore.getState().currentUser?.role !== 'ADMIN') throw new Error('Chỉ Admin được cấu hình Prize Distribution.');
    const template = extractTemplate({ ...data, id: crypto.randomUUID(), code: `TPL-${crypto.randomUUID().slice(0, 8)}`, createdAt: new Date().toISOString() });
    validateTemplate(template);
    if ((template.buyInCloseBreakId || template.registrationEndStageId) && useAuthStore.getState().currentUser?.role !== 'ADMIN') throw new Error('Chỉ Admin được cấu hình đóng Buy-in.');
    const templates = [template, ...get().templates]; saveTemplates(templates); set({ templates }); return template;
  },
  updateTemplate: (id, data) => {
    requireManager();
    const previous = get().templates.find((item) => item.id === id);
    if (!previous) throw new Error('Không tìm thấy mẫu giải.');
    if ('prizeConfiguration' in data && JSON.stringify(data.prizeConfiguration) !== JSON.stringify(previous.prizeConfiguration) && useAuthStore.getState().currentUser?.role !== 'ADMIN') throw new Error('Chỉ Admin được cấu hình Prize Distribution.');
    const template = extractTemplate({ ...previous, ...data, id: previous.id, code: previous.code, createdAt: previous.createdAt });
    validateTemplate(template);
    if ((template.buyInCloseBreakId !== previous.buyInCloseBreakId || template.registrationEndStageId !== previous.registrationEndStageId) && useAuthStore.getState().currentUser?.role !== 'ADMIN') throw new Error('Chỉ Admin được cấu hình đóng Buy-in.');
    const templates = get().templates.map((item) => item.id === id ? template : item); saveTemplates(templates); set({ templates });
  },
  deleteTemplate: (id) => {
    requireManager();
    const templates = get().templates.filter((item) => item.id !== id); saveTemplates(templates); set({ templates });
  },
}; });

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const refresh = (event: StorageEvent) => {
    if (event.key !== TOURNAMENT_REPOSITORY_KEY) return;
    const loaded = loadTournamentRepository();
    useTournamentTemplateStore.setState({ templates: loaded.data.templates, loadError: loaded.error });
  };
  window.addEventListener('storage', refresh);
  if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('storage', refresh));
}
