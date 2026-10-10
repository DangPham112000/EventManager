export type Participation = 'JOINED' | 'INTERESTED';

export interface IUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId?: string;
}

export interface IEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  participation: Participation;
  creator: IUser;
  attendees: IUser[];
  googleEventId?: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  /** Defaults to JOINED. */
  participation?: Participation;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  participation?: Participation;
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
}
