import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import type { GetEventData } from '@/graphql/types';
import { GET_EVENT, GET_EVENTS } from '@/graphql/queries';
import { DELETE_EVENT } from '@/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch } from '@/store';
import { openEventModal } from '@/store/uiSlice';
import {
  ArrowLeft,
  MapPin,
  Clock,
  AlignLeft,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';

/**
 * Full-page event detail view at /events/:id
 */
export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data, loading, error } = useQuery<GetEventData>(GET_EVENT, {
    variables: { id },
    skip: !id,
  });

  const [deleteEvent, { loading: deleting }] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.getEvent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-muted-foreground">Event not found</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Button>
      </div>
    );
  }

  const event = data.getEvent;
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = `${startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })} – ${endDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const handleEdit = () => {
    dispatch(openEventModal({ editingId: event.id }));
  };

  const handleDelete = async () => {
    try {
      await deleteEvent({ variables: { id: event.id } });
      navigate('/');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-auto safe-bottom">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="touch-target"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="flex-1 text-sm font-medium">Event Details</span>
        <Button
          variant="ghost"
          size="icon"
          className="touch-target"
          onClick={handleEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="touch-target text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6">
        {/* Title with color accent */}
        <div>
          <div className="mb-3 h-1 w-16 rounded-full bg-primary" />
          <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3">
          <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">{dateStr}</p>
            <p className="text-sm text-muted-foreground">{timeStr}</p>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <p className="text-foreground">{event.location}</p>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <>
            <Separator />
            <div className="flex items-start gap-3">
              <AlignLeft className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <p className="whitespace-pre-wrap text-muted-foreground">
                {event.description}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
