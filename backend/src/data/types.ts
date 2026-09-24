export interface IUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
}

export interface IEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
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
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}

export interface IDataSource {
  getUser(): Promise<IUser | null>;
  getEvents(): Promise<IEvent[]>;
  getEvent(id: string): Promise<IEvent | null>;
  createEvent(input: CreateEventInput): Promise<IEvent>;
  updateEvent(id: string, input: UpdateEventInput): Promise<IEvent | null>;
  deleteEvent(id: string): Promise<boolean>;
}
