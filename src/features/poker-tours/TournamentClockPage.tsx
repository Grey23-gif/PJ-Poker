import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../../stores/tournamentStore';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import {
  formatSecondsToMMSS,
  formatElapsedSeconds,
  formatChipK,
  formatNumber,
} from '../../utils/formatters';
import { playLevelUpSound, playBreakSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Coffee,
  ArrowLeft,
  Users,
  Award,
  Settings,
  Spade,
} from 'lucide-react';

export const TournamentClockPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    tournaments,
    startTournament,
    pauseTournament,
    resumeTournament,
    nextStage,
    prevStage,
    resetCurrentStage,
    endTournament,
    eliminateParticipant,
    updateChips,
  } = useTournamentStore();

  const { currentUser, hasPermission } = useAuthStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  // Live wall-clock time in top right ('11:11' style)
  const [wallClockTime, setWallClockTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setWallClockTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Robust Tour Finder: Handles "tour 101", "tour-101", "tour_101", codes, or fallbacks!
  const currentTour = useMemo(() => {
    if (!tournaments || tournaments.length === 0) return null;

    const rawId = id ? decodeURIComponent(id).trim() : '';
    if (rawId) {
      const normalizedWithDash = rawId.replace(/\s+/g, '-');
      const normalizedWithSpace = rawId.replace(/-/g, ' ');

      const match = tournaments.find(
        (t) =>
          t.id.toLowerCase() === rawId.toLowerCase() ||
          t.id.toLowerCase() === normalizedWithDash.toLowerCase() ||
          t.id.replace(/-/g, ' ').toLowerCase() === normalizedWithSpace.toLowerCase() ||
          t.code.toLowerCase() === rawId.toLowerCase() ||
          t.name.toLowerCase().includes(rawId.toLowerCase())
      );
      if (match) return match;
    }

    // Fallback to active running tour or first tour
    return tournaments.find((t) => t.status === 'RUNNING') || tournaments[0] || null;
  }, [tournaments, id]);

  // Pure client countdown timer calculation
  const [displaySeconds, setDisplaySeconds] = useState(1200);
  const isAdvancingRef = useRef(false);

  useEffect(() => {
    if (!currentTour) return;

    const calcRemaining = () => {
      if (currentTour.status === 'RUNNING' && currentTour.timerStartedAt) {
        const elapsed = Math.floor((Date.now() - currentTour.timerStartedAt) / 1000);
        const rem = Math.max(0, currentTour.stageRemainingSeconds - elapsed);
        setDisplaySeconds(rem);

        // When countdown reaches 0: auto-advance once!
        if (rem === 0 && !isAdvancingRef.current) {
          isAdvancingRef.current = true;
          handleNextStage();
          setTimeout(() => {
            isAdvancingRef.current = false;
          }, 2000);
        }
      } else {
        setDisplaySeconds(currentTour.stageRemainingSeconds);
      }
    };

    calcRemaining();
    const interval = setInterval(calcRemaining, 500);
    return () => clearInterval(interval);
  }, [
    currentTour?.id,
    currentTour?.status,
    currentTour?.timerStartedAt,
    currentTour?.stageRemainingSeconds,
  ]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts (Space = Play/Pause, F = Fullscreen, M = Mute, Right/Left = Stages)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (currentTour?.status === 'RUNNING') pauseTournament(currentTour.id);
        else if (currentTour?.status === 'PAUSED') resumeTournament(currentTour.id);
        else if (currentTour?.status === 'CREATED') startTournament(currentTour.id);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        setSoundEnabled((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        setShowControls((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTour]);

  // Confetti celebration when tour finishes
  useEffect(() => {
    if (currentTour?.status === 'COMPLETED') {
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#10b981', '#38bdf8', '#ffffff'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [currentTour?.status]);

  if (!currentTour) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <p className="text-base text-slate-200 mb-2">Chưa có thông tin giải đấu nào trong hệ thống.</p>
        <Link to="/tours">
          <Button variant="emerald">Quay Lại Danh Sách Giải Đấu</Button>
        </Link>
      </div>
    );
  }

  // Safe stage parsing
  const stages = currentTour.structure?.stages || [];
  const currentStageIndex = currentTour.currentStageIndex || 0;
  const currentStage = stages[currentStageIndex] ||
    stages[0] || {
      id: 'default',
      stageType: 'LEVEL',
      levelNumber: 1,
      smallBlind: 800,
      bigBlind: 1600,
      ante: 1600,
      durationMinutes: 20,
      name: 'Level 1',
    };

  const isBreak = currentStage.stageType === 'BREAK';

  // Next level preview
  const nextStageIndex = currentStageIndex + 1;
  const upcomingStage = nextStageIndex < stages.length ? stages[nextStageIndex] : null;

  // Next break calculation
  const nextBreakIndex = stages.findIndex(
    (s, idx) => idx > currentStageIndex && s.stageType === 'BREAK'
  );
  const nextBreakStage = nextBreakIndex !== -1 ? stages[nextBreakIndex] : null;

  // Calculate total seconds to next break
  let secondsToNextBreak = 0;
  let levelsRemainingToBreak = 0;
  if (!isBreak && nextBreakStage) {
    secondsToNextBreak = displaySeconds;
    for (let i = currentStageIndex + 1; i < nextBreakIndex; i++) {
      if (stages[i].stageType === 'LEVEL') {
        levelsRemainingToBreak++;
        secondsToNextBreak += (stages[i].durationMinutes || 15) * 60;
      }
    }
  }

  const canControl = currentUser?.role === 'ADMIN' || hasPermission('TOUR_OPERATE');

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Sound Handler on Stage Change
  const handleNextStage = () => {
    if (soundEnabled) {
      if (upcomingStage?.stageType === 'BREAK') playBreakSound();
      else playLevelUpSound();
    }
    nextStage(currentTour.id);
  };

  // Participants & Chips metrics
  const participants = currentTour.participants || [];
  const activePlayers = participants.filter((p) => !p.isEliminated);
  const totalChipsInPlay =
    participants.reduce((sum, p) => sum + (p.currentChips || 0), 0) || 460000;
  const averageChips =
    activePlayers.length > 0
      ? Math.round(totalChipsInPlay / activePlayers.length)
      : Math.round(totalChipsInPlay / 26);
  const currentBB = currentStage.bigBlind || 1600;
  const averageBB = currentBB > 0 ? Math.round(averageChips / currentBB) : 11;

  // Prizes
  const totalPrize = currentTour.totalPrizePool || 690;
  const firstPrize = currentTour.firstPlacePrize || 345;
  const placesPaid = currentTour.placesPaid || 3;
  const totalRegistered = Math.max(participants.length, currentTour.registeredCount || 40);

  return (
    <div
      className={`tournament-clock relative min-h-[85vh] flex flex-col justify-between bg-[#0a121c] text-white border border-surface-border rounded-2xl overflow-hidden select-none font-sans ${
        isFullscreen ? 'clock-fullscreen !fixed inset-0 z-50 !rounded-none border-none min-h-screen w-screen' : ''
      }`}
    >
      {/* ============================================================== */}
      {/* 1. TOP HEADER BAR (Logo, Tour Name, Digital Wall Clock)        */}
      {/* ============================================================== */}
      <header className="relative z-10 h-14 sm:h-16 px-4 sm:px-8 border-b border-slate-800/80 flex items-center justify-between bg-black/40 backdrop-blur-sm shrink-0">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            to="/tours"
            className="flex items-center gap-2 group text-slate-300 hover:text-white transition-colors"
            title="Quay lại danh sách giải đấu"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/20">
              <Spade className="w-4 h-4 text-emerald-300" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                ROYAL POKER
              </div>
              <div className="text-xs font-bold text-slate-200">ĐỒNG HỒ GIẢI ĐẤU</div>
            </div>
          </Link>
        </div>

        {/* Center: Tournament Name (matches 'Friday Night Deepstack' in image) */}
        <div className="text-center truncate px-4 max-w-xs sm:max-w-md md:max-w-xl">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-wide truncate">
            {currentTour.name}
          </h2>
        </div>

        {/* Right: Digital Clock (matches '11:11' in image) & Fullscreen */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="font-mono text-lg sm:text-2xl font-semibold text-white tracking-wider">
            {wallClockTime}
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Mở toàn màn hình'}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Toàn màn hình (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN 3-PANEL LAYOUT                                         */}
      {/* ============================================================== */}
      <div className="clock-main relative z-10 flex-1 grid grid-cols-12 min-h-0">
        {/* ------------------------------------------------------------ */}
        {/* LEFT PANEL: TIME TO BREAK TIME (User Requested Replacement)  */}
        {/* ------------------------------------------------------------ */}
        <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-slate-800/80 p-5 sm:p-6 flex flex-col justify-between bg-black/20">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Coffee className="w-5 h-5 " />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  KỲ NGHỈ GIẢI LAO
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  {isBreak ? 'Đang Nghỉ Giải Lao' : 'Thời Gian Đến Break'}
                </h3>
              </div>
            </div>

            {/* Countdown Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-surface-border text-center space-y-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                {isBreak ? 'Thời gian nghỉ còn lại' : 'Đếm ngược đến giờ nghỉ'}
              </span>

              <div
                className={`font-mono text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight ${
                  isBreak
                    ? 'text-amber-400 animate-pulse'
                    : secondsToNextBreak <= 300 && secondsToNextBreak > 0
                    ? 'text-amber-300 animate-pulse'
                    : 'text-amber-400'
                }`}
              >
                {isBreak
                  ? formatSecondsToMMSS(displaySeconds)
                  : nextBreakStage
                  ? formatSecondsToMMSS(secondsToNextBreak)
                  : '--:--'}
              </div>

              <div className="text-xs font-semibold text-amber-300/90 pt-1">
                {isBreak ? (
                  <span>Vui lòng nghỉ ngơi & dùng đồ uống cafe</span>
                ) : nextBreakStage ? (
                  <span>Khoảng {Math.max(1, Math.ceil(secondsToNextBreak / 60))} phút nữa</span>
                ) : (
                  <span className="text-slate-500">Đã qua các đợt nghỉ</span>
                )}
              </div>
            </div>

            {/* Break Information Details */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Đợt nghỉ tiếp theo:</span>
                  <span className="font-bold text-slate-200">
                    {nextBreakStage ? nextBreakStage.name : isBreak ? 'Đang diễn ra' : 'Không còn'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Thời lượng nghỉ:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {nextBreakStage
                      ? `${nextBreakStage.durationMinutes} phút`
                      : isBreak
                      ? `${currentStage.durationMinutes} phút`
                      : '--'}
                  </span>
                </div>

                {!isBreak && nextBreakStage && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Số Level trước Break:</span>
                    <span className="font-bold text-emerald-400">
                      Còn {levelsRemainingToBreak + 1} Level nữa
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Button to View/Manage Chips */}
          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setIsPlayerModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Danh Sách Chip Hội Viên
              </span>
              <span className="text-[11px] font-bold text-emerald-400 font-mono">
                {activePlayers.length} người
              </span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* CENTER PANEL: THE TOURNAMENT CLOCK (Match Image)             */}
        {/* ------------------------------------------------------------ */}
        <div className="clock-center col-span-12 md:col-span-6 flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-center">
          {/* Main Clock & Blinds Area */}
          <div className="my-auto space-y-2 sm:space-y-4">
            {/* Stage / Level Headline (e.g. 'Level 5' in image) */}
            <div className="text-lg sm:text-2xl md:text-3xl font-semibold text-white tracking-wide">
              {isBreak ? (
                <span className="text-amber-400 font-semibold">{currentStage.name}</span>
              ) : (
                <span>{currentStage.name}</span>
              )}
            </div>

            {/* Massive Digital Timer Display (e.g. '14:52' in image) */}
            <div className="relative py-1">
              <div
                className={`clock-display font-mono font-semibold ${
                  isBreak
                    ? 'text-amber-400'
                    : currentTour.status === 'PAUSED'
                    ? 'text-slate-400 opacity-60'
                    : displaySeconds <= 60 && displaySeconds > 0
                    ? 'text-rose-500 animate-pulse'
                    : 'text-white'
                }`}
              >
                {formatSecondsToMMSS(displaySeconds)}
              </div>

              {currentTour.status === 'PAUSED' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-lg sm:text-xl uppercase tracking-widest shadow-2xl">
                    ĐANG TẠM DỪNG
                  </span>
                </div>
              )}
            </div>

            {/* Blinds Title & Values (e.g. 'Blinds \n 800 | 1,6K (1,6K)') */}
            {!isBreak ? (
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest block">
                  Mức cược
                </span>
                <div className="text-2xl sm:text-4xl md:text-5xl font-semibold text-white font-mono tracking-tight">
                  {formatChipK(currentStage.smallBlind || 0)} | {formatChipK(currentStage.bigBlind || 0)}{' '}
                  <span className="text-slate-300">
                    ({formatChipK(currentStage.ante || currentStage.bigBlind || 0)})
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl max-w-md mx-auto text-amber-300 text-xs">
                GIỜ NGHỈ GIẢI LAO - CÁC TAY BÀI NGHỈ NGƠI VÀ BÀN GIAO CHIP TẠI BÀN
              </div>
            )}

            {/* Next Level & Next Break (matches 'Next Level \n 1,5K | 3K (3K) \n Next Break in 30 min') */}
            <div className="space-y-1 pt-1">
              {upcomingStage && (
                <div className="text-xs sm:text-sm text-slate-400">
                  <span className="text-slate-400 block font-medium">Vòng tiếp theo</span>
                  <strong className="text-sm sm:text-base font-bold text-slate-200 font-mono">
                    {formatChipK(upcomingStage.smallBlind || 0)} | {formatChipK(upcomingStage.bigBlind || 0)}{' '}
                    ({formatChipK(upcomingStage.ante || upcomingStage.bigBlind || 0)})
                  </strong>
                </div>
              )}

              {nextBreakStage && !isBreak && (
                <div className="text-[11px] sm:text-xs text-amber-400/90 font-medium pt-1">
                  Nghỉ sau {Math.max(1, Math.ceil(secondsToNextBreak / 60))} phút
                </div>
              )}
            </div>
          </div>

          {/* Bottom Center 3 Stat Boxes (Chip khởi đầu | Chip trung bình | Tổng chip) */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 divide-x divide-slate-800 text-center">
            {/* Box 1: Chip khởi đầu */}
            <div className="px-2">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Chip khởi đầu
              </span>
              <div className="text-base sm:text-xl lg:text-2xl font-semibold text-sky-400 font-mono mt-0.5">
                {formatChipK(currentTour.startingChips || 10000)}
              </div>
            </div>

            {/* Box 2: Chip trung bình (e.g. '17,7K(11 BB)') */}
            <div className="px-2">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Chip trung bình
              </span>
              <div className="text-base sm:text-xl lg:text-2xl font-semibold text-sky-400 font-mono mt-0.5">
                {formatChipK(averageChips)}
                <span className="text-xs font-bold text-sky-300 ml-1">
                  ({averageBB} BB)
                </span>
              </div>
            </div>

            {/* Box 3: Tổng chip (e.g. '460K') */}
            <div className="px-2">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Tổng chip
              </span>
              <div className="text-base sm:text-xl lg:text-2xl font-semibold text-sky-400 font-mono mt-0.5">
                {formatChipK(totalChipsInPlay)}
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT PANEL: PRIZES & STATUS (Match Image)                   */}
        {/* ------------------------------------------------------------ */}
        <div className="col-span-12 md:col-span-3 border-t md:border-t-0 md:border-l border-slate-800/80 p-5 sm:p-6 flex flex-col justify-between bg-black/20 text-center">
          <div className="space-y-4 sm:space-y-5">
            {/* Tổng giải thưởng (matches '690 đ' in image) */}
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                Tổng giải thưởng
              </span>
              <div className="text-2xl sm:text-4xl lg:text-5xl font-semibold text-yellow-400 font-mono tracking-tight">
                {formatNumber(totalPrize)} đ
              </div>
            </div>

            {/* Hạng nhất (matches '345 đ' in image) */}
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                Hạng nhất
              </span>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-yellow-400 font-mono tracking-tight">
                {formatNumber(firstPrize)} đ
              </div>
            </div>

            {/* Giải tiếp theo (matches '0 đ' in image) */}
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                Giải tiếp theo
              </span>
              <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-yellow-400/90 font-mono tracking-tight">
                0 đ
              </div>
            </div>

            {/* Số hạng nhận thưởng (matches '3' in image) */}
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                Số hạng nhận thưởng
              </span>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-emerald-400 font-mono">
                {placesPaid}
              </div>
            </div>

            {/* Người chơi còn lại (matches '26 / 40' in image) */}
            <div className="space-y-0.5 pt-2 border-t border-slate-800">
              <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                Người chơi còn lại
              </span>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-emerald-400 font-mono tracking-tight">
                {activePlayers.length} / {totalRegistered}
              </div>
            </div>
          </div>

          {/* Elapsed tournament time footer */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
            Đã diễn ra: {formatElapsedSeconds(currentTour.totalElapsedSeconds || 0)}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM OPERATOR CONTROL BAR                                 */}
      {/* ============================================================== */}
      <div className="relative z-20 bg-slate-950/95 border-t border-slate-800/90 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <button
            aria-expanded={showControls}
            onClick={() => setShowControls(!showControls)}
            className="flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Phím điều khiển {showControls ? '▲' : '▼'}</span>
          </button>
          <span className="hidden lg:inline text-slate-500">
            [Phím tắt: Space = Chạy/Dừng, F = Toàn màn hình, M = Âm thanh]
          </span>
        </div>

        {showControls && canControl && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Prev Stage */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<SkipBack className="w-3.5 h-3.5" />}
              disabled={currentStageIndex === 0}
              onClick={() => prevStage(currentTour.id)}
              title="Lùi về Level trước"
            >
              Lùi Level
            </Button>

            {/* Play / Pause / Resume */}
            {currentTour.status === 'RUNNING' ? (
              <Button
                variant="gold"
                size="md"
                leftIcon={<Pause className="w-4 h-4" />}
                onClick={() => pauseTournament(currentTour.id)}
                className="font-bold min-w-[120px] shadow-glow-gold"
              >
                Tạm Dừng
              </Button>
            ) : currentTour.status === 'PAUSED' ? (
              <Button
                variant="emerald"
                size="md"
                leftIcon={<Play className="w-4 h-4" />}
                onClick={() => resumeTournament(currentTour.id)}
                className="font-bold min-w-[120px] shadow-glow-green"
              >
                Tiếp Tục
              </Button>
            ) : currentTour.status === 'CREATED' ? (
              <Button
                variant="emerald"
                size="md"
                leftIcon={<Play className="w-4 h-4" />}
                onClick={() => startTournament(currentTour.id)}
                className="font-bold min-w-[130px] shadow-glow-green"
              >
                Bắt Đầu Tour
              </Button>
            ) : null}

            {/* Next Stage */}
            <Button
              variant="outline"
              size="sm"
              rightIcon={<SkipForward className="w-3.5 h-3.5" />}
              onClick={handleNextStage}
              title="Chuyển sang Level hoặc Break tiếp theo"
            >
              Sang Level
            </Button>

            {/* Reset Stage Timer */}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setIsResetConfirmOpen(true)}
              title="Đặt lại đếm ngược Level này"
            >
              Reset
            </Button>

            {/* Sound Toggle */}
            <button
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Tắt chuông báo' : 'Bật chuông báo'}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-700 text-emerald-400'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? 'Đang bật chuông báo' : 'Đang tắt chuông'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* End Tour & Award Points */}
            {currentTour.status !== 'COMPLETED' && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Award className="w-3.5 h-3.5" />}
                onClick={() => setIsEndConfirmOpen(true)}
              >
                Kết Thúc Tour
              </Button>
            )}
          </div>
        )}

        {/* Small blue LED power light on bottom right matching monitor in image */}
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full bg-emerald-400"
            title="Đồng hồ đang hiển thị"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. CHIP & PLAYERS MODAL                                        */}
      {/* ============================================================== */}
      <Modal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        maxWidth="lg"
        title="Quản Lý Danh Sách Hội Viên & Chip Tại Bàn"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div>
              <span className="text-slate-400">Còn lại:</span>
              <div className="font-bold text-emerald-400">
                {activePlayers.length} / {participants.length}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Chip TB (Average):</span>
              <div className="font-bold text-sky-400 font-mono">
                {formatChipK(averageChips)} ({averageBB} BB)
              </div>
            </div>
            <div>
              <span className="text-slate-400">Tổng Chip:</span>
              <div className="font-bold text-slate-100 font-mono">
                {formatChipK(totalChipsInPlay)}
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Hội viên</th>
                  <th className="py-2.5 px-3">Số Chip</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  {canControl && <th className="py-2.5 px-3 text-center">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{p.playerName}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {p.isEliminated ? (
                        <span className="text-slate-500">0</span>
                      ) : (
                        <input
                          type="number"
                          aria-label={`Số chip của ${p.playerName}`}
                          value={p.currentChips}
                          disabled={!canControl}
                          onChange={(e) => updateChips(currentTour.id, p.id, Number(e.target.value))}
                          className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-bold focus:outline-none"
                        />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {p.isEliminated ? (
                        <span className="text-rose-400 font-bold">Hạng #{p.eliminatedRank}</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Đang đấu</span>
                      )}
                    </td>
                    {canControl && (
                      <td className="py-2.5 px-3 text-center">
                        {!p.isEliminated && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => eliminateParticipant(currentTour.id, p.id)}
                          >
                            Loại
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsPlayerModalOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => resetCurrentStage(currentTour.id)}
        title="Xác Nhận Đặt Lại Đồng Hồ"
        message={`Bạn có chắc muốn đặt lại thời gian của ${currentStage.name} về ${currentStage.durationMinutes} phút?`}
        confirmText="Đặt Lại Timer"
        variant="warning"
      />

      {/* End Tournament Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isEndConfirmOpen}
        onClose={() => setIsEndConfirmOpen(false)}
        onConfirm={() => endTournament(currentTour.id)}
        title="Xác Nhận Kết Thúc Giải Đấu"
        message="Kết thúc giải đấu sẽ khóa đồng hồ, tính toán xếp hạng chung cuộc và tự động tạo đề xuất thưởng điểm tích lũy cho Quán Quân, Á Quân và Top dẫn đầu."
        confirmText="Kết Thúc & Trao Điểm"
        variant="danger"
      />
    </div>
  );
};
