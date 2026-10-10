import type { IEvent } from './data/types.js';
import { participationOf } from './participation.js';

interface TimeRange {
  startTime: string;
  endTime: string;
}

/** Two ranges conflict when they overlap; back-to-back events do not. */
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return Date.parse(a.startTime) < Date.parse(b.endTime) && Date.parse(b.startTime) < Date.parse(a.endTime);
}

/**
 * Whether the user has joined the event. Events they are only interested in
 * are not commitments, so they never cause conflicts.
 */
export function isCommitted(event: IEvent, userId: string): boolean {
  return participationOf(event, userId) === 'JOINED';
}

/** The user's joined events that overlap the given range, skipping `excludeId` (the event being edited). */
export function conflictsWith(range: TimeRange, events: IEvent[], userId: string, excludeId?: string): IEvent[] {
  return events.filter((e) => e.id !== excludeId && isCommitted(e, userId) && overlaps(range, e));
}

/** Every overlapping pair of the user's joined events in a schedule. */
export function findConflictPairs(events: IEvent[], userId: string): [IEvent, IEvent][] {
  const sorted = events
    .filter((e) => isCommitted(e, userId))
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  const pairs: [IEvent, IEvent][] = [];
  for (let i = 0; i < sorted.length; i++) {
    const end = Date.parse(sorted[i].endTime);
    // Sorted by start, so once an event starts after this one ends, the rest do too.
    for (let j = i + 1; j < sorted.length && Date.parse(sorted[j].startTime) < end; j++) {
      pairs.push([sorted[i], sorted[j]]);
    }
  }
  return pairs;
}
