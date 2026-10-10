/**
 * Shared GraphQL response types for the frontend.
 */

export type Participation = 'JOINED' | 'INTERESTED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
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
