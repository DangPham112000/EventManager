import { randomBytes } from 'node:crypto';
import type { IDataSource, IEvent, IUser, CreateEventInput, UpdateEventInput, Participation } from './types.js';
import { SEED_EVENTS } from './mockData.js';
import { isMember } from '../participation.js';

let events: IEvent[] = [...SEED_EVENTS];
let nextId = events.length + 1;

/** Replace the event at `id` with `change(existing)`; null if there is no such event. */
function replace(id: string, change: (existing: IEvent) => IEvent): IEvent | null {
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  events[index] = change(events[index]);
  return events[index];
}

/**
 * In-memory data source for development.
 * All data lives in arrays and resets on server restart.
 */
export const mockDataSource: IDataSource = {
  async getEvent(id: string) {
    return events.find((e) => e.id === id) ?? null;
  },

  async getUserEvents(userId: string, from?: Date, to?: Date) {
    return events
      .filter(
        (e) =>
          isMember(e, userId) &&
          (!to || new Date(e.startTime) < to) &&
          (!from || new Date(e.endTime) > from),
      )
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  },

  async createEvent(input: CreateEventInput, creator: IUser) {
    const newEvent: IEvent = {
      id: `evt-${String(nextId++).padStart(3, '0')}`,
      title: input.title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      creator,
      attendees: [{ user: creator, participation: input.participation ?? 'JOINED' }],
      shareToken: randomBytes(16).toString('base64url'),
    };
    events.push(newEvent);
    return newEvent;
  },

  async updateEvent(id: string, input: UpdateEventInput) {
    return replace(id, (existing) => ({
      ...existing,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.startTime !== undefined && { startTime: input.startTime }),
      ...(input.endTime !== undefined && { endTime: input.endTime }),
      ...(input.location !== undefined && { location: input.location }),
    }));
  },

  async deleteEvent(id: string) {
    const initialLength = events.length;
    events = events.filter((e) => e.id !== id);
    return events.length < initialLength;
  },

  async joinEvent(id: string, user: IUser, participation: Participation) {
    return replace(id, (existing) => ({
      ...existing,
      attendees: existing.attendees.some((a) => a.user.id === user.id)
        ? existing.attendees.map((a) => (a.user.id === user.id ? { ...a, participation } : a))
        : [...existing.attendees, { user, participation }],
    }));
  },

  async leaveEvent(id: string, userId: string) {
    return replace(id, (existing) => ({
      ...existing,
      attendees: existing.attendees.filter((a) => a.user.id !== userId),
    }));
  },
};
