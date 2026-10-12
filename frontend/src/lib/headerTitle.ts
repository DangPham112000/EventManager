import type { VisibleRange } from '@/store/uiSlice';

const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleDateString('en-US', options);

export interface HeaderTitle {
  long: string; // wide screens (lg and up)
  medium: string; // tablets (sm to lg), where the title gets ~120px
  short: string; // phones such as iPhone 11 Pro (375px), where it gets ~65px
}

/**
 * Title for the visible dates, as long / medium / short. The short Week/Day
 * forms rely on the column headers, which show the dates:
 * - Month: "October 2026" / "October 2026" / "Oct 2026"
 * - Week: "Oct 4 – 10, 2026" / "Oct 4 – 10" / "Oct 2026"
 *   (across months: "Sep 27 – Oct 3, 2026" / "Sep 27 – Oct 3" / "Sep – Oct")
 * - Day: "Saturday, Oct 10, 2026" / "Sat, Oct 10" / "Oct 10"
 */
export function getHeaderTitle(
  view: string,
  range: VisibleRange | null,
  selectedDate: string,
): HeaderTitle {
  // The range lags one render behind a view switch; fall back to the month
  // until FullCalendar reports the new range
  const current = range && range.viewType === view ? range : null;

  if (view === 'timeGridWeek' && current) {
    const start = new Date(current.start);
    // FullCalendar's end is exclusive (midnight after the last day)
    const last = new Date(new Date(current.end).getTime() - 1);
    const sameYear = start.getFullYear() === last.getFullYear();
    const sameMonth = sameYear && start.getMonth() === last.getMonth();
    const startText = format(start, { month: 'short', day: 'numeric' });
    const lastText = sameMonth
      ? format(last, { day: 'numeric' })
      : format(last, { month: 'short', day: 'numeric' });
    const medium = `${startText} – ${lastText}`;
    const long = sameYear
      ? `${medium}, ${last.getFullYear()}`
      : `${startText}, ${start.getFullYear()} – ${lastText}, ${last.getFullYear()}`;
    const short = sameMonth
      ? format(start, { month: 'short', year: 'numeric' })
      : `${format(start, { month: 'short' })} – ${format(last, { month: 'short' })}`;
    return { long, medium, short };
  }

  if (view === 'timeGridDay' && current) {
    const day = new Date(current.start);
    return {
      long: format(day, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      medium: format(day, { weekday: 'short', month: 'short', day: 'numeric' }),
      short: format(day, { month: 'short', day: 'numeric' }),
    };
  }

  // Month view: the midpoint of the visible grid is always in the shown month
  const displayDate = new Date(selectedDate);
  const monthYear = format(displayDate, { month: 'long', year: 'numeric' });
  return {
    long: monthYear,
    medium: monthYear,
    short: format(displayDate, { month: 'short', year: 'numeric' }),
  };
}
