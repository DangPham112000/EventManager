/**
 * Shared GraphQL response types for the frontend.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  creator: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  attendees: Pick<User, 'id' | 'name' | 'email' | 'avatar'>[];
  googleEventId?: string;
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

export interface DeleteEventData {
  deleteEvent: boolean;
}
