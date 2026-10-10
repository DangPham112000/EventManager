import { timingSafeEqual } from 'node:crypto';
import { GraphQLError } from 'graphql';
import { getDataSource } from '../data/index.js';
import { createApiKey, listApiKeys, revokeApiKey } from '../apiKeys.js';
import type { CreateEventInput, IEvent, IUser, Participation, UpdateEventInput } from '../data/types.js';
import { isMember, participationOf } from '../participation.js';

export interface Context {
  user: IUser | null;
}

function requireUser(ctx: Context): IUser {
  if (!ctx.user) {
    throw new GraphQLError('You must be signed in', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return ctx.user;
}

function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * A user sees the events they created or attend, and any event whose share
 * link (share token) they were given.
 */
function canSee(event: IEvent, user: IUser, shareToken?: string | null): boolean {
  return isMember(event, user.id) || (!!shareToken && !!event.shareToken && sameToken(shareToken, event.shareToken));
}

function notFound(id: string): GraphQLError {
  return new GraphQLError(`Event with id "${id}" not found`, { extensions: { code: 'NOT_FOUND' } });
}

/**
 * Load an event the user can see. Events they cannot see are reported as not
 * found, so ids of other users' events are not revealed.
 */
async function getVisibleEvent(id: string, user: IUser, shareToken?: string | null): Promise<IEvent> {
  const event = await getDataSource().getEvent(id);
  if (!event || !canSee(event, user, shareToken)) throw notFound(id);
  return event;
}

/** Load an event the user may change: one they can see and created. */
async function getOwnedEvent(id: string, user: IUser): Promise<IEvent> {
  const event = await getVisibleEvent(id, user);
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

    getEvent: async (
      _: unknown,
      { id, shareToken }: { id: string; shareToken?: string | null },
      ctx: Context,
    ) => {
      const user = requireUser(ctx);
      const event = await getDataSource().getEvent(id);
      return event && canSee(event, user, shareToken) ? event : null;
    },

    apiKeys: async (_: unknown, __: unknown, ctx: Context) => listApiKeys(requireUser(ctx)),
  },

  Event: {
    isOwner: (event: IEvent, _: unknown, ctx: Context) => event.creator.id === ctx.user?.id,
    participation: (event: IEvent, _: unknown, ctx: Context) =>
      ctx.user ? participationOf(event, ctx.user.id) : null,
    // Only attendees may pass the link on.
    shareToken: (event: IEvent, _: unknown, ctx: Context) =>
      ctx.user && isMember(event, ctx.user.id) ? event.shareToken : null,
  },

  Mutation: {
    createEvent: async (_: unknown, { input }: { input: CreateEventInput }, ctx: Context) => {
      const user = requireUser(ctx);
      return getDataSource().createEvent(input, user);
    },

    updateEvent: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateEventInput & { participation?: Participation | null } },
      ctx: Context,
    ) => {
      const user = requireUser(ctx);
      await getOwnedEvent(id, user);
      const { participation, ...fields } = input;
      let updated = await getDataSource().updateEvent(id, fields);
      // Participation is per user, so this changes only the creator's own.
      if (updated && participation) updated = await getDataSource().joinEvent(id, user, participation);
      if (!updated) throw notFound(id);
      return updated;
    },

    deleteEvent: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      await getOwnedEvent(id, requireUser(ctx));
      return getDataSource().deleteEvent(id);
    },

    joinEvent: async (
      _: unknown,
      {
        eventId,
        participation,
        shareToken,
      }: { eventId: string; participation?: Participation | null; shareToken?: string | null },
      ctx: Context,
    ) => {
      const user = requireUser(ctx);
      await getVisibleEvent(eventId, user, shareToken);
      const joined = await getDataSource().joinEvent(eventId, user, participation ?? 'JOINED');
      if (!joined) throw notFound(eventId);
      return joined;
    },

    leaveEvent: async (_: unknown, { eventId }: { eventId: string }, ctx: Context) => {
      const user = requireUser(ctx);
      const event = await getVisibleEvent(eventId, user);
      if (event.creator.id === user.id) {
        throw new GraphQLError('The creator cannot leave their own event; delete it instead', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const left = await getDataSource().leaveEvent(eventId, user.id);
      if (!left) throw notFound(eventId);
      return left;
    },

    createApiKey: async (_: unknown, { name }: { name: string }, ctx: Context) =>
      createApiKey(requireUser(ctx), name),

    revokeApiKey: async (_: unknown, { id }: { id: string }, ctx: Context) =>
      revokeApiKey(requireUser(ctx), id),
  },
};
