import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(val: number): string {
  if (isNaN(val)) return '0';
  return new Intl.NumberFormat('vi-VN').format(val);
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const date = parseISO(isoString);
    return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
  } catch {
    return isoString;
  }
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const date = parseISO(isoString);
    return format(date, 'dd/MM/yyyy', { locale: vi });
  } catch {
    return isoString;
  }
}

export function formatTime(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const date = parseISO(isoString);
    return format(date, 'HH:mm', { locale: vi });
  } catch {
    return isoString;
  }
}

export function formatSecondsToMMSS(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatElapsedSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}



export function formatChipK(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0';
  if (amount < 1000) return amount.toString();
  if (amount < 1000000) {
    const inK = amount / 1000;
    if (inK % 1 === 0) {
      return `${inK}K`;
    }
    return `${inK.toFixed(1).replace('.', ',')}K`;
  }
  const inM = amount / 1000000;
  if (inM % 1 === 0) {
    return `${inM}M`;
  }
  return `${inM.toFixed(1).replace('.', ',')}M`;
}
