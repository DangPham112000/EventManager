import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import type { Event, JoinEventData, LeaveEventData, Participation } from '@/graphql/types';
import { GET_EVENTS } from '@/graphql/queries';
import { JOIN_EVENT, LEAVE_EVENT } from '@/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Link2, Loader2, LogOut, Star, Users } from 'lucide-react';

/** Link that lets other users open the event and join it. */
function shareLink(event: Pick<Event, 'id' | 'shareToken'>): string | null {
  if (!event.shareToken) return null;
  return `${window.location.origin}/events/${event.id}?share=${encodeURIComponent(event.shareToken)}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/**
 * Everyone taking part in the event, with their own participation.
 */
export function AttendeeList({ event }: { event: Event }) {
  return (
    <div className="flex items-start gap-3">
      <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-sm text-foreground">
          {event.attendees.length} {event.attendees.length === 1 ? 'attendee' : 'attendees'}
        </p>
        <ul className="flex flex-col gap-1.5">
          {event.attendees.map(({ user, participation }) => (
            <li key={user.id} className="flex items-center gap-2">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                  {initials(user.name)}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {user.name}
                {user.id === event.creator.id && (
                  <span className="text-muted-foreground"> · organizer</span>
                )}
              </span>
              <Badge
                variant={participation === 'INTERESTED' ? 'outline' : 'secondary'}
                className={participation === 'INTERESTED' ? 'border-dashed' : undefined}
              >
                {participation === 'INTERESTED' ? 'Interested' : 'Joined'}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Join, change participation, or leave an event, and copy its share link.
 * The creator cannot leave their own event.
 */
export function ParticipationControls({
  event,
  shareToken,
  onLeft,
}: {
  event: Event;
  /** Token from the share link the event was opened with, needed to join. */
  shareToken?: string | null;
  /** Called after the user left the event. */
  onLeft?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [joinEvent, { loading: joining }] = useMutation<JoinEventData>(JOIN_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });
  const [leaveEvent, { loading: leaving }] = useMutation<LeaveEventData>(LEAVE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });
  const busy = joining || leaving;

  const join = async (participation: Participation) => {
    try {
      await joinEvent({ variables: { eventId: event.id, participation, shareToken } });
    } catch (err) {
      console.error('Failed to join event:', err);
    }
  };

  const leave = async () => {
    try {
      await leaveEvent({ variables: { eventId: event.id } });
      onLeft?.();
    } catch (err) {
      console.error('Failed to leave event:', err);
    }
  };

  const link = shareLink(event);
  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant={event.participation === 'JOINED' ? 'default' : 'outline'}
          aria-pressed={event.participation === 'JOINED'}
          // The current choice stays at full strength even though it is disabled.
          className="flex-1 gap-2 touch-target disabled:opacity-100"
          onClick={() => join('JOINED')}
          disabled={busy || event.participation === 'JOINED'}
        >
          {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {event.participation === 'JOINED' ? 'Joined' : 'Join'}
        </Button>
        <Button
          variant={event.participation === 'INTERESTED' ? 'default' : 'outline'}
          aria-pressed={event.participation === 'INTERESTED'}
          className="flex-1 gap-2 touch-target disabled:opacity-100"
          onClick={() => join('INTERESTED')}
          disabled={busy || event.participation === 'INTERESTED'}
        >
          <Star className="h-4 w-4" />
          Interested
        </Button>
      </div>
      <div className="flex gap-2">
        {event.participation && !event.isOwner && (
          <Button
            variant="ghost"
            className="flex-1 gap-2 text-muted-foreground touch-target"
            onClick={leave}
            disabled={busy}
          >
            {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Leave
          </Button>
        )}
        {link && (
          <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground touch-target" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? 'Link copied' : 'Copy invite link'}
          </Button>
        )}
      </div>
    </div>
  );
}
