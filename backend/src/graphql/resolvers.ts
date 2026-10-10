import { GraphQLError } from 'graphql';
import { getDataSource } from '../data/index.js';
import { createApiKey, listApiKeys, revokeApiKey } from '../apiKeys.js';
import type { CreateEventInput, IEvent, IUser, UpdateEventInput } from '../data/types.js';

export interface Context {
  user: IUser | null;
}

function requireUser(ctx: Context): IUser {
  if (!ctx.user) {
    throw new GraphQLError('You must be signed in', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return ctx.user;
}

/** A user sees the events they created or attend. */
function canSee(event: IEvent, user: IUser): boolean {
  return event.creator.id === user.id || event.attendees.some((a) => a.id === user.id);
}

/**
 * Load an event the user may change: it must exist, be visible to them, and be
 * one they created. Events they cannot see are reported as not found, so ids
 * of other users' events are not revealed.
 */
async function getOwnedEvent(id: string, user: IUser): Promise<IEvent> {
  const event = await getDataSource().getEvent(id);
  if (!event || !canSee(event, user)) {
    throw new GraphQLError(`Event with id "${id}" not found`, { extensions: { code: 'NOT_FOUND' } });
  }
  if (event.creator.id !== user.id) {
    throw new GraphQLError('Only the event creator can change or delete it', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return event;
}

export const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: Context) => ctx.user,

    getEvents: async (_: unknown, __: unknown, ctx: Context) => {
      const user = requireUser(ctx);
      return getDataSource().getUserEvents(user.id);
    },

    getEvent: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const user = requireUser(ctx);
      const event = await getDataSource().getEvent(id);
      return event && canSee(event, user) ? event : null;
    },

    apiKeys: async (_: unknown, __: unknown, ctx: Context) => listApiKeys(requireUser(ctx)),
  },

  Event: {
    isOwner: (event: IEvent, _: unknown, ctx: Context) => event.creator.id === ctx.user?.id,
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
      await getOwnedEvent(id, requireUser(ctx));
      const updated = await getDataSource().updateEvent(id, input);
      if (!updated) throw new Error(`Event with id "${id}" not found`);
      return updated;
    },

    deleteEvent: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      await getOwnedEvent(id, requireUser(ctx));
      return getDataSource().deleteEvent(id);
    },

    createApiKey: async (_: unknown, { name }: { name: string }, ctx: Context) =>
      createApiKey(requireUser(ctx), name),

    revokeApiKey: async (_: unknown, { id }: { id: string }, ctx: Context) =>
      revokeApiKey(requireUser(ctx), id),
  },
};
