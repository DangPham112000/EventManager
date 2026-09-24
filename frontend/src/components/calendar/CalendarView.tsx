import { useRef, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg, DatesSetArg } from '@fullcalendar/core';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedDate, setSelectedEventId, openEventModal } from '@/store/uiSlice';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps?: Record<string, unknown>;
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

/**
 * FullCalendar wrapper with custom theming.
 * Listens for calendar-nav CustomEvents from the Header for prev/next navigation.
 */
export function CalendarView({ events }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
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

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      dispatch(setSelectedEventId(info.event.id));
    },
    [dispatch],
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
      // Update the displayed date range in Redux for the header title
      const midpoint = new Date(
        (info.start.getTime() + info.end.getTime()) / 2,
      );
      dispatch(setSelectedDate(midpoint.toISOString()));
    },
    [dispatch],
  );

  return (
    <div className="h-full overflow-auto [&_.fc]:h-full">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={calendarView}
        initialDate={selectedDate}
        events={events}
        headerToolbar={false}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        nowIndicator={true}
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
      />
    </div>
  );
}
