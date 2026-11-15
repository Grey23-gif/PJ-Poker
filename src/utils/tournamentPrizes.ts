import type { TournamentPrizeConfiguration } from '../types/tournamentPrizes';

export const MAX_PRIZE_POSITIONS = 20;
// Missing configuration retains the historical 2 PTS/Entry, 60/30/10 behavior.
export const legacyPrizeConfiguration = (): TournamentPrizeConfiguration => ({
  guaranteedPoints: 0, entriesThreshold: 0, additionalPointsPerEntry: 2,
  positions: [{ percentage: 60 }, { percentage: 30 }, { percentage: 10 }],
});

function minorUnits(value: number): number | undefined {
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  return Number.isFinite(value) && value >= 0 && Number.isSafeInteger(rounded) && Math.abs(scaled - rounded) < 0.0000001 ? rounded : undefined;
}

export function validatePrizeConfiguration(config: TournamentPrizeConfiguration): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!config || typeof config !== 'object') return { configuration: 'Prize Distribution không hợp lệ.' };
  if (minorUnits(config.guaranteedPoints) === undefined) errors.guaranteedPoints = 'GTD phải không âm, tối đa 2 chữ số thập phân và trong giới hạn an toàn.';
  if (!Number.isSafeInteger(config.entriesThreshold) || config.entriesThreshold < 0) errors.entriesThreshold = 'Entries Threshold phải là số nguyên không âm.';
  if (minorUnits(config.additionalPointsPerEntry) === undefined) errors.additionalPointsPerEntry = 'Additional PTS phải không âm, tối đa 2 chữ số thập phân và trong giới hạn an toàn.';
  if (!Array.isArray(config.positions) || config.positions.length < 1 || config.positions.length > MAX_PRIZE_POSITIONS) {
    errors.positions = `Cần từ 1 đến ${MAX_PRIZE_POSITIONS} vị trí giải thưởng.`; return errors;
  }
  let total = 0;
  config.positions.forEach((position, index) => {
    const units = minorUnits(position?.percentage);
    if (units === undefined || units > 10000) errors[`position-${index}`] = 'Tỷ lệ phải từ 0 đến 100%, tối đa 2 chữ số thập phân.';
    else total += units;
  });
  if (total !== 10000) errors.positions = 'Tổng tỷ lệ giải thưởng phải bằng đúng 100%.';
  return errors;
}

/** PTS has two decimal places. Allocate integer 0.01 PTS units using largest
 * remainders; ties go to the earlier TOP. The sum always equals the pool.
 * BigInt intermediates avoid binary rounding and product overflow. */
export function getTournamentPrizePayouts(entries: number, config = legacyPrizeConfiguration()) {
  const errors = validatePrizeConfiguration(config);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const safeEntries = Number.isSafeInteger(entries) && entries > 0 ? entries : 0;
  const extraEntries = Math.max(0, safeEntries - config.entriesThreshold);
  const pool = BigInt(minorUnits(config.guaranteedPoints)!) + BigInt(extraEntries) * BigInt(minorUnits(config.additionalPointsPerEntry)!);
  if (pool > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Total Prize Pool vượt giới hạn tính toán an toàn.');
  const allocations = config.positions.map(({ percentage }, index) => {
    const product = pool * BigInt(minorUnits(percentage)!);
    return { place: index + 1, percentage, units: product / 10000n, remainder: product % 10000n };
  });
  let leftover = pool - allocations.reduce((sum, item) => sum + item.units, 0n);
  const remainderOrder = [...allocations].sort((a, b) => a.remainder === b.remainder ? a.place - b.place : a.remainder > b.remainder ? -1 : 1);
  for (const item of remainderOrder) {
    if (leftover === 0n) break;
    item.units++; leftover--;
  }
  return { totalPrizePoints: Number(pool) / 100,
    payouts: allocations.map(({ place, percentage, units }) => ({ place, percentage, points: Number(units) / 100 })) };
}
