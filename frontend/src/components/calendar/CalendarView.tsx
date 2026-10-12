import { useRef, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, DatesSetArg, EventContentArg } from '@fullcalendar/core';
import { EventIcon } from '@/components/events/EventIcon';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setSelectedDate,
  setSelectedEventId,
  openEventModal,
  setVisibleRange,
} from '@/store/uiSlice';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  classNames?: string[];
  extendedProps?: Record<string, unknown>;
}

// Swipe gesture tuning: a swipe must travel far enough horizontally, be mostly
// horizontal (so vertical scrolling is untouched) and start moving quickly, or
// it is a long-press drag/select handled by FullCalendar (longPressDelay=300).
const SWIPE_MIN_DISTANCE = 50;
const SWIPE_MAX_SLOPE = 0.6; // max |dy| / |dx|
const SWIPE_MOVE_TOLERANCE = 10;
const SWIPE_MAX_HOLD_MS = 250;

interface CalendarViewProps {
  events: CalendarEvent[];
  /** No creating, dragging or resizing events (shared calendars). */
  readOnly?: boolean;
  /** Called instead of opening the detail panel when an event is clicked. */
  onEventClick?: (id: string) => void;
}

/** FullCalendar's default event markup, with the event's icon before the title. */
function renderEventContent(arg: EventContentArg) {
  const { event } = arg;
  const { icon, location, description, hideIcon } = event.extendedProps as {
    icon?: string | null;
    location?: string;
    description?: string;
    hideIcon?: boolean;
  };
  return (
    <div className="fc-event-main-frame">
      {arg.timeText && <div className="fc-event-time">{arg.timeText}</div>}
      <div className="fc-event-title-container">
        <div className="fc-event-title fc-sticky">
          {!hideIcon && (
            <EventIcon
              event={{ icon, title: event.title, location, description }}
              className="mr-1 h-[1.1em] w-[1.1em] align-[-0.2em]"
            />
          )}
          {event.title || '\u00a0'}
        </div>
      </div>
    </div>
  );
}

/**
 * FullCalendar wrapper for the Month/Week/Day views (List is UpcomingList).
 * Listens for calendar-nav CustomEvents from the Header for prev/next navigation,
 * and for horizontal touch swipes that do the same on mobile.
 */
export function CalendarView({ events, readOnly = false, onEventClick }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const calendarView = useAppSelector((s) => s.ui.calendarView);
  const selectedDate = useAppSelector((s) => s.ui.selectedDate);

  // Sync view type from Redux
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api && api.view.type !== calendarView) {
      api.changeView(calendarView);
    }
  }, [calendarView]);

  // Sync selected date from Redux (e.g. from mini calendar)
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      const currentDate = api.getDate().toISOString();
      // Only navigate if the month/week differs
      const currentMonth = new Date(currentDate).getMonth();
      const selectedMonth = new Date(selectedDate).getMonth();
      if (currentMonth !== selectedMonth) {
        api.gotoDate(selectedDate);
      }
    }
  }, [selectedDate]);

  // Listen for nav events from Header
  useEffect(() => {
    const handler = (e: Event) => {
      const api = calendarRef.current?.getApi();
      if (!api) return;
      const detail = (e as CustomEvent).detail;
      if (detail === 'prev') api.prev();
      else if (detail === 'next') api.next();
      else if (detail === 'today') api.today();
    };

    window.addEventListener('calendar-nav', handler);
    return () => window.removeEventListener('calendar-nav', handler);
  }, []);

  // Touch swipe: left = next, right = prev (same as the Header buttons)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let start: { x: number; y: number; time: number } | null = null;
    let longPress = false;
    let moved = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        start = null;
        return;
      }
      const t = e.touches[0];
      start = { x: t.clientX, y: t.clientY, time: Date.now() };
      longPress = false;
      moved = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!start || moved) return;
      if (e.touches.length !== 1) {
        start = null;
        return;
      }
      const t = e.touches[0];
      const distance = Math.hypot(t.clientX - start.x, t.clientY - start.y);
      if (distance > SWIPE_MOVE_TOLERANCE) {
        moved = true;
        // Finger held still before moving: FullCalendar drag or select
        longPress = Date.now() - start.time > SWIPE_MAX_HOLD_MS;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      start = null;
      if (longPress || Math.abs(dx) < SWIPE_MIN_DISTANCE) return;
      if (Math.abs(dy) > Math.abs(dx) * SWIPE_MAX_SLOPE) return;

      const api = calendarRef.current?.getApi();
      if (!api) return;
      if (dx < 0) api.next();
      else api.prev();
    };

    const onTouchCancel = () => {
      start = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      if (onEventClick) onEventClick(info.event.id);
      else dispatch(setSelectedEventId(info.event.id));
    },
    [dispatch, onEventClick],
  );

  const handleDateSelect = useCallback(
    (info: DateSelectArg) => {
      dispatch(setSelectedDate(info.start.toISOString()));
      dispatch(openEventModal());
    },
    [dispatch],
  );

  const handleDatesSet = useCallback(
    (info: DatesSetArg) => {
      // Store the visible range for the header title, and its midpoint as the
      // selected date (mini calendar, default date for new events)
      dispatch(
        setVisibleRange({
          start: info.start.toISOString(),
          end: info.end.toISOString(),
          viewType: info.view.type,
        }),
      );
      const midpoint = new Date(
        (info.start.getTime() + info.end.getTime()) / 2,
      );
      dispatch(setSelectedDate(midpoint.toISOString()));
    },
    [dispatch],
  );

  return (
    <div ref={containerRef} className="h-full overflow-auto [&_.fc]:h-full">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={calendarView}
        initialDate={selectedDate}
        events={events}
        headerToolbar={false}
        editable={!readOnly}
        selectable={!readOnly}
        selectMirror={true}
        dayMaxEvents={3}
        // Render single-day timed events as filled pills in month view,
        // matching multi-day events (default 'auto' shows dot + text only).
        // Set globally: FullCalendar ignores eventDisplay in per-view options.
        eventDisplay="block"
        weekends={true}
        nowIndicator={true}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        select={handleDateSelect}
        datesSet={handleDatesSet}
        height="100%"
        stickyHeaderDates={true}
        longPressDelay={300}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: 'short',
        }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        // Mobile touch scrolling
        dayHeaderFormat={{ weekday: 'short' }}
        views={{
          // Week columns need the date too, or the header is just "MON TUE…"
          timeGridWeek: { dayHeaderFormat: { weekday: 'short', day: 'numeric' } },
          timeGridDay: { dayHeaderFormat: { weekday: 'long', month: 'short', day: 'numeric' } },
        }}
      />
    </div>
  );
}
