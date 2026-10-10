import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDataSource } from '../data/index.js';
import type { IEvent, IUser, Participation, UpdateEventInput } from '../data/types.js';
import { conflictsWith, findConflictPairs } from '../schedule.js';
import { isMember, participationOf } from '../participation.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

// Used only to show times in a readable form; all inputs and stored values are absolute.
const timeZone = process.env.MCP_TIMEZONE || 'Asia/Ho_Chi_Minh';

// A factory, not a shared instance: reusing one zod schema makes the generated
// JSON Schema point at it with "$ref", which Gemini cannot resolve, so it drops the tools.
const isoTime = () =>
  z
    .string()
    .refine((s) => /(Z|[+-]\d{2}:?\d{2})$/i.test(s) && !Number.isNaN(Date.parse(s)), {
      message: 'Use ISO 8601 with a timezone offset, e.g. 2026-10-09T14:00:00+07:00',
    })
    .describe('ISO 8601 date-time with timezone offset, e.g. 2026-10-09T14:00:00+07:00');

const participation = z
  .enum(['JOINED', 'INTERESTED'])
  .describe(
    'JOINED: the user is attending (default). INTERESTED: only following the event; it never counts as a schedule conflict.',
  );

const allowConflict = z
  .boolean()
  .optional()
  .describe(
    'Save even if the time overlaps other events. Leave false first; if conflicts are reported, ask the user before retrying with true.',
  );

function formatLocal(start: string, end: string): string {
  const day = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = day.format(s) === day.format(e);
  return sameDay
    ? `${day.format(s)} ${time.format(s)}–${time.format(e)}`
    : `${day.format(s)} ${time.format(s)} – ${day.format(e)} ${time.format(e)}`;
}

function present(event: IEvent, user: IUser) {
  return {
    id: event.id,
    title: event.title,
    startTime: event.startTime,
    endTime: event.endTime,
    local: formatLocal(event.startTime, event.endTime),
    participation: participationOf(event, user.id),
    ...(event.location && { location: event.location }),
    ...(event.description && { description: event.description }),
    creator: event.creator.name,
    isOwner: event.creator.id === user.id,
    attendees: event.attendees.map((a) => ({ name: a.user.name, participation: a.participation })),
  };
}

function result(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function failure(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

function parseRange(from: string | undefined, to: string | undefined, defaultDays: number) {
  const start = from ? new Date(from) : new Date();
  const end = to ? new Date(to) : new Date(start.getTime() + defaultDays * DAY_MS);
  if (end <= start) return { error: '"to" must be after "from".' };
  if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    return { error: `The range can span at most ${MAX_RANGE_DAYS} days.` };
  }
  return { start, end };
}

/** An MCP server bound to one signed-in user. Created per request (stateless). */
export function createMcpServer(user: IUser): McpServer {
  const data = getDataSource();
  const now = new Date();

  const server = new McpServer(
    { name: 'event-manager', version: '1.0.0' },
    {
      instructions: [
        `Event Manager calendar of ${user.name} (${user.email}).`,
        `Current time: ${now.toISOString()} (${new Intl.DateTimeFormat('en-GB', { timeZone, dateStyle: 'full', timeStyle: 'short' }).format(now)} in ${timeZone}). Unless the user says otherwise, interpret times in ${timeZone}.`,
        'Always send times as ISO 8601 with an offset.',
        'Before creating or moving an event, the create/update tools check for overlaps and refuse when there are any; tell the user which events conflict and only retry with allowConflict=true if they agree.',
        'Each attendee has their own participation, JOINED or INTERESTED; the user\'s INTERESTED events are ignored when checking for conflicts.',
        'Use find_conflicts to review a schedule and check_availability to test a time slot.',
        'Only events the user created (isOwner=true) can be updated or deleted.',
      ].join('\n'),
    },
  );

  server.registerTool(
    'list_events',
    {
      title: 'List events',
      description:
        'List events in the user\'s calendar (created or attending) that overlap a time range, sorted by start time. Defaults to the next 30 days.',
      inputSchema: {
        from: isoTime().optional().describe('Range start (default: now)'),
        to: isoTime().optional().describe('Range end (default: from + 30 days)'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ from, to }) => {
      const range = parseRange(from, to, 30);
      if ('error' in range) return failure(range.error!);
      const events = await data.getUserEvents(user.id, range.start, range.end);
      return result({
        from: range.start.toISOString(),
        to: range.end.toISOString(),
        timeZone,
        count: events.length,
        events: events.map((e) => present(e, user)),
      });
    },
  );

  server.registerTool(
    'get_event',
    {
      title: 'Get event',
      description: 'Get one event by id.',
      inputSchema: { id: z.string().describe('Event id') },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => {
      const event = await data.getEvent(id);
      if (!event || !isMember(event, user.id)) return failure(`Event "${id}" not found.`);
      return result(present(event, user));
    },
  );

  server.registerTool(
    'check_availability',
    {
      title: 'Check availability',
      description:
        'Check whether a time slot is free. Returns the user\'s events that overlap it (back-to-back events do not count).',
      inputSchema: {
        startTime: isoTime(),
        endTime: isoTime(),
        excludeEventId: z.string().optional().describe('Ignore this event, e.g. when rescheduling it'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ startTime, endTime, excludeEventId }) => {
      if (Date.parse(endTime) <= Date.parse(startTime)) return failure('endTime must be after startTime.');
      const events = await data.getUserEvents(user.id, new Date(startTime), new Date(endTime));
      const conflicts = conflictsWith({ startTime, endTime }, events, user.id, excludeEventId);
      return result({
        free: conflicts.length === 0,
        slot: formatLocal(startTime, endTime),
        conflicts: conflicts.map((e) => present(e, user)),
      });
    },
  );

  server.registerTool(
    'find_conflicts',
    {
      title: 'Find schedule conflicts',
      description:
        'Find every pair of overlapping events in the user\'s calendar within a time range. Defaults to the next 30 days.',
      inputSchema: {
        from: isoTime().optional().describe('Range start (default: now)'),
        to: isoTime().optional().describe('Range end (default: from + 30 days)'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ from, to }) => {
      const range = parseRange(from, to, 30);
      if ('error' in range) return failure(range.error!);
      const events = await data.getUserEvents(user.id, range.start, range.end);
      const pairs = findConflictPairs(events, user.id);
      return result({
        from: range.start.toISOString(),
        to: range.end.toISOString(),
        eventsChecked: events.length,
        conflictCount: pairs.length,
        conflicts: pairs.map(([a, b]) => {
          const overlapStart = a.startTime > b.startTime ? a.startTime : b.startTime;
          const overlapEnd = Date.parse(a.endTime) < Date.parse(b.endTime) ? a.endTime : b.endTime;
          return {
            overlap: formatLocal(new Date(overlapStart).toISOString(), new Date(overlapEnd).toISOString()),
            events: [present(a, user), present(b, user)],
          };
        }),
      });
    },
  );

  server.registerTool(
    'create_event',
    {
      title: 'Create event',
      description:
        'Create an event owned by the user. Refuses and lists the overlapping events if the time is taken, unless allowConflict is true.',
      inputSchema: {
        title: z.string().min(1).max(200),
        startTime: isoTime(),
        endTime: isoTime(),
        description: z.string().max(5000).optional(),
        location: z.string().max(500).optional(),
        participation: participation.optional(),
        allowConflict,
      },
    },
    async ({ allowConflict, ...input }) => {
      if (Date.parse(input.endTime) <= Date.parse(input.startTime)) {
        return failure('endTime must be after startTime.');
      }
      const startTime = new Date(input.startTime).toISOString();
      const endTime = new Date(input.endTime).toISOString();
      const nearby = await data.getUserEvents(user.id, new Date(startTime), new Date(endTime));
      const conflicts = input.participation === 'INTERESTED' ? [] : conflictsWith({ startTime, endTime }, nearby, user.id);
      if (conflicts.length > 0 && !allowConflict) {
        return result({
          created: false,
          reason: 'The time overlaps existing events. Ask the user, then retry with allowConflict=true or pick another time.',
          conflicts: conflicts.map((e) => present(e, user)),
        });
      }
      const event = await data.createEvent({ ...input, startTime, endTime }, user);
      return result({
        created: true,
        event: present(event, user),
        ...(conflicts.length > 0 && { overlapsWith: conflicts.map((e) => present(e, user)) }),
      });
    },
  );

  server.registerTool(
    'update_event',
    {
      title: 'Update event',
      description:
        'Change an event the user owns. Only the fields given are changed. When the time changes, refuses on overlap unless allowConflict is true.',
      inputSchema: {
        id: z.string().describe('Event id'),
        title: z.string().min(1).max(200).optional(),
        startTime: isoTime().optional(),
        endTime: isoTime().optional(),
        description: z.string().max(5000).optional(),
        location: z.string().max(500).optional(),
        participation: participation.optional(),
        allowConflict,
      },
      annotations: { idempotentHint: true },
    },
    async ({ id, allowConflict, participation: newParticipation, ...changes }) => {
      const existing = await data.getEvent(id);
      if (!existing || !isMember(existing, user.id)) return failure(`Event "${id}" not found.`);
      if (existing.creator.id !== user.id) return failure('Only the event creator can change it.');

      const input: UpdateEventInput = { ...changes };
      if (changes.startTime) input.startTime = new Date(changes.startTime).toISOString();
      if (changes.endTime) input.endTime = new Date(changes.endTime).toISOString();
      const startTime = input.startTime ?? existing.startTime;
      const endTime = input.endTime ?? existing.endTime;
      if (Date.parse(endTime) <= Date.parse(startTime)) return failure('endTime must be after startTime.');

      let conflicts: IEvent[] = [];
      const nextParticipation: Participation | null = newParticipation ?? participationOf(existing, user.id);
      if (nextParticipation === 'JOINED' && (input.startTime || input.endTime || newParticipation)) {
        const nearby = await data.getUserEvents(user.id, new Date(startTime), new Date(endTime));
        conflicts = conflictsWith({ startTime, endTime }, nearby, user.id, id);
        if (conflicts.length > 0 && !allowConflict) {
          return result({
            updated: false,
            reason: 'The new time overlaps existing events. Ask the user, then retry with allowConflict=true or pick another time.',
            conflicts: conflicts.map((e) => present(e, user)),
          });
        }
      }

      let event = await data.updateEvent(id, input);
      // Participation is per user, so this changes only the creator's own.
      if (event && newParticipation) event = await data.joinEvent(id, user, newParticipation);
      if (!event) return failure(`Event "${id}" not found.`);
      return result({
        updated: true,
        event: present(event, user),
        ...(conflicts.length > 0 && { overlapsWith: conflicts.map((e) => present(e, user)) }),
      });
    },
  );

  server.registerTool(
    'delete_event',
    {
      title: 'Delete event',
      description: 'Permanently delete an event the user owns. Confirm with the user first.',
      inputSchema: { id: z.string().describe('Event id') },
      annotations: { destructiveHint: true },
    },
    async ({ id }) => {
      const existing = await data.getEvent(id);
      if (!existing || !isMember(existing, user.id)) return failure(`Event "${id}" not found.`);
      if (existing.creator.id !== user.id) return failure('Only the event creator can delete it.');
      await data.deleteEvent(id);
      return result({ deleted: true, event: present(existing, user) });
    },
  );

  return server;
}
