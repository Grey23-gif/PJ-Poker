import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTournamentSessionStore as useTournamentStore } from '../../stores/tournamentSessionStore';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TournamentOverview } from './TournamentOverview';
import { TournamentBackground } from '../../components/ui/TournamentBackground';
import { useBackgroundImage } from '../../hooks/useBackgroundImage';
import { clockStageName, registrationEndDisplay } from '../../utils/tournamentRegistration';
import { remainingSeconds, isBuyInClosed } from '../../utils/tournamentRuntime';
import { useTournamentRuntime } from '../../hooks/useTournamentRuntime';
import { averageStack, getTournamentStatistics } from '../../utils/tournamentStatistics';
import { TournamentPrizePanel } from './TournamentPrizePanel';
import { isSessionFinished } from '../../utils/tournamentFinalization';
import {
  formatSecondsToMMSS,
  formatChipK as formatChipKOriginal,

} from '../../utils/formatters';
import { isTournamentSoundEnabled, setTournamentSoundEnabled } from '../../utils/audio';
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
  Settings,
  Spade,
} from 'lucide-react';

const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value);
const formatChipK = (value: number) => formatChipKOriginal(value);

export const TournamentClockPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tournaments, activeTourId, setActiveTourId } = useTournamentStore();
  const selectedId = useMemo(() => {
    const route = id?.trim().toLowerCase();
    const explicit = route ? tournaments.find((tour) => [tour.id, tour.code, tour.id.replace(/-/g, ' ')].some((value) => value.toLowerCase() === route || value.toLowerCase() === route.replace(/\s+/g, '-'))) : undefined;
    return explicit?.id || tournaments.find((tour) => tour.id === activeTourId && !tour.archivedAt && tour.status !== 'CANCELLED')?.id || tournaments.find((tour) => !tour.archivedAt && tour.status !== 'CANCELLED')?.id || '';
  }, [id, tournaments, activeTourId]);
  useEffect(() => { if (selectedId && selectedId !== activeTourId) setActiveTourId(selectedId); }, [selectedId, activeTourId, setActiveTourId]);
  useTournamentRuntime();
  const tour = tournaments.find((item) => item.id === selectedId);
  if (tour && searchParams.get('view') !== 'clock') return <TournamentOverview key={selectedId} tour={tour} tournaments={tournaments}
    onSelect={(nextId) => navigate(`/tours/clock/${nextId}`)} />;
  return <TournamentDisplay key={selectedId} tourId={selectedId} onBack={() => navigate(`/tours/clock/${selectedId}`)} />;
};

const TournamentDisplay: React.FC<{ tourId: string; onBack: () => void }> = ({ tourId, onBack }) => {
  const {
    tournaments,
    startTournament,
    pauseTournament,
    resumeTournament,
    nextStage,
    prevStage,
    resetCurrentStage,
  } = useTournamentStore();

  const { currentUser, hasPermission } = useAuthStore();

  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  const [soundEnabled, setSoundEnabled] = useState(isTournamentSoundEnabled);
  useEffect(() => setTournamentSoundEnabled(soundEnabled), [soundEnabled]);
  const [showControls, setShowControls] = useState(true);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Live wall-clock time sau top right ('11:11' style)
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

  const currentTour = tournaments.find((tour) => tour.id === tourId);
  const hasFinished = currentTour ? isSessionFinished(currentTour) : false;
  const backgroundImage = useBackgroundImage(currentTour?.clockBackground);
  const [renderTime, setRenderTime] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setRenderTime(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);
  const displaySeconds = currentTour ? remainingSeconds(currentTour, renderTime) : 0;

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

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
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        const auth = useAuthStore.getState();
        if (auth.currentUser?.role !== 'ADMIN' && !auth.hasPermission('TOUR_OPERATE')) return;
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
  }, [currentTour, pauseTournament, resumeTournament, startTournament, toggleFullscreen]);

  // Confetti celebration when tour finishes
  useEffect(() => {
    if (hasFinished) {
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#10b981', '#38bdf8', '#ffffff'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [hasFinished]);

  if (!currentTour) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center text-muted">
        <p className="text-base text-content mb-2">Chưa có phiên giải. Chọn mẫu giải và tạo phiên mới.</p>
        <Link to="/tours">
          <Button variant="emerald">Về danh sách giải đấu</Button>
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
  if (!isBreak && nextBreakStage) {
    secondsToNextBreak = displaySeconds;
    for (let i = currentStageIndex + 1; i < nextBreakIndex; i++) {
      if (stages[i].stageType === 'LEVEL') {
        secondsToNextBreak += (stages[i].durationMinutes || 15) * 60;
      }
    }
  }

  const canOperate = currentUser?.role === 'ADMIN' || hasPermission('TOUR_OPERATE');
  const canControl = !hasFinished && canOperate;

  // Fullscreen Handler


  // Sound Handler on Stage Change

  // Participants & Chips metrics
  const statistics = getTournamentStatistics(currentTour);
  const totalChipsInPlay = statistics.totalStack;
  const averageChips = currentTour.finalResults?.averageStack ?? averageStack(statistics);
  const showStatistics = isBuyInClosed(currentTour);
  const currentBB = currentStage.bigBlind || 0;
  const averageBB = currentBB > 0 ? Math.round(averageChips / currentBB) : 0;




  return (
    <div
      lang="en"
      data-background-kind="clock"
      data-statistics-visibility="visible"
      className={`tournament-clock ${backgroundImage.url ? 'clock-with-background' : ''} relative isolate flex flex-col bg-canvas text-content border border-surface-border rounded-2xl overflow-hidden select-none font-sans font-bold [&_*]:font-bold ${
        isFullscreen ? 'clock-fullscreen !fixed inset-0 z-50 !rounded-none border-none w-screen' : ''
      }`}
    >
      <TournamentBackground config={currentTour.clockBackground} url={backgroundImage.url} />
      {!isFullscreen && <div className="clock-navigation relative z-20 shrink-0 flex flex-wrap items-center gap-3 border-b border-line bg-field/90 px-4 py-2">
        <h1 className="text-lg font-semibold">Giải đấu</h1>
        <Button variant="outline" size="sm" onClick={onBack}>Quay lại thông số / chọn giải</Button>
      </div>}
      <header className="clock-header relative z-10 border-b border-line/80 bg-field/60 backdrop-blur-sm">
        <Link to="/tours" className="clock-brand flex items-center gap-2 text-secondary hover:text-content" title="Về danh sách giải đấu">
          <Spade className="h-8 w-8 text-success" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-widest">ROYAL POKER</span>
        </Link>
        <div className="clock-heading text-center min-w-0">
          <h2 className="clock-title font-bold uppercase tracking-wide text-warning">{currentTour.name}</h2>
          <p className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm sm:text-base font-semibold text-secondary">
            {currentTour.prizeConfiguration && <span>GTD: {formatNumber((currentTour.finalResults?.prizeConfiguration ?? currentTour.prizeConfiguration).guaranteedPoints)} PTS</span>}
            <span>Starting Stack: {formatNumber(currentTour.startingChips)}</span>
          </p>
        </div>
        <div className="clock-header-tools flex items-center justify-end gap-2">
          <span className="clock-wall-time font-mono text-base font-semibold tabular-nums">{wallClockTime}</span>
          <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Mở toàn màn hình'}
            className="min-h-[var(--control-icon-size)] min-w-[var(--control-icon-size)] flex items-center justify-center rounded-lg bg-field border border-line text-muted hover:text-content" title="Toàn màn hình (F)">
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div className="clock-main clock-main-with-prizes relative z-10 flex-1">
        <aside className="clock-statistics bg-field/50" aria-label="Tournament statistics and Break Schedule">
          <dl className="clock-metrics" data-statistics-values="visible">
            <div>
              <dt>Players Remaining</dt>
              <dd className="text-success">{statistics.playersRemaining} / {statistics.uniquePlayers}<span className="sr-only"> Players Remaining / Unique Players</span></dd>
            </div>
            <div><dt>Re-entries</dt><dd>{formatNumber(statistics.entries - statistics.uniquePlayers)}</dd></div>
            <div><dt>Total Entries</dt><dd>{formatNumber(statistics.entries)}</dd></div>
            <div><dt>Total Stack</dt><dd>{formatChipK(totalChipsInPlay)}</dd></div>
            <div><dt>Average Stack</dt><dd>{formatChipK(averageChips)} <span className="text-base">({averageBB} BB)</span></dd></div>
          </dl>
          <section className="clock-break text-center" aria-label="Break Schedule">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-warning flex items-center justify-center gap-2">
              <Coffee className="h-4 w-4" aria-hidden="true" /> Break Schedule
            </h3>
            <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-muted">{isBreak ? 'Break Remaining' : 'Next Break'}</p>
            <p className="mt-1 font-mono font-semibold text-warning clock-break-countdown">
              {isBreak ? formatSecondsToMMSS(displaySeconds) : nextBreakStage ? (
                secondsToNextBreak >= 3600
                  ? `${Math.floor(secondsToNextBreak / 3600)}:${formatSecondsToMMSS(secondsToNextBreak % 3600)}`
                  : formatSecondsToMMSS(secondsToNextBreak)
              ) : '--:--'}
            </p>
            <p className="mt-1 text-xs text-muted">{isBreak ? 'On Break' : nextBreakStage ? clockStageName(nextBreakStage, stages) : 'No more Breaks'}</p>

          </section>
          {showStatistics && currentTour.statisticsNeedsReview && <p className="text-xs text-warning">Số liệu cũ cần đối soát.</p>}

        </aside>

        <div className="clock-center text-center">
          <div className="clock-level-row flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <h3 className={`clock-level font-semibold tracking-wide ${isBreak ? 'text-warning' : 'text-content'}`}>{clockStageName(currentStage, stages)}</h3>
          </div>
          <p data-registration-end className="mt-3 text-sm sm:text-base text-secondary">{registrationEndDisplay(currentTour)}</p>

          <div className="clock-blinds">
            {!isBreak ? <>
              <span className="sr-only">Blinds</span>
              <p className="clock-blinds-values font-mono font-semibold tracking-tight">
                {formatNumber(currentStage.smallBlind ?? 0)} / {formatNumber(currentStage.bigBlind ?? 0)}
              </p>
              <p className="clock-ante clock-blinds-values font-mono font-semibold tracking-tight text-warning">Ante {formatNumber(currentStage.ante ?? 0)}</p>
            </> : <p className="text-lg text-warning">On Break</p>}
          </div>

          <div className={`clock-display font-mono font-semibold ${isBreak ? 'text-warning' : displaySeconds <= 60 && displaySeconds > 0 ? 'text-danger animate-pulse' : 'text-content'}`}>
            {formatSecondsToMMSS(displaySeconds)}
          </div>

          {upcomingStage && <div className="clock-next-level rounded-full border border-line-strong bg-field/80">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">{upcomingStage.stageType === 'BREAK' ? 'Next Break' : 'Next Level'}</span>
            <p className="font-mono font-semibold text-warning">
              {upcomingStage.stageType === 'BREAK'
                ? `${clockStageName(upcomingStage, stages)} · ${upcomingStage.durationMinutes} min`
                : `${formatNumber(upcomingStage.smallBlind ?? 0)} / ${formatNumber(upcomingStage.bigBlind ?? 0)} · Ante ${formatNumber(upcomingStage.ante ?? 0)}`}
            </p>
          </div>}
        </div>

        {showStatistics && <aside className="clock-prizes bg-field/50" aria-label="Tournament prizes">
          <TournamentPrizePanel entries={statistics.entries} configuration={currentTour.prizeConfiguration} finalResults={currentTour.finalResults} visible={true} />
        </aside>}
      </div>

      {currentTour.status === 'PAUSED' && !hasFinished && (
        <div data-clock-paused className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center bg-black/75 p-6">
          <div role="status" className="rounded-2xl border border-white/30 bg-black/80 px-10 py-6 text-center shadow-2xl sm:px-16 sm:py-10">
            <p className="text-4xl font-bold uppercase tracking-widest text-white sm:text-6xl lg:text-7xl">PAUSE</p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. BOTTOM OPERATOR CONTROL BAR                                 */}
      {/* ============================================================== */}
      <div className="clock-operator-bar relative z-20 bg-field/95 border-t border-line/90 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 text-xs text-muted">
          <button
            aria-expanded={showControls}
            onClick={() => setShowControls(!showControls)}
            className="flex items-center gap-1.5 font-semibold text-secondary hover:text-content"
          >
            <Settings className="w-3.5 h-3.5 text-warning" />
            <span>Điều khiển {showControls ? '▲' : '▼'}</span>
          </button>
          <span className="clock-shortcuts text-muted">
            [Phím tắt: Space = Chạy/Dừng, F = Toàn màn hình, M = Âm thanh]
          </span>
        </div>

        {showControls && canOperate && (
          <div className="flex flex-wrap items-center gap-2">
            {hasFinished && <span className="text-xs text-muted">Phiên giải đã kết thúc · Thao tác đã khóa</span>}
            {/* Prev Stage */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<SkipBack className="w-3.5 h-3.5" />}
              disabled={!canControl || currentStageIndex === 0}
              onClick={() => prevStage(currentTour.id)}
              title="Level trước"
            >
              Level trước
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
                Tạm dừng
              </Button>
            ) : currentTour.status === 'PAUSED' ? (
              <Button
                variant="emerald"
                size="md"
                leftIcon={<Play className="w-4 h-4" />}
                onClick={() => resumeTournament(currentTour.id)}
                className="font-bold min-w-[120px] shadow-glow-green"
              >
                Tiếp tục
              </Button>
            ) : currentTour.status === 'CREATED' ? (
              <Button
                variant="emerald"
                size="md"
                leftIcon={<Play className="w-4 h-4" />}
                onClick={() => startTournament(currentTour.id)}
                className="font-bold min-w-[130px] shadow-glow-green"
              >
                Bắt đầu giải
              </Button>
            ) : hasFinished ? <Button variant="secondary" size="md" disabled leftIcon={<Play className="w-4 h-4" />}>Đã kết thúc</Button> : null}

            {/* Next Stage */}
            <Button
              variant="outline"
              size="sm"
              rightIcon={<SkipForward className="w-3.5 h-3.5" />}
              onClick={() => nextStage(currentTour.id)}
              disabled={!canControl || currentStageIndex >= stages.length - 1}
              title="Chuyển đến Level hoặc Break tiếp theo"
            >
              Tiếp theo
            </Button>

            {/* Reset Stage Timer */}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setIsResetConfirmOpen(true)}
              disabled={!canControl}
              title="Đặt lại thời gian Level hiện tại"
            >
              Đặt lại
            </Button>

            {/* Sound Toggle */}
            <button
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`min-h-[var(--control-icon-size)] min-w-[var(--control-icon-size)] flex items-center justify-center p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-field border-line-strong text-success'
                  : 'bg-field border-line-strong text-muted'
              }`}
              title={soundEnabled ? 'Đang bật âm thanh' : 'Đang tắt âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

          </div>
        )}

        {/* Small blue LED power light on bottom right matching monitor sau image */}
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full bg-emerald-400"
            title="Màn hình giải đấu đang hoạt động"
          />
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        locale="vi"
        cancelText="Hủy"
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => resetCurrentStage(currentTour.id)}
        title="Đặt lại thời gian?"
        message={`Đặt lại ${clockStageName(currentStage, stages)} về ${currentStage.durationMinutes} phút?`}
        confirmText="Đặt lại thời gian"
        variant="warning"
      />


    </div>
  );
};
