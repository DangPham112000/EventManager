const DATE_OPTS: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', DATE_OPTS);
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', TIME_OPTS);
}

/**
 * Format a date range for display, as one line per entry.
 * Same-day events stay compact: ["Thu, Oct 15 · 06:30 PM – 08:00 PM"].
 * Multi-day events show the date at both ends:
 * ["Thu, Oct 15, 06:30 PM", "→ Mon, Oct 19, 06:00 PM"].
 */
export function formatTimeRange(start: string, end: string): string[] {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) {
    return [`${formatDate(s)} · ${formatTime(s)} – ${formatTime(e)}`];
  }
  return [`${formatDate(s)}, ${formatTime(s)}`, `→ ${formatDate(e)}, ${formatTime(e)}`];
}

/**
 * Format duration between two dates, e.g. "45min", "1h 30min", "3d 23h 30min".
 */
export function formatDuration(start: string, end: string): string {
  const totalMinutes = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}min`);
  return parts.join(' ');
}
