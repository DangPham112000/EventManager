import type { IDataSource, IEvent, IUser, CreateEventInput, UpdateEventInput } from './types.js';
import { SEED_EVENTS } from './mockData.js';

let events: IEvent[] = [...SEED_EVENTS];
let nextId = events.length + 1;

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
          (e.creator.id === userId || e.attendees.some((a) => a.id === userId)) &&
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
      participation: input.participation ?? 'JOINED',
      creator,
      attendees: [creator],
    };
    events.push(newEvent);
    return newEvent;
  },

  async updateEvent(id: string, input: UpdateEventInput) {
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const existing = events[index];
    const updated: IEvent = {
      ...existing,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.startTime !== undefined && { startTime: input.startTime }),
      ...(input.endTime !== undefined && { endTime: input.endTime }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.participation !== undefined && { participation: input.participation }),
    };
    events[index] = updated;
    return updated;
  },

  async deleteEvent(id: string) {
    const initialLength = events.length;
    events = events.filter((e) => e.id !== id);
    return events.length < initialLength;
  },
};
