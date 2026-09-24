import { useMutation, useQuery } from '@apollo/client/react';
import type { GetEventData } from '@/graphql/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GET_EVENT, GET_EVENTS } from '@/graphql/queries';
import { DELETE_EVENT } from '@/graphql/mutations';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedEventId, openEventModal } from '@/store/uiSlice';
import {
  MapPin,
  Clock,
  Calendar,
  Pencil,
  Trash2,
  Loader2,
  AlignLeft,
} from 'lucide-react';

/**
 * Format a date range for display.
 */
function formatTimeRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = s.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const startTime = s.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = e.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr} · ${startTime} – ${endTime}`;
}

/**
 * Format duration between two dates.
 */
function formatDuration(start: string, end: string): string {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

/**
 * Event detail panel — slides from bottom on mobile, right on desktop.
 * Shows when an event is selected from the calendar.
 */
export function EventDetailPanel() {
  const dispatch = useAppDispatch();
  const selectedEventId = useAppSelector((s) => s.ui.selectedEventId);
  const isOpen = selectedEventId !== null;

  const { data, loading } = useQuery<GetEventData>(GET_EVENT, {
    variables: { id: selectedEventId },
    skip: !isOpen,
  });

  const [deleteEvent, { loading: deleting }] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });

  const event = data?.getEvent;

  const handleEdit = () => {
    if (!selectedEventId) return;
    dispatch(setSelectedEventId(null));
    dispatch(openEventModal({ editingId: selectedEventId }));
  };

  const handleDelete = async () => {
    if (!selectedEventId) return;
    try {
      await deleteEvent({ variables: { id: selectedEventId } });
      dispatch(setSelectedEventId(null));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleClose = () => {
    dispatch(setSelectedEventId(null));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[70dvh] rounded-t-2xl safe-bottom sm:max-h-none sm:w-[380px] sm:rounded-none sm:data-[side=bottom]:inset-x-auto sm:data-[side=bottom]:right-0 sm:data-[side=bottom]:left-auto sm:data-[side=bottom]:border-l sm:data-[side=bottom]:border-t-0"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : event ? (
          <>
            <SheetHeader className="px-4 pt-4 pb-2">
              {/* Color accent bar */}
              <div className="mb-2 h-1 w-12 rounded-full bg-primary" />
              <SheetTitle className="text-left text-lg leading-snug">
                {event.title}
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-3 px-4 pb-4">
              {/* Time */}
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">
                    {formatTimeRange(event.startTime, event.endTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(event.startTime, event.endTime)}
                  </p>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-foreground">{event.location}</p>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="flex items-start gap-3">
                  <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Creator */}
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Created by {event.creator.name}
                </p>
              </div>

              <Separator className="my-1" />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 touch-target"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive touch-target"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Event not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
