import { create } from 'zustand';
import { Tournament, BlindStructureConfig, TourStatus, TourParticipant } from '../types/tournament';
import { INITIAL_TOURNAMENTS } from '../mocks/initialData';
import { playLevelUpSound, playBreakSound } from '../utils/audio';
import { usePointsStore } from './pointsStore';

interface TournamentState {
  tournaments: Tournament[];
  activeTourId: string | null;

  // Tournament CRUD
  createTournament: (tourData: {
    name: string;
    description?: string;
    startingChips: number;
    maxPlayers: number;
    scheduledStartTime: string;
    structure: BlindStructureConfig;
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
  endTournament: (tourId: string) => void;
  syncClockTick: (tourId: string) => void;

  // Participant actions
  eliminateParticipant: (tourId: string, participantId: string, rank?: number) => void;
  updateChips: (tourId: string, participantId: string, chips: number) => void;
}

const STORAGE_KEY_TOURS = 'poker_cafe_tournaments';

function loadStoredTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOURS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading tournaments', e);
  }
  return INITIAL_TOURNAMENTS;
}

export const useTournamentStore = create<TournamentState>((set, get) => {
  const initialTournaments = loadStoredTournaments();
  const runningTour = initialTournaments.find((t) => t.status === 'RUNNING');

  return {
    tournaments: initialTournaments,
    activeTourId: runningTour ? runningTour.id : (initialTournaments[0]?.id || null),

    createTournament: (data) => {
      const { tournaments } = get();
      const now = new Date();
      const codeSuffix = String(tournaments.length + 1).padStart(2, '0');
      const code = `TOUR-${now.toISOString().slice(2, 7).replace('-', '')}-${codeSuffix}`;

      const firstStageDuration = data.structure.stages[0]?.durationMinutes || 20;

      const participants: TourParticipant[] = data.participants.map((p, idx) => ({
        id: `part-${Date.now()}-${idx}`,
        playerId: p.playerId,
        playerName: p.playerName,
        phone: p.phone,
        initialChips: data.startingChips,
        currentChips: data.startingChips,
        isEliminated: false,
      }));

      const newTour: Tournament = {
        id: `tour-${Date.now()}`,
        code,
        name: data.name,
        description: data.description,
        startingChips: data.startingChips,
        maxPlayers: data.maxPlayers,
        registeredCount: participants.length,
        status: 'CREATED',
        scheduledStartTime: data.scheduledStartTime,
        structure: data.structure,
        currentStageIndex: 0,
        stageRemainingSeconds: firstStageDuration * 60,
        totalElapsedSeconds: 0,
        participants,
        createdAt: now.toISOString(),
        createdBy: data.createdBy,
      };

      const updated = [newTour, ...tournaments];
      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated, activeTourId: newTour.id });
      return newTour;
    },

    updateTournament: (id: string, updated: Partial<Tournament>) => {
      const { tournaments } = get();
      const updatedTours = tournaments.map((t) =>
        t.id === id ? { ...t, ...updated } : t
      );
      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updatedTours));
      set({ tournaments: updatedTours });
    },

    deleteTournament: (id: string) => {
      const { tournaments, activeTourId } = get();
      const updatedTours = tournaments.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updatedTours));
      set({
        tournaments: updatedTours,
        activeTourId: activeTourId === id ? updatedTours[0]?.id || null : activeTourId,
      });
    },

    setActiveTourId: (id) => set({ activeTourId: id }),

    startTournament: (tourId: string) => {
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour) return;

      const firstStageSec = (tour.structure.stages[0]?.durationMinutes || 20) * 60;
      const now = Date.now();

      const updated = tournaments.map((t) =>
        t.id === tourId
          ? {
              ...t,
              status: 'RUNNING' as TourStatus,
              startedAt: t.startedAt || new Date().toISOString(),
              timerStartedAt: now,
              stageRemainingSeconds: t.stageRemainingSeconds > 0 ? t.stageRemainingSeconds : firstStageSec,
            }
          : t
      );

      playLevelUpSound();
      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated });
    },

    pauseTournament: (tourId: string) => {
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour || tour.status !== 'RUNNING') return;

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
              timerStartedAt: undefined,
              pausedAt: new Date().toISOString(),
            }
          : t
      );

      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated });
    },

    resumeTournament: (tourId: string) => {
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour || tour.status !== 'PAUSED') return;

      const now = Date.now();
      const updated = tournaments.map((t) =>
        t.id === tourId
          ? {
              ...t,
              status: 'RUNNING' as TourStatus,
              timerStartedAt: now,
              pausedAt: undefined,
            }
          : t
      );

      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated });
    },

    nextStage: (tourId: string) => {
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour) return;

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
          ? {
              ...t,
              currentStageIndex: nextIndex,
              stageRemainingSeconds: newDurationSec,
              timerStartedAt: t.status === 'RUNNING' ? Date.now() : undefined,
            }
          : t
      );

      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated });
    },

    prevStage: (tourId: string) => {
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour) return;

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
            }
          : t
      );

      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated });
    },

    resetCurrentStage: (tourId: string) => {
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour) return;

      const currentStage = tour.structure.stages[tour.currentStageIndex];
      const initialSec = (currentStage?.durationMinutes || 20) * 60;

      const updated = tournaments.map((t) =>
        t.id === tourId
          ? {
              ...t,
              stageRemainingSeconds: initialSec,
              timerStartedAt: t.status === 'RUNNING' ? Date.now() : undefined,
            }
          : t
      );

      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated });
    },

    endTournament: (tourId: string) => {
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour) return;

      // Calculate final ranks based on chip counts or remaining players
      const sortedParticipants = [...tour.participants].sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1;
        if (!a.isEliminated && b.isEliminated) return -1;
        if (a.isEliminated && b.isEliminated) {
          return (a.eliminatedRank || 99) - (b.eliminatedRank || 99);
        }
        return b.currentChips - a.currentChips;
      });

      const pointRewards = [1500, 900, 600, 350, 200, 100];
      const finalRanks = sortedParticipants.slice(0, 6).map((p, idx) => ({
        rank: idx + 1,
        playerId: p.playerId,
        playerName: p.playerName,
        points: pointRewards[idx] || 50,
      }));

      // Automatically generate pending point requests for the winners!
      const pointsStore = usePointsStore.getState();
      finalRanks.forEach((rankItem) => {
        const rankLabels = ['Quán Quân (Hạng 1)', 'Á Quân (Hạng 2)', 'Quý Quân (Hạng 3)', 'Hạng 4', 'Hạng 5', 'Hạng 6'];
        const label = rankLabels[rankItem.rank - 1] || `Hạng ${rankItem.rank}`;
        pointsStore.createRequest({
          playerId: rankItem.playerId,
          playerName: rankItem.playerName,
          amount: rankItem.points,
          pointType: 'TOUR_REWARD',
          reason: `Thưởng thành tích ${label} giải ${tour.name}`,
          tournamentId: tour.id,
          tournamentName: tour.name,
          tournamentRank: rankItem.rank,
          requestedBy: {
            id: 'system',
            name: 'Hệ Thống Tournament Clock',
            role: 'SYSTEM',
          },
        });
      });

      const updated = tournaments.map((t) =>
        t.id === tourId
          ? {
              ...t,
              status: 'COMPLETED' as TourStatus,
              endedAt: new Date().toISOString(),
              timerStartedAt: undefined,
              stageRemainingSeconds: 0,
              finalRanks,
            }
          : t
      );

      playLevelUpSound();
      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated });
    },

    syncClockTick: (tourId: string) => {
      const { tournaments } = get();
      const tour = tournaments.find((t) => t.id === tourId);
      if (!tour || tour.status !== 'RUNNING' || !tour.timerStartedAt) return;

      const now = Date.now();
      const elapsedSinceStart = Math.floor((now - tour.timerStartedAt) / 1000);
      const remaining = tour.stageRemainingSeconds - elapsedSinceStart;

      if (remaining <= 0) {
        // Level completed! Automatically advance to next stage!
        get().nextStage(tourId);
      } else {
        // Update total elapsed time
        const updated = tournaments.map((t) =>
          t.id === tourId
            ? {
                ...t,
                totalElapsedSeconds: t.totalElapsedSeconds + 1,
              }
            : t
        );
        set({ tournaments: updated });
      }
    },

    eliminateParticipant: (tourId: string, participantId: string, rank?: number) => {
      const { tournaments } = get();
      const updated = tournaments.map((t) => {
        if (t.id !== tourId) return t;
        const activeCount = t.participants.filter((p) => !p.isEliminated).length;
        const assignedRank = rank || activeCount;

        return {
          ...t,
          participants: t.participants.map((p) =>
            p.id === participantId
              ? {
                  ...p,
                  isEliminated: true,
                  eliminatedRank: assignedRank,
                  eliminatedAt: new Date().toISOString(),
                  currentChips: 0,
                }
              : p
          ),
        };
      });

      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated });
    },

    updateChips: (tourId: string, participantId: string, chips: number) => {
      const { tournaments } = get();
      const updated = tournaments.map((t) => {
        if (t.id !== tourId) return t;
        return {
          ...t,
          participants: t.participants.map((p) =>
            p.id === participantId ? { ...p, currentChips: Math.max(0, chips) } : p
          ),
        };
      });

      localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(updated));
      set({ tournaments: updated });
    },
  };
});

