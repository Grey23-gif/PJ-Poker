import type { TournamentPrizeConfiguration } from '../../types/tournamentPrizes';
import { getTournamentPrizePayouts } from '../../utils/tournamentPrizes';
import type { TournamentFinalResults } from '../../types/tournament';

export function TournamentPrizePanel({ entries, configuration, visible, finalResults, masked = false }: {
  entries: number; configuration?: TournamentPrizeConfiguration; visible: boolean; masked?: boolean; finalResults?: TournamentFinalResults;
}) {
  if (!visible) return null;
  const prizes = finalResults || getTournamentPrizePayouts(entries, configuration);
  const number = (value: number) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return <section data-prize-values={masked ? 'masked' : 'visible'} data-prize-distribution aria-label="Prize Distribution" className="clock-prize-panel rounded-2xl border border-warning/50 bg-surface/80 p-3 sm:p-4 text-center">
    <div><h3 className="text-xs sm:text-sm font-bold text-muted uppercase tracking-wider">Total Prize Pool</h3>
      <p className="mt-1 text-3xl lg:text-4xl font-semibold text-warning font-mono break-words">{masked ? '--' : `${number(prizes.totalPrizePoints)} PTS`}</p></div>
    <dl tabIndex={0} aria-label="TOP payouts" className="clock-prize-ranks mt-4 border-t border-line pt-2 space-y-1 overflow-y-auto">
      {prizes.payouts.map((payout) => <div key={payout.place} className="flex items-baseline justify-between gap-3 rounded-lg bg-field/60 px-2 py-2 text-left">
        <dt className="shrink-0 text-xs sm:text-sm font-bold text-warning uppercase tracking-wide">{`TOP ${payout.place}`}</dt>
        <dd className={`min-w-0 text-right text-base lg:text-xl font-semibold font-mono break-words ${payout.place === 1 ? 'text-warning' : 'text-content'}`}>{masked ? '--' : `${number(payout.points)} PTS`}</dd>
      </div>)}
    </dl>
  </section>;
}
