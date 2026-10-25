/**
 * Shared GraphQL response types for the frontend.
 */

export type Participation = 'JOINED' | 'INTERESTED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Attendee {
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  participation: Participation;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  /** Icon key picked for the event; null when none was picked (one is then suggested). */
  icon?: string | null;
  /** The signed-in user's participation, or null if they have not joined. */
  participation: Participation | null;
  creator: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  attendees: Attendee[];
  googleEventId?: string;
  /** Whether the signed-in user created the event (only then can they edit or delete it). */
  isOwner: boolean;
  /** Token for the share link; only attendees receive it. */
  shareToken?: string | null;
}

// Query response types
export interface MeQueryData {
  me: User | null;
}

export interface GetEventsData {
  getEvents: Event[];
}

export interface GetEventData {
  getEvent: Event | null;
}

// Mutation response types
export interface CreateEventData {
  createEvent: Event;
}

export interface UpdateEventData {
  updateEvent: Event;
}

export interface JoinEventData {
  joinEvent: Event;
}

export interface LeaveEventData {
  leaveEvent: Event;
}

export interface DeleteEventData {
  deleteEvent: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

export interface ApiKeysData {
  apiKeys: ApiKey[];
}

export interface CreateApiKeyData {
  createApiKey: { key: string; apiKey: ApiKey };
}

/** PRIVATE shows only busy times; PUBLIC shows every event's details. */
export type CalendarShareMode = 'PRIVATE' | 'PUBLIC';

export interface CalendarShare {
  enabled: boolean;
  mode: CalendarShareMode;
  /** Secret in the share link; null until sharing is first turned on. */
  token: string | null;
}

export interface CalendarShareData {
  calendarShare: CalendarShare;
}

/** An event as a share link shows it. In PRIVATE mode the title is "Busy" and the rest is null. */
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

export interface SharedCalendarData {
  sharedCalendar: {
    ownerName: string;
    mode: CalendarShareMode;
    events: SharedEvent[];
  } | null;
}
