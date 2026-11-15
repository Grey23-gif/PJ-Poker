import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePointsStore } from '../../stores/pointsStore';
import { useTournamentStore } from '../../stores/tournamentStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { formatNumber, formatDateTime, formatVND } from '../../utils/formatters';
import {
  Trophy,
  Coins,
  Shield,
  Clock,
  QrCode,
  Calendar,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PlayerDashboard: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { getPlayerPoints, getPlayerTransactions, getPlayerRequests, leaderboard } = usePointsStore();
  const { tournaments } = useTournamentStore();

  const playerId = currentUser?.id || '';
  const currentPoints = getPlayerPoints(playerId);
  const transactions = getPlayerTransactions(playerId);
  const requests = getPlayerRequests(playerId);
  const myRank = leaderboard.find((p) => p.playerId === playerId)?.rank || '--';

  const runningTour = tournaments.find((t) => t.status === 'RUNNING');
  const myParticipatedTours = tournaments.filter((t) =>
    t.participants.some((p) => p.playerId === playerId)
  );

  return (
    <div className="space-y-[var(--section-gap)] max-w-6xl mx-auto">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--component-gap)]">
        <div>
          <h1 className="page-title text-2xl font-semibold text-content flex flex-wrap items-center gap-2">
            Cổng Thông Tin Hội Viên
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Theo dõi điểm tích lũy phong trào, lịch sử giải đấu và bảng xếp hạng câu lạc bộ
          </p>
        </div>
        {runningTour && (
          <Link to={`/tours/clock/${runningTour.id}`}>
            <Button
              variant="emerald"
              size="sm"
              leftIcon={<Clock className="w-4 h-4" />}
              className=""
            >
              Theo Dõi Tour Đang Trực Tiếp
            </Button>
          </Link>
        )}
      </div>

      {/* Member Card & Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--section-gap)]">
        {/* VIP Member Card */}
        <div className="relative rounded-2xl p-[var(--card-padding)] bg-surface border border-emerald-500/40 overflow-hidden flex flex-col justify-between gap-3 min-h-48 text-content group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 text-8xl text-success/10 font-bold select-none">
            ♠
          </div>

          <div className="flex justify-between items-start z-10">
            <div>
              <span className="text-xs font-mono tracking-widest text-success uppercase">
                ROYAL POKER CLUB
              </span>
              <h3 className="text-lg font-bold mt-0.5 tracking-wide">{currentUser?.fullName}</h3>
            </div>
            <StatusBadge status={currentUser?.playerStats?.rankTier || 'DIAMOND'} />
          </div>

          <div className="z-10 space-y-1">
            <span className="text-xs text-muted uppercase tracking-wider">Điểm Tích Lũy</span>
            <div className="text-3xl font-semibold text-warning tracking-tight flex items-center gap-2">
              <Coins className="w-6 h-6 text-warning" />
              {formatNumber(currentPoints)}
              <span className="text-xs font-normal text-muted">Pts</span>
            </div>
          </div>

          <div className="flex justify-between items-end text-xs text-muted font-mono z-10 border-t border-line-strong/50 pt-2">
            <span>ID: {currentUser?.username.toUpperCase()}</span>
            <span>Hạng CLB: #{myRank}</span>
          </div>
        </div>

        {/* 2 Stats summary cards */}
        <Card className="p-[var(--card-padding)] flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted uppercase tracking-wider font-semibold">
              Thành Tích Giải Đấu
            </span>
            <div className="text-3xl font-bold text-content mt-2">
              {currentUser?.playerStats?.toursWon || 0} / {currentUser?.playerStats?.totalToursPlayed || 0}
            </div>
            <p className="text-xs text-success font-medium">Chiến thắng / Tham gia</p>
          </div>
          <div className="pt-4 border-t border-line text-xs text-muted space-y-1.5">
            <div className="flex justify-between">
              <span>Tỷ lệ vô địch (Win Rate):</span>
              <strong className="text-content">
                {currentUser?.playerStats?.totalToursPlayed
                  ? (
                      ((currentUser.playerStats.toursWon || 0) /
                        currentUser.playerStats.totalToursPlayed) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Vị trí trên Leaderboard:</span>
              <strong className="text-warning">Hạng #{myRank}</strong>
            </div>
          </div>
        </Card>

        <Card className="p-[var(--card-padding)] flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted uppercase tracking-wider font-semibold">
              Quy Chế Điểm Thưởng
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Sparkles className="w-6 h-6 text-warning" />
              <span className="text-lg font-bold text-content">Điểm Phong Trào CLB</span>
            </div>
            <p className="text-xs text-muted mt-1">
              Điểm thưởng thành tích được cộng sau mỗi giải đấu thể thao trí tuệ.
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-warning space-y-1">
            <div className="flex items-center gap-1 font-semibold">
              <Info className="w-3.5 h-3.5" /> Lưu ý quy chế:
            </div>
            <p>Điểm Poker chỉ dùng xếp hạng vinh danh, không quy đổi thành tiền mặt hoặc hiện vật.</p>
          </div>
        </Card>
      </div>

      {/* Participated Tours and Point Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--section-gap)]">
        {/* Tournaments history */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              <Trophy className="w-4 h-4 text-success" />
              Giải Đấu Đã Tham Gia
            </CardTitle>
            <Link to="/tours" className="text-xs text-success hover:underline">
              Xem tất cả tour
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myParticipatedTours.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs">
                Bạn chưa tham gia giải đấu nào gần đây.
              </div>
            ) : (
              myParticipatedTours.map((tour) => {
                const participantInfo = tour.participants.find((p) => p.playerId === playerId && !p.isEliminated)
                  || tour.participants.filter((p) => p.playerId === playerId).at(-1);
                return (
                  <div
                    key={tour.id}
                    className="p-3 bg-surface rounded-xl border border-line flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-content">{tour.name}</span>
                        <StatusBadge status={tour.status} />
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {tour.status === 'CREATED' ? 'Chưa bắt đầu' : 'Đã khởi tạo giải'}
                      </div>
                    </div>

                    <div className="text-right">
                      {participantInfo?.isEliminated ? (
                        <span className="text-muted">
                          Hạng dừng: #{participantInfo.eliminatedRank}
                        </span>
                      ) : (
                        <span className="text-success font-bold">
                          {formatNumber(participantInfo?.currentChips || 0)} chips
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Points History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              <Coins className="w-4 h-4 text-warning" />
              Lịch Sử Biến Động Điểm
            </CardTitle>
            <Link to="/leaderboard" className="text-xs text-warning hover:underline">
              Bảng xếp hạng CLB
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs">
                Chưa có giao dịch điểm nào được ghi nhận.
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 bg-surface rounded-xl border border-line flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-content">{tx.description}</div>
                    <div className="text-xs text-muted">
                      {formatDateTime(tx.createdAt)} • Người cấp: {tx.createdByName}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-bold text-sm ${
                        tx.amount > 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {tx.amount > 0 ? `+${formatNumber(tx.amount)}` : formatNumber(tx.amount)}
                    </div>
                    <div className="text-xs text-muted">
                      Số dư: {formatNumber(tx.balanceAfter)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

