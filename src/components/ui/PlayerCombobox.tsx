import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { User } from '../../types/auth';
import { searchPlayers, nextPlayerOption } from '../../utils/playerSearch';
import { Input } from './Input';

export function PlayerCombobox({ players, value, onChange, disabledIds, label, error }: {
  players: User[]; value: string; onChange: (id: string) => void; disabledIds: string[]; label: string; error?: string;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const selected = players.find((player) => player.id === value);
  const results = searchPlayers(players, query);
  const disabled = results.map((player) => disabledIds.includes(player.id));
  const select = (player: User) => { onChange(player.id); setQuery(''); setOpen(false); setActive(-1); };
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, listId]);

  return <div className="min-w-0" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setOpen(false); setActive(-1); }
  }}>
    <Input ref={input} label={label} error={error} role="combobox" autoComplete="off" aria-autocomplete="list"
      aria-expanded={open} aria-controls={listId} aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
      placeholder="Tên Player, số điện thoại hoặc mã hội viên" value={selected ? `${selected.fullName} - ${selected.phone}` : query}
      onFocus={(event) => { setOpen(true); event.currentTarget.select(); }}
      onChange={(event) => { setQuery(event.target.value); onChange(''); setOpen(true); setActive(-1); }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true); setActive(nextPlayerOption(disabled, active, event.key === 'ArrowDown' ? 1 : -1));
        } else if (event.key === 'Enter') {
          event.preventDefault(); if (open && active >= 0 && results[active] && !disabled[active]) select(results[active]);
        } else if (event.key === 'Escape' && open) {
          event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1);
        } else if (event.key === 'Tab') { setOpen(false); setActive(-1); }
      }}
      rightIcon={(value || query) && <button type="button" aria-label={`Xóa ${label}`} onClick={() => { onChange(''); setQuery(''); setOpen(true); setActive(-1); input.current?.focus(); }}><X className="h-4 w-4" aria-hidden="true" /></button>} />
    {open && <ul id={listId} role="listbox" aria-label={label} className="mt-1 max-h-48 overflow-y-auto overscroll-contain rounded-lg border border-line-strong bg-surface p-1 shadow-lg">
      {results.map((player, index) => <li key={player.id} id={`${listId}-${index}`} role="option" aria-selected={player.id === value}
        aria-disabled={disabled[index]} onMouseDown={(event) => event.preventDefault()} onClick={() => { if (!disabled[index]) select(player); }}
        className={`min-h-[var(--button-height)] rounded-md px-3 py-2 text-sm ${disabled[index] ? 'text-muted opacity-60 cursor-not-allowed' : `cursor-pointer hover:bg-raised ${active === index ? 'bg-raised text-success' : 'text-content'}`}`}>
        <p>{player.fullName} - {player.phone || 'Chưa có số điện thoại'}</p>
        <p className="text-xs text-muted break-all">{player.id}{disabled[index] ? ' · Đã gán TOP khác' : ''}</p>
      </li>)}
      {!results.length && <li role="option" aria-disabled="true" aria-selected="false" className="p-3 text-sm text-muted">Không tìm thấy Player</li>}
    </ul>}
  </div>;
}
