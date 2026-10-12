import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { AlignLeft, Calendar, ChevronLeft, ChevronRight, Clock, Loader2, Lock, MapPin } from 'lucide-react';
import type { SharedCalendarData, SharedEvent } from '@/graphql/types';
import { GET_SHARED_CALENDAR } from '@/graphql/queries';
import { CalendarView } from '@/components/calendar/CalendarView';
import { UpcomingList } from '@/components/calendar/UpcomingList';
import { EventIcon } from '@/components/events/EventIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getHeaderTitle } from '@/lib/headerTitle';
import { formatDuration, formatTimeRange } from '@/lib/formatEventTime';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCalendarView } from '@/store/uiSlice';

const VIEWS = ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listUpcoming'] as const;
const VIEW_LABELS: Record<(typeof VIEWS)[number], string> = {
  dayGridMonth: 'Month',
  timeGridWeek: 'Week',
  timeGridDay: 'Day',
  listUpcoming: 'List',
};

function navigateCalendar(detail: 'prev' | 'next') {
  window.dispatchEvent(new CustomEvent('calendar-nav', { detail }));
}

/** Read-only details of one event of a PUBLIC shared calendar. */
function SharedEventSheet({ event, onClose }: { event: SharedEvent | null; onClose: () => void }) {
  return (
    <Sheet open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[70dvh] overflow-hidden rounded-t-2xl safe-bottom sm:max-h-dvh sm:w-[380px] sm:rounded-none sm:data-[side=bottom]:inset-x-auto sm:data-[side=bottom]:right-0 sm:data-[side=bottom]:left-auto sm:data-[side=bottom]:border-l sm:data-[side=bottom]:border-t-0"
      >
        {event && (
          <>
            <SheetHeader className="shrink-0 px-4 pt-4 pb-2">
              <div className="mb-2 h-1 w-12 rounded-full bg-primary" />
              <SheetTitle className="text-left text-lg leading-snug">
                <EventIcon event={event} className="mr-2 h-5 w-5 align-[-0.2em] text-primary" />
                {event.title}
              </SheetTitle>
              {event.participation && (
                <Badge
                  variant={event.participation === 'INTERESTED' ? 'outline' : 'default'}
                  className={event.participation === 'INTERESTED' ? 'w-fit border-dashed' : 'w-fit'}
                >
                  {event.participation === 'INTERESTED' ? 'Just interested' : 'Joined'}
                </Badge>
              )}
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">{formatTimeRange(event.startTime, event.endTime)}</p>
                  <p className="text-xs text-muted-foreground">{formatDuration(event.startTime, event.endTime)}</p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-foreground">{event.location}</p>
                </div>
              )}
              {event.description && (
                <div className="flex items-start gap-3">
                  <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.description}</p>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * /share/:token: someone's calendar opened from their share link. Needs no
 * sign-in and is read-only. In PRIVATE mode the server sends only busy
 * blocks, so there is nothing more to show when one is tapped.
 */
export function SharedCalendar() {
  const { token = '' } = useParams();
  const dispatch = useAppDispatch();
  const calendarView = useAppSelector((s) => s.ui.calendarView);
  const selectedDate = useAppSelector((s) => s.ui.selectedDate);
  const visibleRange = useAppSelector((s) => s.ui.visibleRange);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, loading, error } = useQuery<SharedCalendarData>(GET_SHARED_CALENDAR, {
    variables: { token },
  });
  const calendar = data?.sharedCalendar;
  const isPublic = calendar?.mode === 'PUBLIC';

  const calendarEvents = useMemo(
    () =>
      (calendar?.events ?? []).map((evt) => ({
        id: evt.id,
        title: evt.title,
        start: evt.startTime,
        end: evt.endTime,
        classNames: isPublic
          ? evt.participation === 'INTERESTED'
            ? ['fc-event-interested']
            : []
          : ['fc-event-busy'],
        extendedProps: {
          participation: evt.participation,
          description: evt.description ?? undefined,
          location: evt.location ?? undefined,
          icon: evt.icon,
          hideIcon: !isPublic,
        },
      })),
    [calendar, isPublic],
  );

  const selectedEvent = (isPublic && calendar?.events.find((e) => e.id === selectedId)) || null;
  const handleSelect = (id: string) => {
    if (isPublic) setSelectedId(id);
  };

  if (loading && !data) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !calendar) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center safe-top">
        <div className="rounded-full bg-secondary p-3">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">This calendar link does not work</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {error ? error.message : 'The owner may have stopped sharing it or replaced the link.'}
        </p>
      </div>
    );
  }

  const title = getHeaderTitle(calendarView, visibleRange, selectedDate);
  const isUpcomingList = calendarView === 'listUpcoming';

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background safe-top">
      <header className="flex w-full min-w-0 items-center gap-1 border-b border-border bg-background/80 py-2 pr-[max(0.5rem,env(safe-area-inset-right))] pl-[max(0.5rem,env(safe-area-inset-left))] backdrop-blur-md sm:gap-2 sm:px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Calendar className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex min-w-0 items-center sm:gap-1">
          {!isUpcomingList && (
            <Button
              variant="ghost"
              size="icon"
              className="no-select h-11 w-8 shrink-0 sm:touch-target"
              onClick={() => navigateCalendar('prev')}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="min-w-0 truncate text-center text-sm font-semibold sm:min-w-[120px] sm:text-base">
            {isUpcomingList ? (
              <span className="px-2">Upcoming</span>
            ) : (
              <>
                <span className="sm:hidden">{title.short}</span>
                <span className="hidden sm:inline lg:hidden">{title.medium}</span>
                <span className="hidden lg:inline">{title.long}</span>
              </>
            )}
          </h1>
          {!isUpcomingList && (
            <Button
              variant="ghost"
              size="icon"
              className="no-select h-11 w-8 shrink-0 sm:touch-target"
              onClick={() => navigateCalendar('next')}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1" />
        <div className="hidden items-center gap-0.5 rounded-lg bg-secondary p-0.5 sm:flex">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => dispatch(setCalendarView(v))}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors no-select ${
                calendarView === v
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
        <button
          onClick={() => dispatch(setCalendarView(VIEWS[(VIEWS.indexOf(calendarView) + 1) % VIEWS.length]))}
          className="shrink-0 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground no-select sm:hidden"
        >
          {VIEW_LABELS[calendarView]}
        </button>
      </header>

      <div className="flex min-w-0 items-center gap-2 border-b border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
        <span className="min-w-0 truncate font-medium text-foreground">{calendar.ownerName}'s calendar</span>
        <span className="shrink-0">·</span>
        <span className="shrink-0">{isPublic ? 'Read only' : 'Busy times only'}</span>
      </div>

      <main className="min-h-0 min-w-0 flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {isUpcomingList ? (
          <UpcomingList events={calendarEvents} onSelect={handleSelect} />
        ) : (
          <CalendarView events={calendarEvents} readOnly onEventClick={handleSelect} />
        )}
      </main>

      <SharedEventSheet event={selectedEvent} onClose={() => setSelectedId(null)} />
    </div>
  );
}
