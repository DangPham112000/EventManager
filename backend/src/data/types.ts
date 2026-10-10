export type Participation = 'JOINED' | 'INTERESTED';

export interface IUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId?: string;
}

/** One user's participation in an event. */
export interface IAttendee {
  user: IUser;
  participation: Participation;
}

export interface IEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  creator: IUser;
  /** Everyone taking part, including the creator, each with their own participation. */
  attendees: IAttendee[];
  /** Secret that lets users who are not attendees open the event, to join it. */
  shareToken: string;
  googleEventId?: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  /** The creator's participation. Defaults to JOINED. */
  participation?: Participation;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}

export interface IDataSource {
  getEvent(id: string): Promise<IEvent | null>;
  /**
   * Events the user created or attends, sorted by start time.
   * With from/to, only events overlapping [from, to).
   */
  getUserEvents(userId: string, from?: Date, to?: Date): Promise<IEvent[]>;
  createEvent(input: CreateEventInput, creator: IUser): Promise<IEvent>;
  updateEvent(id: string, input: UpdateEventInput): Promise<IEvent | null>;
  deleteEvent(id: string): Promise<boolean>;
  /** Add the user as an attendee, or change their participation if they already are one. */
  joinEvent(id: string, user: IUser, participation: Participation): Promise<IEvent | null>;
  /** Remove the user from the attendees. */
  leaveEvent(id: string, userId: string): Promise<IEvent | null>;
}
