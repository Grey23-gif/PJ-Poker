import React, { useState } from 'react';
import { usePointsStore } from '../../stores/pointsStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { formatNumber } from '../../utils/formatters';
import { Trophy, Search, Sparkles, Crown, Medal, Award } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const { leaderboard } = usePointsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  const filteredLeaderboard = leaderboard.filter((entry) => {
    const matchesSearch =
      entry.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.phone.includes(searchTerm);
    const matchesTier = tierFilter === 'ALL' || entry.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" /> BẢNG XẾP HẠNG THỂ THAO TRÍ TUỆ 2026
        </div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">
          Bảng Vinh Danh Hội Viên Poker Club
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Tôn vinh các tay bài có phong độ xuất sắc và điểm tích lũy thi đấu phong trào cao nhất
        </p>
      </div>

      {/* Podium for Top 3 Players */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-4xl mx-auto items-end">
          {/* Rank 2 (Silver) */}
          <div className="order-2 sm:order-1 bg-surface p-5 rounded-2xl border border-slate-700 text-center flex flex-col items-center justify-between h-64 shadow-xl">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-400/20 text-slate-300 font-bold flex items-center justify-center text-xl mx-auto border border-slate-400/40">
                2
              </div>
              <h4 className="font-bold text-slate-100 text-base">{top3[1].playerName}</h4>
              <StatusBadge status={top3[1].tier} />
            </div>
            <div className="w-full pt-3 border-t border-slate-700/60">
              <span className="text-xs text-slate-400 uppercase">Hạng 2 (Á Quân)</span>
              <div className="text-xl font-black text-slate-200 font-mono">
                {formatNumber(top3[1].currentPoints)} <span className="text-xs font-normal">điểm</span>
              </div>
            </div>
          </div>

          {/* Rank 1 (Gold - Taller Podium) */}
          <div className="order-1 sm:order-2 bg-surface p-6 rounded-3xl border-2 border-amber-500/60 text-center flex flex-col items-center justify-between min-h-[288px] shadow-glow-gold relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-[#d8b56c]" />
            <div className="space-y-2">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-3xl mx-auto border-2 border-amber-400 shadow-xl">
                  1
                </div>
                <Crown className="w-6 h-6 text-amber-400 absolute -top-3.5 -right-2 " />
              </div>
              <h3 className="font-semibold text-white text-lg">{top3[0].playerName}</h3>
              <StatusBadge status={top3[0].tier} />
            </div>
            <div className="w-full pt-3 border-t border-amber-500/30">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Quán quân bảng hạng
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                {formatNumber(top3[0].currentPoints)} <span className="text-sm font-normal">điểm</span>
              </div>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="order-3 bg-surface p-5 rounded-2xl border border-amber-900/40 text-center flex flex-col items-center justify-between h-60 shadow-xl">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-600 font-bold flex items-center justify-center text-xl mx-auto border border-amber-700/40">
                3
              </div>
              <h4 className="font-bold text-slate-100 text-base">{top3[2].playerName}</h4>
              <StatusBadge status={top3[2].tier} />
            </div>
            <div className="w-full pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400 uppercase">Hạng 3 (Quý Quân)</span>
              <div className="text-xl font-black text-amber-500 font-mono">
                {formatNumber(top3[2].currentPoints)} <span className="text-xs font-normal">điểm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3.5 rounded-2xl border border-slate-800">
        <div className="w-full sm:w-80">
          <Input
            aria-label="Tìm theo tên hội viên, số điện thoại..."
              placeholder="Tìm theo tên hội viên, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-400">Hạng bậc hội viên:</span>
          <select
            aria-label="Lọc theo cấp bậc"
              value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="ALL">Tất cả cấp bậc</option>
            <option value="DIAMOND">Diamond (≥ 15,000 điểm)</option>
            <option value="PLATINUM">Platinum (≥ 10,000 điểm)</option>
            <option value="GOLD">1 Gold (≥ 6,000 điểm)</option>
            <option value="SILVER">2 Silver (≥ 3,000 điểm)</option>
            <option value="BRONZE">3 Bronze</option>
          </select>
        </div>
      </div>

      {/* Complete Leaderboard Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-center w-16">Hạng</th>
                  <th className="py-3 px-4">Hội viên</th>
                  <th className="py-3 px-4">Cấp bậc</th>
                  <th className="py-3 px-4 text-center">Tour tham gia</th>
                  <th className="py-3 px-4 text-center">Số giải vô địch</th>
                  <th className="py-3 px-4 text-center">Tỷ lệ thắng (Win Rate)</th>
                  <th className="py-3 px-4 text-right">Tổng điểm tích lũy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLeaderboard.map((entry) => (
                  <tr key={entry.playerId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                          entry.rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-glow-gold'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : entry.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100 text-sm">
                      {entry.playerName}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={entry.tier} />
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300 font-medium">
                      {entry.totalToursPlayed}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">
                      {entry.toursWon}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, entry.winRate * 2)}%` }}
                          />
                        </div>
                        <span className="text-slate-300 font-mono">{entry.winRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-amber-400 text-base">
                      {formatNumber(entry.currentPoints)} <span className="text-xs font-normal text-slate-500">điểm</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

