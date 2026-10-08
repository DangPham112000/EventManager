import { GraphQLError } from 'graphql';
import { getDataSource } from '../data/index.js';
import { createApiKey, listApiKeys, revokeApiKey } from '../apiKeys.js';
import type { CreateEventInput, IUser, UpdateEventInput } from '../data/types.js';

export interface Context {
  user: IUser | null;
}

function requireUser(ctx: Context): IUser {
  if (!ctx.user) {
    throw new GraphQLError('You must be signed in', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return ctx.user;
}

export const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: Context) => ctx.user,

    getEvents: async (_: unknown, __: unknown, ctx: Context) => {
      requireUser(ctx);
      return getDataSource().getEvents();
    },

    getEvent: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireUser(ctx);
      return getDataSource().getEvent(id);
    },

    apiKeys: async (_: unknown, __: unknown, ctx: Context) => listApiKeys(requireUser(ctx)),
  },

  Mutation: {
    createEvent: async (_: unknown, { input }: { input: CreateEventInput }, ctx: Context) => {
      const user = requireUser(ctx);
      return getDataSource().createEvent(input, user);
    },

    updateEvent: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateEventInput },
      ctx: Context,
    ) => {
      requireUser(ctx);
      const updated = await getDataSource().updateEvent(id, input);
      if (!updated) throw new Error(`Event with id "${id}" not found`);
      return updated;
    },

    deleteEvent: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      requireUser(ctx);
      return getDataSource().deleteEvent(id);
    },

    createApiKey: async (_: unknown, { name }: { name: string }, ctx: Context) =>
      createApiKey(requireUser(ctx), name),

    revokeApiKey: async (_: unknown, { id }: { id: string }, ctx: Context) =>
      revokeApiKey(requireUser(ctx), id),
  },
};
