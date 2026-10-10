import type { IEvent, Participation } from './data/types.js';

/** The user's participation in the event, or null if they are not an attendee. */
export function participationOf(event: IEvent, userId: string): Participation | null {
  return event.attendees.find((a) => a.user.id === userId)?.participation ?? null;
}

/** A user sees the events they created or attend. */
export function isMember(event: IEvent, userId: string): boolean {
  return event.creator.id === userId || participationOf(event, userId) !== null;
}
