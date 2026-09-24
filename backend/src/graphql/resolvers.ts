import { getDataSource } from '../data/index.js';
import type { CreateEventInput, UpdateEventInput } from '../data/types.js';

export const resolvers = {
  Query: {
    me: async () => {
      const ds = getDataSource();
      return ds.getUser();
    },

    getEvents: async () => {
      const ds = getDataSource();
      return ds.getEvents();
    },

    getEvent: async (_: unknown, { id }: { id: string }) => {
      const ds = getDataSource();
      return ds.getEvent(id);
    },
  },

  Mutation: {
    createEvent: async (_: unknown, { input }: { input: CreateEventInput }) => {
      const ds = getDataSource();
      return ds.createEvent(input);
    },

    updateEvent: async (_: unknown, { id, input }: { id: string; input: UpdateEventInput }) => {
      const ds = getDataSource();
      const updated = await ds.updateEvent(id, input);
      if (!updated) throw new Error(`Event with id "${id}" not found`);
      return updated;
    },

    deleteEvent: async (_: unknown, { id }: { id: string }) => {
      const ds = getDataSource();
      return ds.deleteEvent(id);
    },
  },
};
