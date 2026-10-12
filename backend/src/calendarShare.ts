import { randomBytes } from 'node:crypto';
import { User } from './models/User.js';
import { getDataSource } from './data/index.js';
import { participationOf } from './participation.js';
import type { IEvent, IUser, Participation } from './data/types.js';

/** PRIVATE shows only when the owner is busy; PUBLIC shows every event's details. */
export type CalendarShareMode = 'PRIVATE' | 'PUBLIC';

export interface CalendarShare {
  enabled: boolean;
  mode: CalendarShareMode;
  /** Secret in the share link (/share/:token); null until sharing is first turned on. */
  token: string | null;
}

/** An event as people with the share link see it. Holds no attendee or creator data. */
export interface SharedEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string | null;
  location: string | null;
  icon: string | null;
  participation: Participation | null;
}

export interface SharedCalendar {
  ownerName: string;
  mode: CalendarShareMode;
  events: SharedEvent[];
}

/** Title every event gets in PRIVATE mode. */
export const BUSY_TITLE = 'Busy';

const DEFAULT_SHARE: CalendarShare = { enabled: false, mode: 'PRIVATE', token: null };

function newCalendarShareToken(): string {
  return randomBytes(24).toString('base64url');
}

const useMock = () => process.env.USE_MOCK === 'true';

// Mock mode keeps settings in memory, like the mock event store.
const mockShares = new Map<string, { user: IUser; share: CalendarShare }>();

async function readShare(user: IUser): Promise<CalendarShare> {
  if (useMock()) return mockShares.get(user.id)?.share ?? DEFAULT_SHARE;
  const doc = await User.findById(user.id, { calendarShare: 1 });
  const saved = doc?.calendarShare;
  return {
    enabled: saved?.enabled ?? false,
    mode: (saved?.mode as CalendarShareMode | undefined) ?? 'PRIVATE',
    token: saved?.token ?? null,
  };
}

async function writeShare(user: IUser, share: CalendarShare): Promise<CalendarShare> {
  if (useMock()) {
    mockShares.set(user.id, { user, share });
    return share;
  }
  await User.updateOne({ _id: user.id }, { $set: { calendarShare: share } });
  return share;
}

export function getCalendarShare(user: IUser): Promise<CalendarShare> {
  return readShare(user);
}

/** Turn sharing on or off and/or change its mode. The first time it is turned on, a link is made. */
export async function updateCalendarShare(
  user: IUser,
  change: { enabled?: boolean | null; mode?: CalendarShareMode | null },
): Promise<CalendarShare> {
  const current = await readShare(user);
  const next: CalendarShare = {
    enabled: change.enabled ?? current.enabled,
    mode: change.mode ?? current.mode,
    token: current.token,
  };
  if (next.enabled && !next.token) next.token = newCalendarShareToken();
  return writeShare(user, next);
}

/** Replace the share link, so the old one stops working. */
export async function regenerateCalendarShareToken(user: IUser): Promise<CalendarShare> {
  const current = await readShare(user);
  return writeShare(user, { ...current, token: newCalendarShareToken() });
}

/** The owner of an enabled share link, or null when the token is unknown or sharing is off. */
async function findShareOwner(token: string): Promise<{ user: IUser; mode: CalendarShareMode } | null> {
  if (!token) return null;
  if (useMock()) {
    for (const { user, share } of mockShares.values()) {
      if (share.enabled && share.token === token) return { user, mode: share.mode };
    }
    return null;
  }
  const doc = await User.findOne({ 'calendarShare.token': token, 'calendarShare.enabled': true });
  if (!doc) return null;
  return {
    user: { id: doc._id.toString(), email: doc.email, name: doc.name },
    mode: (doc.calendarShare?.mode as CalendarShareMode | undefined) ?? 'PRIVATE',
  };
}

/**
 * What a share link reveals about one of the owner's events. In PRIVATE mode
 * only the time is real: the title becomes "Busy", every other field is
 * dropped and the id is replaced, so nothing leaves the server that could
 * identify the event.
 */
export function toSharedEvent(event: IEvent, ownerId: string, mode: CalendarShareMode, index: number): SharedEvent {
  if (mode === 'PRIVATE') {
    return {
      id: `busy-${index}`,
      title: BUSY_TITLE,
      startTime: event.startTime,
      endTime: event.endTime,
      description: null,
      location: null,
      icon: null,
      participation: null,
    };
  }
  return {
    id: event.id,
    title: event.title,
    startTime: event.startTime,
    endTime: event.endTime,
    description: event.description ?? null,
    location: event.location ?? null,
    icon: event.icon ?? null,
    participation: participationOf(event, ownerId),
  };
}

/** The calendar behind a share link, or null when the link is unknown or sharing is off. */
export async function getSharedCalendar(token: string): Promise<SharedCalendar | null> {
  const owner = await findShareOwner(token);
  if (!owner) return null;
  const events = await getDataSource().getUserEvents(owner.user.id);
  return {
    // The owner chose to share their calendar, so their name is shown; their email is not.
    ownerName: owner.user.name,
    mode: owner.mode,
    events: events.map((event, i) => toSharedEvent(event, owner.user.id, owner.mode, i)),
  };
}
