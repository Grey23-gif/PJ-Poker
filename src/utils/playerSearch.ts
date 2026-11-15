import type { User } from '../types/auth';

export function normalizePlayerSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase().trim();
}

export function searchPlayers(players: User[], query: string): User[] {
  const terms = normalizePlayerSearch(query).split(/\s+/).filter(Boolean);
  return players.filter((player) => {
    const searchable = normalizePlayerSearch(`${player.fullName} ${player.id} ${player.phone} ${player.phone.replace(/\D/g, '')}`);
    return terms.every((term) => searchable.includes(term));
  });
}

export function nextPlayerOption(disabled: boolean[], current: number, direction: 1 | -1): number {
  for (let step = 1; step <= disabled.length; step++) {
    const index = ((current < 0 && direction < 0 ? 0 : current) + direction * step + disabled.length) % disabled.length;
    if (!disabled[index]) return index;
  }
  return -1;
}
