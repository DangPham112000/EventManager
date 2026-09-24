import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_EVENTS } from '@/graphql/queries';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Loader2 } from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  creator: { id: string; name: string };
}

/**
 * Dashboard page — main calendar view.
 * Fetches events from GraphQL and passes them to CalendarView.
 */
export function Dashboard() {
  const { data, loading, error } = useQuery<{ getEvents: EventData[] }>(GET_EVENTS);

  // Map GraphQL events to FullCalendar format
  const calendarEvents = useMemo(() => {
    if (!data?.getEvents) return [];
    return data.getEvents.map((evt) => ({
      id: evt.id,
      title: evt.title,
      start: evt.startTime,
      end: evt.endTime,
      extendedProps: {
        description: evt.description,
        location: evt.location,
        creator: evt.creator,
      },
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Failed to load events. Make sure the backend is running.
        </p>
        <p className="text-xs text-muted-foreground/60">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <CalendarView events={calendarEvents} />
    </div>
  );
}
