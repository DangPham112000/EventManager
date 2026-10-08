import type { IEvent } from './data/types.js';

interface TimeRange {
  startTime: string;
  endTime: string;
}

/** Two ranges conflict when they overlap; back-to-back events do not. */
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return Date.parse(a.startTime) < Date.parse(b.endTime) && Date.parse(b.startTime) < Date.parse(a.endTime);
}

/** Events that overlap the given range, skipping `excludeId` (the event being edited). */
export function conflictsWith(range: TimeRange, events: IEvent[], excludeId?: string): IEvent[] {
  return events.filter((e) => e.id !== excludeId && overlaps(range, e));
}

/** Every overlapping pair in a schedule. */
export function findConflictPairs(events: IEvent[]): [IEvent, IEvent][] {
  const sorted = [...events].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
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
