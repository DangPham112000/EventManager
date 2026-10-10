import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { setSelectedEventId } from '@/store/uiSlice';

interface UpcomingEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps?: {
    participation?: 'JOINED' | 'INTERESTED';
    location?: string;
  };
}

interface UpcomingListProps {
  events: UpcomingEvent[];
}

interface DayGroup {
  key: string;
  day: Date;
  items: { event: UpcomingEvent; start: Date; end: Date }[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(date: Date) {
  return date
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    .replace(' ', '')
    .toLowerCase();
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Number of calendar days an event touches (an end at exactly midnight does not count that day). */
function spanDays(start: Date, end: Date) {
  const lastInstant = new Date(Math.max(start.getTime(), end.getTime() - 1));
  return Math.round((startOfDay(lastInstant).getTime() - startOfDay(start).getTime()) / MS_PER_DAY) + 1;
}

/**
 * List view: today's events and everything after, one row per event.
 * Multi-day events stay a single row showing their full date range,
 * grouped under the day they start (or today, if already in progress).
 */
export function UpcomingList({ events }: UpcomingListProps) {
  const dispatch = useAppDispatch();

  const groups = useMemo(() => {
    const today = startOfDay(new Date());
    const byDay = new Map<string, DayGroup>();

    events
      .map((event) => ({ event, start: new Date(event.start), end: new Date(event.end) }))
      .filter(({ end }) => end > today)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .forEach((item) => {
        const day = item.start < today ? today : startOfDay(item.start);
        const key = day.toDateString();
        if (!byDay.has(key)) byDay.set(key, { key, day, items: [] });
        byDay.get(key)!.items.push(item);
      });

    return [...byDay.values()];
  }, [events]);

  if (groups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No upcoming events
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-muted px-4 py-2 text-sm font-semibold">
            <span>{group.day.toLocaleDateString('en-US', { weekday: 'long' })}</span>
            <span>
              {group.day.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </h2>
          <ul>
            {group.items.map(({ event, start, end }) => {
              const days = spanDays(start, end);
              const interested = event.extendedProps?.participation === 'INTERESTED';
              const location = event.extendedProps?.location;
              return (
                <li key={event.id}>
                  <button
                    onClick={() => dispatch(setSelectedEventId(event.id))}
                    className="flex w-full items-start gap-3 border-b border-border/60 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent no-select"
                  >
                    <span className="w-36 shrink-0 text-xs leading-5 text-muted-foreground sm:w-80 sm:text-sm">
                      {days > 1 ? (
                        `${formatShortDate(start)}, ${formatTime(start)} → ${formatShortDate(end)}, ${formatTime(end)}`
                      ) : (
                        `${formatTime(start)} - ${formatTime(end)}`
                      )}
                    </span>
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        interested ? 'border-[1.5px] border-dashed border-primary' : 'bg-primary'
                      }`}
                      aria-label={interested ? 'Interested' : 'Joined'}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{event.title}</span>
                      {days > 1 && (
                        <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                          {days} days
                        </span>
                      )}
                      {location && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{location}</span>
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
