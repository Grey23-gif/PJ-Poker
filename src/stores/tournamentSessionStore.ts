import { create } from 'zustand';
import { Tournament, BlindStructureConfig, TourStatus, TournamentStatistics, TournamentStatisticsChange, ChipIssueType, StatisticsResult, TournamentBackground } from '../types/tournament';
import type { TournamentSession } from '../types/tournamentSession';
import { TOURNAMENT_REPOSITORY_KEY, loadTournamentRepository, hydrateSession, saveSessions, serializeSession, extractTemplate } from '../utils/tournamentRepository';
import { useTournamentTemplateStore, validateTemplate } from './tournamentTemplateStore';
import { getTournamentPrizePayouts, legacyPrizeConfiguration } from '../utils/tournamentPrizes';
import { playLevelUpSound, playBreakSound } from '../utils/audio';
import { finalizationSignature, freezeSessionResults, isSessionFinished } from '../utils/tournamentFinalization';
import { useAuthStore } from './authStore';
import { deriveStatistics, getTournamentStatistics, validateStatistics } from '../utils/tournamentStatistics';
import { advanceRuntime, isBuyInClosed, latchBuyInClosure, selectedBuyInBreak } from '../utils/tournamentRuntime';
import { projectTournamentRewards, POINTS_LEDGER_KEY } from '../utils/tournamentRewards';

interface TournamentState {
  loadError: string | null;
  sessions: TournamentSession[];
  // Read model for existing Clock/dashboard components, composed from the
  // session's frozen template snapshot and runtime fields.
  tournaments: Tournament[];
  activeTourId: string | null;
  createSession: (templateId: string) => Tournament;
  refreshRewardProcessing: () => void;

  // Tournament CRUD
  createTournament: (tourData: {
    name: string;
    description?: string;
    startingChips: number;
    maxPlayers: number;
    scheduledStartTime?: string;
    structure: BlindStructureConfig;
    registrationEndStageId?: string;
    buyInCloseBreakId?: string;
    tourBackground?: TournamentBackground;
    clockBackground?: TournamentBackground;
    participants: { playerId: string; playerName: string; phone?: string }[];
    createdBy: string;
  }) => Tournament;

  updateTournament: (id: string, updated: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;
  setActiveTourId: (id: string | null) => void;

  // Real-time Tournament Clock Controls
  startTournament: (tourId: string) => void;
  pauseTournament: (tourId: string) => void;
  resumeTournament: (tourId: string) => void;
  nextStage: (tourId: string) => void;
  prevStage: (tourId: string) => void;
  resetCurrentStage: (tourId: string) => void;
  endTournament: (tourId: string, expectedSignature?: string) => StatisticsResult;
  syncClockTick: (tourId: string) => void;
  syncAllClocks: () => void;
  setBuyInCloseBreak: (tourId: string, breakId?: string) => StatisticsResult;
  closeBuyIn: (tourId: string) => StatisticsResult;
  resetTournamentSession: (tourId: string) => StatisticsResult;

  // Participant actions
  eliminateParticipant: (tourId: string, participantId: string, rank?: number) => StatisticsResult;
  updateChips: (tourId: string, participantId: string, chips: number) => StatisticsResult;
  correctStatistics: (tourId: string, statistics: TournamentStatistics, reason: string, expectedHistoryId?: string) => StatisticsResult;
  issueChips: (tourId: string, type: ChipIssueType, playerId: string, chips: number, reason: string, expectedHistoryId?: string) => StatisticsResult;
  setRegistrationEnd: (tourId: string, stageId?: string) => StatisticsResult;
}

const STORAGE_KEY_SELECTION = 'poker_cafe_selected_tournament';

function statisticsActor() {
  const user = useAuthStore.getState().currentUser;
  return user && (user.role === 'ADMIN' || user.role === 'CASHIER')
    ? { id: user.id, name: user.fullName, role: user.role } : null;
}

function withStatisticsChange(tour: Tournament, after: TournamentStatistics,
  type: TournamentStatisticsChange['type'], reason: string,
  details: Partial<TournamentStatisticsChange> = {}): Tournament {
  const user = useAuthStore.getState().currentUser;
  const change: TournamentStatisticsChange = {
    ...details, id: crypto.randomUUID(), timestamp: new Date().toISOString(),
    actor: user ? { id: user.id, name: user.fullName, role: user.role } : { id: 'system', name: 'Hệ thống', role: 'SYSTEM' },
    type, reason: reason.trim(), before: getTournamentStatistics(tour), after: deriveStatistics(tour.startingChips, after),
  };
  return { ...tour, statistics: deriveStatistics(tour.startingChips, after), statisticsHistory: [...(tour.statisticsHistory || []), change] };
}

function normalizeStatistics(tour: Tournament): Tournament {
  if (tour.status === 'COMPLETED' && !tour.finalResults) return freezeSessionResults(tour, { id: 'system-migration', name: 'Chuyển đổi phiên đã kết thúc', role: 'SYSTEM' }, Date.parse(tour.endedAt || tour.createdAt));
  if (isSessionFinished(tour)) return tour;
  return latchBuyInClosure({ ...tour, buyInCloseBreakId: selectedBuyInBreak(tour), statistics: getTournamentStatistics(tour),
    statisticsNeedsReview: tour.statisticsNeedsReview ?? !tour.statistics,
    statisticsHistory: tour.statisticsHistory || [] }, Date.now());
}

function persistStatistics(tournaments: Tournament[]): boolean {
  try { saveSessions(tournaments); return true; }
  catch { return false; }
}

export const useTournamentSessionStore = create<TournamentState>((rawSet, get) => {
  const set = (value: Partial<TournamentState>) => rawSet(value.tournaments
    ? { ...value, sessions: value.tournaments.map(serializeSession) } : value);
  const loaded = loadTournamentRepository();
  const initialTournaments = projectTournamentRewards(loaded.data.sessions.map(hydrateSession).map(normalizeStatistics));
  const runningTour = initialTournaments.find((t) => t.status === 'RUNNING');
  let savedSelection: string | null = null;
  try { savedSelection = localStorage.getItem(STORAGE_KEY_SELECTION); } catch { /* Use the first available tournament. */ }
  const initialSelection = initialTournaments.find((t) => t.id === savedSelection && !t.archivedAt && t.status !== 'CANCELLED')?.id || runningTour?.id || initialTournaments.find((t) => !t.archivedAt && t.status !== 'CANCELLED')?.id || null;

  return {
    loadError: loaded.error,
    sessions: initialTournaments.map(serializeSession),
    tournaments: initialTournaments,
    activeTourId: initialSelection,
    refreshRewardProcessing: () => {
      const tournaments = projectTournamentRewards(get().tournaments);
      const selected = tournaments.find((tour) => tour.id === get().activeTourId && !tour.archivedAt && tour.status !== 'CANCELLED');
      set({ tournaments, activeTourId: selected?.id || tournaments.find((tour) => !tour.archivedAt && tour.status !== 'CANCELLED')?.id || null });
    },

    createSession: (templateId) => {
      if (useAuthStore.getState().currentUser?.role !== 'ADMIN') throw new Error('Chỉ Admin được tạo phiên giải.');
      const template = useTournamentTemplateStore.getState().templates.find((item) => item.id === templateId);
      if (!template) throw new Error('Không tìm thấy mẫu giải.');
      validateTemplate(template);
      const now = new Date().toISOString();
      const firstLevel = template.structure.stages.findIndex((stage) => stage.stageType === 'LEVEL');
      const session: Tournament = {
        ...structuredClone(template), id: crypto.randomUUID(), templateId: template.id, entryStackOnly: true,
        prizeConfiguration: structuredClone(template.prizeConfiguration || legacyPrizeConfiguration()),
        createdAt: now, createdBy: useAuthStore.getState().currentUser!.fullName,
        status: 'PAUSED', pausedAt: now, currentStageIndex: firstLevel,
        stageRemainingSeconds: template.structure.stages[firstLevel].durationMinutes * 60,
        totalElapsedSeconds: 0, registeredCount: 0, participants: [],
        statistics: { entries: 0, uniquePlayers: 0, playersRemaining: 0, totalStack: 0 },
        statisticsHistory: [], statisticsNeedsReview: false,
      };
      const tournaments = [session, ...get().tournaments];
      saveSessions(tournaments);
      set({ tournaments, activeTourId: session.id });
      get().setActiveTourId(session.id);
      return session;
    },

    // Compatibility API: participant defaults are deliberately ignored.
    createTournament: (data) => {
      const template = useTournamentTemplateStore.getState().createTemplate(data);
      return get().createSession(template.id);
    },

    updateTournament: (id, updated) => {
      const tour = get().tournaments.find((item) => item.id === id);
      if (!tour) throw new Error('Không tìm thấy phiên giải.');
      if (tour.archivedAt) throw new Error('Phiên đã lưu trữ chỉ được xem.');
      // Template edits apply to future sessions, never this snapshot/runtime.
      useTournamentTemplateStore.getState().updateTemplate(tour.templateId || tour.id, extractTemplate({ ...tour, ...updated }));
    },

    deleteTournament: () => {
      throw new Error('Phiên giải được giữ để bảo toàn lịch sử. Bạn có thể xóa mẫu giải riêng.');
    },

    setActiveTourId: (id) => {
      if (id !== null && !get().tournaments.some((tour) => tour.id === id)) return;
      try { if (id) localStorage.setItem(STORAGE_KEY_SELECTION, id); else localStorage.removeItem(STORAGE_KEY_SELECTION); } catch { /* Session selection still works. */ }
      set({ activeTourId: id });
    },

    startTournament: (tourId: string) => {
      const auth = useAuthStore.getState();
      if (auth.currentUser?.role !== 'ADMIN' && !auth.hasPermission('TOUR_OPERATE')) return;
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour || isSessionFinished(tour) || tour.status === 'CANCELLED') return;

      const firstStageSec = (tour.structure.stages[0]?.durationMinutes || 20) * 60;
      const now = Date.now();

      const updated = tournaments.map((t) =>
        t.id === tourId
          ? {
              ...t,
              status: 'RUNNING' as TourStatus,
              startedAt: t.startedAt || new Date().toISOString(),
              timerStartedAt: now,
              lastUpdatedAt: now,
              stageRemainingSeconds: t.stageRemainingSeconds > 0 ? t.stageRemainingSeconds : firstStageSec,
            }
          : t
      );

      playLevelUpSound();
      saveSessions(updated);
      set({ tournaments: updated });
    },

    pauseTournament: (tourId: string) => {
      const auth = useAuthStore.getState();
      if (auth.currentUser?.role !== 'ADMIN' && !auth.hasPermission('TOUR_OPERATE')) return;
      get().syncClockTick(tourId);
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour || isSessionFinished(tour) || tour.status !== 'RUNNING') return;

      let remaining = tour.stageRemainingSeconds;
      if (tour.timerStartedAt) {
        const elapsedSinceStart = Math.floor((Date.now() - tour.timerStartedAt) / 1000);
        remaining = Math.max(0, tour.stageRemainingSeconds - elapsedSinceStart);
      }

      const updated = tournaments.map((t) =>
        t.id === tourId
          ? {
              ...t,
              status: 'PAUSED' as TourStatus,
              stageRemainingSeconds: remaining,
              lastUpdatedAt: Date.now(),
              timerStartedAt: undefined,
              pausedAt: new Date().toISOString(),
            }
          : t
      );

      saveSessions(updated);
      set({ tournaments: updated });
    },

    resumeTournament: (tourId: string) => {
      const auth = useAuthStore.getState();
      if (auth.currentUser?.role !== 'ADMIN' && !auth.hasPermission('TOUR_OPERATE')) return;
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour || isSessionFinished(tour) || tour.status !== 'PAUSED') return;

      const now = Date.now();
      const updated = tournaments.map((t) =>
        t.id === tourId
          ? {
              ...t,
              status: 'RUNNING' as TourStatus,
              startedAt: t.startedAt || new Date(now).toISOString(),
              timerStartedAt: now,
              lastUpdatedAt: now,
              pausedAt: undefined,
            }
          : t
      );

      saveSessions(updated);
      set({ tournaments: updated });
    },

    nextStage: (tourId: string) => {
      const auth = useAuthStore.getState();
      if (auth.currentUser?.role !== 'ADMIN' && !auth.hasPermission('TOUR_OPERATE')) return;
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour || isSessionFinished(tour) || tour.status === 'CANCELLED') return;

      const nextIndex = tour.currentStageIndex + 1;
      if (nextIndex >= tour.structure.stages.length) {
        // Tournament ended
        get().endTournament(tourId);
        return;
      }

      const nextStage = tour.structure.stages[nextIndex];
      const newDurationSec = nextStage.durationMinutes * 60;
      const isBreak = nextStage.stageType === 'BREAK';

      if (isBreak) {
        playBreakSound();
      } else {
        playLevelUpSound();
      }

      const updated = tournaments.map((t) =>
        t.id === tourId
          ? latchBuyInClosure({
              ...t,
              currentStageIndex: nextIndex,
              stageRemainingSeconds: newDurationSec,
              timerStartedAt: t.status === 'RUNNING' ? Date.now() : undefined,
              lastUpdatedAt: Date.now(),
            }, Date.now())
          : t
      );

      saveSessions(updated);
      set({ tournaments: updated });
    },

    prevStage: (tourId: string) => {
      const auth = useAuthStore.getState();
      if (auth.currentUser?.role !== 'ADMIN' && !auth.hasPermission('TOUR_OPERATE')) return;
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour || isSessionFinished(tour) || tour.status === 'CANCELLED') return;

      const prevIndex = Math.max(0, tour.currentStageIndex - 1);
      const prevStage = tour.structure.stages[prevIndex];
      const newDurationSec = prevStage.durationMinutes * 60;

      const updated = tournaments.map((t) =>
        t.id === tourId
          ? {
              ...t,
              currentStageIndex: prevIndex,
              stageRemainingSeconds: newDurationSec,
              timerStartedAt: t.status === 'RUNNING' ? Date.now() : undefined,
              lastUpdatedAt: Date.now(),
            }
          : t
      );

      saveSessions(updated);
      set({ tournaments: updated });
    },

    resetCurrentStage: (tourId: string) => {
      const auth = useAuthStore.getState();
      if (auth.currentUser?.role !== 'ADMIN' && !auth.hasPermission('TOUR_OPERATE')) return;
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour || isSessionFinished(tour) || tour.status === 'CANCELLED') return;

      const currentStage = tour.structure.stages[tour.currentStageIndex];
      const initialSec = (currentStage?.durationMinutes || 20) * 60;

      const updated = tournaments.map((t) =>
        t.id === tourId
          ? {
              ...t,
              stageRemainingSeconds: initialSec,
              timerStartedAt: t.status === 'RUNNING' ? Date.now() : undefined,
              lastUpdatedAt: Date.now(),
            }
          : t
      );

      saveSessions(updated);
      set({ tournaments: updated });
    },

    endTournament: (tourId, expectedSignature) => {
      const auth = useAuthStore.getState();
      if (auth.currentUser?.role !== 'ADMIN' && !auth.hasPermission('TOUR_OPERATE')) return { success: false, message: 'Bạn không có quyền kết thúc giải.' };
      const tour = get().tournaments.find((item) => item.id === tourId);
      if (!tour || tour.status === 'CANCELLED') return { success: false, message: 'Không tìm thấy phiên đang hoạt động.' };
      if (isSessionFinished(tour)) return { success: true };
      if (expectedSignature && expectedSignature !== finalizationSignature(tour)) return { success: false, message: 'Thống kê đã đổi. Đóng hộp xác nhận rồi kiểm tra lại trước khi chốt.' };
      try {
        const actor = auth.currentUser!;
        const finished = freezeSessionResults(tour, { id: actor.id, name: actor.fullName, role: actor.role });
        const updated = get().tournaments.map((item) => item.id === tourId ? finished : item);
        if (!persistStatistics(updated)) return { success: false, message: 'Không lưu được kết quả. Phiên chưa bị khóa.' };
        set({ tournaments: updated }); playLevelUpSound(); return { success: true };
      } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Không thể chốt phiên.' }; }
    },

    syncClockTick: (tourId: string) => {
      const tour = get().tournaments.find((t) => t.id === tourId);
      if (!tour) return;
      const result = advanceRuntime(tour, Date.now());
      if (result.finished) {
        try {
          const finished = freezeSessionResults(result.tour, { id: 'system', name: 'Đồng hồ giải đấu', role: 'SYSTEM' });
          const updated = get().tournaments.map((item) => item.id === tourId ? finished : item);
          if (persistStatistics(updated)) set({ tournaments: updated });
        } catch { /* Keep the last valid runtime when final snapshot cannot be saved. */ }
        return;
      }
      if (result.tour !== tour) {
        const updated = get().tournaments.map((t) => t.id === tourId ? result.tour : t);
        if (!persistStatistics(updated)) return;
        set({ tournaments: updated });
        if (result.tour.currentStageIndex !== tour.currentStageIndex) {
          if (result.tour.structure.stages[result.tour.currentStageIndex]?.stageType === 'BREAK') playBreakSound(); else playLevelUpSound();
        }
      }

    },

    syncAllClocks: () => {
      for (const tour of get().tournaments) get().syncClockTick(tour.id);
    },

    closeBuyIn: (tourId) => {
      if (useAuthStore.getState().currentUser?.role !== 'ADMIN') return { success: false, message: 'Chỉ quản trị viên được đóng Buy-in.' };
      get().syncClockTick(tourId);
      const tour = get().tournaments.find((item) => item.id === tourId);
      if (!tour) return { success: false, message: 'Không tìm thấy giải đấu.' };
      if (isBuyInClosed(tour)) return { success: true };
      const updated = get().tournaments.map((item) => item.id === tourId ? { ...item, buyInClosedAt: new Date().toISOString(), buyInCloseReason: 'MANUAL' as const } : item);
      if (!persistStatistics(updated)) return { success: false, message: 'Không lưu được trạng thái Buy-in.' };
      set({ tournaments: updated }); return { success: true };
    },

    resetTournamentSession: (tourId) => {
      if (useAuthStore.getState().currentUser?.role !== 'ADMIN') return { success: false, message: 'Chỉ quản trị viên được đặt lại phiên giải đấu.' };
      const tour = get().tournaments.find((item) => item.id === tourId);
      if (tour && isSessionFinished(tour)) return { success: false, message: 'Phiên FINISHED đã khóa vĩnh viễn thống kê và runtime.' };
      if (!tour) return { success: false, message: 'Không tìm thấy giải đấu.' };
      const firstLevel = Math.max(0, tour.structure.stages.findIndex((stage) => stage.stageType === 'LEVEL'));
      const firstDuration = Math.max(1, (tour.structure.stages[firstLevel]?.durationMinutes || 20) * 60);
      const now = Date.now();
      const cleared: Tournament = {
        ...tour,
        status: 'PAUSED',
        currentStageIndex: firstLevel,
        stageRemainingSeconds: firstDuration,
        timerStartedAt: undefined,
        lastUpdatedAt: now,
        totalElapsedSeconds: 0,
        startedAt: undefined,
        endedAt: undefined,
        pausedAt: new Date(now).toISOString(),
        buyInClosedAt: undefined,
        buyInCloseReason: undefined,
        participants: [],
        registeredCount: 0,
        statistics: deriveStatistics(tour.startingChips, { entries: 0, uniquePlayers: 0, playersRemaining: 0 }),
        statisticsHistory: [],
        statisticsNeedsReview: false,
        finalRanks: undefined,
      };
      // Archive the previous runtime before reset. Never erase historical counts,
      // chip issuance records or audit history.
      const archived: Tournament = { ...structuredClone(tour), id: crypto.randomUUID(),
        status: 'CANCELLED', timerStartedAt: undefined, endedAt: new Date(now).toISOString() };
      const updated = [archived, ...get().tournaments.map((item) => item.id === tourId ? cleared : item)];
      if (!persistStatistics(updated)) return { success: false, message: 'Không thể đặt lại phiên giải. Vui lòng kiểm tra dung lượng lưu trữ và thử lại.' };
      set({ tournaments: updated });
      return { success: true };
    },

    // Compatibility settings actions edit the permanent template only.
    // Existing session snapshots remain fixed.
    setBuyInCloseBreak: (tourId, breakId) => {
      if (useAuthStore.getState().currentUser?.role !== 'ADMIN') return { success: false, message: 'Chỉ Admin được cấu hình Buy-in.' };
      const tour = get().tournaments.find((item) => item.id === tourId);
      if (!tour) return { success: false, message: 'Không tìm thấy phiên giải.' };
      try {
        useTournamentTemplateStore.getState().updateTemplate(tour.templateId || tour.id, { buyInCloseBreakId: breakId || undefined, registrationEndStageId: undefined });
        return { success: true };
      } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Không lưu được cấu hình Buy-in.' }; }
    },

    setRegistrationEnd: (tourId, stageId) => {
      if (useAuthStore.getState().currentUser?.role !== 'ADMIN') return { success: false, message: 'Chỉ Admin được cấu hình Buy-in.' };
      const tour = get().tournaments.find((item) => item.id === tourId);
      if (!tour) return { success: false, message: 'Không tìm thấy phiên giải.' };
      try {
        useTournamentTemplateStore.getState().updateTemplate(tour.templateId || tour.id, { registrationEndStageId: stageId || undefined, buyInCloseBreakId: undefined });
        return { success: true };
      } catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Không lưu được cấu hình Buy-in.' }; }
    },

    correctStatistics: (tourId, statistics, reason, expectedHistoryId) => {
      if (!statisticsActor()) return { success: false, message: 'Chỉ quản trị viên và thu ngân được chỉnh sửa thống kê.' };
      const tour = get().tournaments.find((t) => t.id === tourId);
      if (tour && isSessionFinished(tour)) return { success: false, message: 'Phiên FINISHED đã khóa vĩnh viễn thống kê và runtime.' };
      if (!tour) return { success: false, message: 'Không tìm thấy giải đấu.' };
      if (tour.statisticsHistory?.at(-1)?.id !== expectedHistoryId) return { success: false, message: 'Thống kê đã thay đổi. Vui lòng mở lại để đối soát số liệu mới nhất.' };
      const calculated = deriveStatistics(tour.startingChips, statistics);
      const errors = validateStatistics(calculated, tour.startingChips);
      if (Object.keys(errors).length) return { success: false, message: Object.values(errors)[0]! };
      try { getTournamentPrizePayouts(calculated.entries, tour.prizeConfiguration); }
      catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Không tính được giải thưởng.' }; }
      if (reason.trim().length > 500) return { success: false, message: 'Ghi chú điều chỉnh không được vượt quá 500 ký tự.' };
      if (calculated.playersRemaining > tour.maxPlayers) {
        return { success: false, message: 'Số người còn lại vượt giới hạn người chơi của giải.' };
      }
      const corrected = { ...withStatisticsChange(tour, calculated, 'CORRECTION', reason.trim() || 'Cập nhật thống kê'), statisticsNeedsReview: false, registeredCount: calculated.entries };
      const updated = get().tournaments.map((t) => t.id === tourId ? corrected : t);
      if (!persistStatistics(updated)) return { success: false, message: 'Không thể lưu thống kê. Vui lòng kiểm tra dung lượng lưu trữ và thử lại.' };
      set({ tournaments: updated });
      return { success: true };
    },

    issueChips: (tourId, type, playerId, chips, reason, expectedHistoryId) => {
      if (!statisticsActor()) return { success: false, message: 'Chỉ quản trị viên và thu ngân được cấp chip.' };
      get().syncClockTick(tourId);
      const tour = get().tournaments.find((t) => t.id === tourId);
      if (tour && isSessionFinished(tour)) return { success: false, message: 'Phiên FINISHED đã khóa vĩnh viễn thống kê và runtime.' };
      if (!tour) return { success: false, message: 'Không tìm thấy giải đấu.' };
      if (tour.entryStackOnly && (type === 'RE_BUY' || type === 'ADD_ON' || chips !== tour.startingChips)) return { success: false, message: 'Phiên mới chỉ cấp một Starting Stack cho mỗi Entry; không hỗ trợ Re-buy/Add-on độc lập.' };
      if (tour.status === 'COMPLETED' || tour.status === 'CANCELLED') return { success: false, message: 'Không thể cấp chip cho giải đã kết thúc hoặc bị hủy.' };
      if (tour.statisticsHistory?.at(-1)?.id !== expectedHistoryId) return { success: false, message: 'Thống kê đã thay đổi. Vui lòng mở lại để ghi nhận số liệu mới nhất.' };
      if (type !== 'ADD_ON' && isBuyInClosed(tour)) return { success: false, message: 'Buy-in đã đóng. Không thể ghi nhận Buy-in, mua lại hoặc tái tham gia; thống kê vẫn có thể đối soát.' };
      if (!['BUY_IN', 'RE_ENTRY', 'RE_BUY', 'ADD_ON'].includes(type)) return { success: false, message: 'Loại cấp chip không hợp lệ.' };
      if (!Number.isSafeInteger(chips) || chips <= 0) return { success: false, message: 'Số chip cấp phải là số nguyên dương trong giới hạn an toàn.' };
      if (!reason.trim() || reason.trim().length > 500) return { success: false, message: 'Lý do cấp chip phải có từ 1 đến 500 ký tự.' };
      const previousEntries = tour.participants.filter((p) => p.playerId === playerId);
      const activeEntry = previousEntries.find((p) => !p.isEliminated);
      const user = useAuthStore.getState().users.find((u) => u.id === playerId && u.role === 'PLAYER');
      const playerName = user?.fullName || previousEntries[0]?.playerName;
      if (!playerName) return { success: false, message: 'Vui lòng chọn một hội viên hợp lệ.' };
      if (type === 'BUY_IN' && previousEntries.length) return { success: false, message: 'Hội viên đã có lượt tham gia. Chọn Re-entry, Re-buy hoặc Add-on phù hợp.' };
      if (type === 'RE_ENTRY' && (!previousEntries.length || activeEntry)) return { success: false, message: 'Re-entry chỉ áp dụng khi hội viên đã có lượt tham gia và hiện đã bị loại.' };
      if ((type === 'RE_BUY' || type === 'ADD_ON') && !activeEntry) return { success: false, message: 'Re-buy/Add-on cần một lượt tham gia đang hoạt động.' };
      const isEntry = type === 'BUY_IN' || type === 'RE_ENTRY';
      const before = getTournamentStatistics(tour);
      if (isEntry && before.playersRemaining >= tour.maxPlayers) return { success: false, message: 'Số người chơi còn lại đã đạt giới hạn của giải.' };
      const after = deriveStatistics(tour.startingChips, {
        entries: before.entries + (isEntry ? 1 : 0),
        uniquePlayers: before.uniquePlayers + (type === 'BUY_IN' ? 1 : 0),
        playersRemaining: before.playersRemaining + (isEntry ? 1 : 0) });
      if (Object.keys(validateStatistics(after, tour.startingChips)).length || (activeEntry && !Number.isSafeInteger(activeEntry.currentChips + chips))) {
        return { success: false, message: 'Thống kê sau khi cấp chip vượt giới hạn hợp lệ.' };
      }
      try { getTournamentPrizePayouts(after.entries, tour.prizeConfiguration); }
      catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Không tính được giải thưởng.' }; }
      const participants = isEntry ? [...tour.participants, {
        id: crypto.randomUUID(), playerId, playerName, phone: user?.phone,
        initialChips: chips, currentChips: chips, isEliminated: false,
      }] : tour.participants.map((p) => p.id === activeEntry!.id ? { ...p, currentChips: p.currentChips + chips } : p);
      const issued = { ...withStatisticsChange(tour, after, type, reason, { playerId, playerName, chipsIssued: chips }), participants, registeredCount: after.entries };
      const updated = get().tournaments.map((t) => t.id === tourId ? issued : t);
      if (!persistStatistics(updated)) return { success: false, message: 'Không thể lưu thống kê. Vui lòng kiểm tra dung lượng lưu trữ và thử lại.' };
      set({ tournaments: updated });
      return { success: true };
    },

    eliminateParticipant: (tourId, participantId, rank) => {
      if (!statisticsActor()) return { success: false, message: 'Chỉ quản trị viên và thu ngân được cập nhật người chơi.' };
      const tour = get().tournaments.find((t) => t.id === tourId);
      if (tour && isSessionFinished(tour)) return { success: false, message: 'Phiên FINISHED đã khóa vĩnh viễn thống kê và runtime.' };
      const participant = tour?.participants.find((p) => p.id === participantId);
      if (!tour || !participant || participant.isEliminated) return { success: false, message: 'Lượt tham gia không tồn tại hoặc đã bị loại.' };
      const before = getTournamentStatistics(tour);
      if (before.playersRemaining === 0) return { success: false, message: 'Không còn người chơi để loại.' };
      if (rank !== undefined && (!Number.isSafeInteger(rank) || rank < 1)) return { success: false, message: 'Thứ hạng phải là số nguyên dương.' };
      const after = { ...before, playersRemaining: before.playersRemaining - 1 };
      const eliminated = { ...withStatisticsChange(tour, after, 'ELIMINATION', 'Ghi nhận người chơi bị loại', {
        playerId: participant.playerId, playerName: participant.playerName,
        previousPlayerStack: participant.currentChips, nextPlayerStack: 0,
      }), participants: tour.participants.map((p) => p.id === participantId ? {
        ...p, isEliminated: true, eliminatedRank: rank || before.playersRemaining,
        eliminatedAt: new Date().toISOString(), currentChips: 0,
      } : p) };
      const updated = get().tournaments.map((t) => t.id === tourId ? eliminated : t);
      if (!persistStatistics(updated)) return { success: false, message: 'Không thể lưu thống kê. Vui lòng kiểm tra dung lượng lưu trữ và thử lại.' };
      set({ tournaments: updated });
      return { success: true };
    },

    updateChips: (tourId, participantId, chips) => {
      if (!statisticsActor()) return { success: false, message: 'Chỉ quản trị viên và thu ngân được cập nhật chip.' };
      const tour = get().tournaments.find((t) => t.id === tourId);
      if (tour && isSessionFinished(tour)) return { success: false, message: 'Phiên FINISHED đã khóa vĩnh viễn thống kê và runtime.' };
      const participant = tour?.participants.find((p) => p.id === participantId);
      if (!tour || !participant || participant.isEliminated) return { success: false, message: 'Không thể sửa chip của lượt đã bị loại hoặc không tồn tại.' };
      const statistics = getTournamentStatistics(tour);
      // Historical Re-buy/Add-on allocations can exceed the session summary.
      // The summary deliberately follows Entries × Starting Stack, so retain
      // those allocations instead of silently rejecting or rewriting them.
      if (!Number.isSafeInteger(chips) || chips < 0) return { success: false, message: 'Chip người chơi phải là số nguyên không âm trong giới hạn an toàn.' };
      if (participant.currentChips === chips) return { success: true };
      const changed = { ...withStatisticsChange(tour, statistics, 'PLAYER_STACK', 'Cập nhật phân bổ chip; không phát hành chip mới', {
        playerId: participant.playerId, playerName: participant.playerName,
        previousPlayerStack: participant.currentChips, nextPlayerStack: chips,
      }), participants: tour.participants.map((p) => p.id === participantId ? { ...p, currentChips: chips } : p) };
      const updated = get().tournaments.map((t) => t.id === tourId ? changed : t);
      if (!persistStatistics(updated)) return { success: false, message: 'Không thể lưu thống kê. Vui lòng kiểm tra dung lượng lưu trữ và thử lại.' };
      set({ tournaments: updated });
      return { success: true };
    },
  };
});

// Keep the standalone TV tab in sync with confirmed management changes.
// No write-back here: receiving a storage event must not create an event loop.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const refresh = (event: StorageEvent) => {
    if (event.key === POINTS_LEDGER_KEY) { useTournamentSessionStore.getState().refreshRewardProcessing(); return; }
    if (event.key !== TOURNAMENT_REPOSITORY_KEY) return;
    const loaded = loadTournamentRepository();
    if (loaded.error) { useTournamentSessionStore.setState({ loadError: loaded.error }); return; }
    const tournaments = projectTournamentRewards(loaded.data.sessions.map(hydrateSession).map(normalizeStatistics));
    useTournamentSessionStore.setState({ tournaments, sessions: tournaments.map(serializeSession), loadError: null });
  };
  window.addEventListener('storage', refresh);
  if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('storage', refresh));
}
