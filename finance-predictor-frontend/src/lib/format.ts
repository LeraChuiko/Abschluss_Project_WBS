export function euro(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function monthName(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('de-DE', {
    month: 'long',
    timeZone: 'UTC',
  });
}

export function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function monthsInRange(from: string, to: string): string[] {
  const [fromY, fromM] = from.split('-').map(Number);
  const [toY, toM] = to.split('-').map(Number);
  const result: string[] = [];
  let y = fromY;
  let m = fromM;
  while (y < toY || (y === toY && m <= toM)) {
    result.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result;
}

export function hintOccurrences(
  start: string,
  end: string,
  everyMonths: number,
  customMonths: number[],
): string[] {
  const last = end && end >= start ? end : start;
  if (customMonths.length > 0) {
    const out: string[] = [];
    const startY = Number(start.slice(0, 4));
    const endY = Number(last.slice(0, 4));
    for (let year = startY; year <= endY; year += 1) {
      for (const m of [...customMonths].sort((a, b) => a - b)) {
        const key = `${year}-${String(m).padStart(2, '0')}`;
        if (key >= start && key <= last) {
          out.push(key);
        }
      }
    }
    return out;
  }
  if (everyMonths <= 0) {
    return [start];
  }
  const out: string[] = [];
  let cursor = start;
  while (cursor <= last) {
    out.push(cursor);
    cursor = shiftMonth(cursor, everyMonths);
  }
  return out;
}

export function shiftMonth(month: string, add: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + add, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthsFromJanuaryToNow(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const result: string[] = [];
  for (let i = 1; i <= month; i += 1) {
    result.push(`${year}-${String(i).padStart(2, '0')}`);
  }
  return result;
}

export function monthsOfCurrentYear(): string[] {
  const year = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
  }).format(new Date());
  return monthsInRange(`${year}-01`, `${year}-12`);
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shortMonthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('de-DE', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

export function currentMonthKey(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

export function isEditableMonth(monthOrIso: string): boolean {
  return monthOrIso.slice(0, 7) >= currentMonthKey();
}

export function toImageSrc(url: string): string {
  const found = url.match(/https?:\/\/[^\s]+/i)?.[0] ?? url.trim();
  if (found.includes('images.unsplash.com')) {
    return found;
  }
  const match = found.match(/unsplash\.com\/(?:[a-z]{2}\/)?(?:fotos|photos)\/([^/?#\s]+)/i);
  if (!match?.[1]) {
    return found;
  }
  const slug = match[1];
  const id = slug.includes('-') ? slug.slice(slug.lastIndexOf('-') + 1) : slug;
  return `https://unsplash.com/photos/${id}/download?force=true&w=1200`;
}

export const fieldClass =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-violet-600';

export const btnClass =
  'cursor-pointer rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 active:bg-violet-950';
