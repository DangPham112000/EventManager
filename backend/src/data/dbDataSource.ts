import type { IDataSource, IUser, IEvent, CreateEventInput, UpdateEventInput } from './types.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';

/**
 * MongoDB/Mongoose data source.
 * Used when running with real database (USE_MOCK is not set).
 *
 * TODO: Implement full Mongoose queries when MongoDB is wired up.
 * For now, these are typed stubs matching the IDataSource interface.
 */
export const dbDataSource: IDataSource = {
  async getUser(): Promise<IUser | null> {
    // In single-user mode, return the first (seeded) user
    const user = await User.findOne();
    if (!user) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar || undefined,
      googleId: user.googleId,
    };
  },

  async getEvents(): Promise<IEvent[]> {
    const events = await Event.find().populate('creator').populate('attendees');
    return events.map(mapEvent);
  },

  async getEvent(id: string): Promise<IEvent | null> {
    const event = await Event.findById(id).populate('creator').populate('attendees');
    if (!event) return null;
    return mapEvent(event);
  },

  async createEvent(input: CreateEventInput): Promise<IEvent> {
    // In single-user mode, use the first user as creator
    const user = await User.findOne();
    if (!user) throw new Error('No user found. Seed the database first.');

    const event = await Event.create({
      ...input,
      creator: user._id,
      attendees: [user._id],
    });

    const populated = await event.populate(['creator', 'attendees']);
    return mapEvent(populated);
  },

  async updateEvent(id: string, input: UpdateEventInput): Promise<IEvent | null> {
    const event = await Event.findByIdAndUpdate(id, input, { new: true })
      .populate('creator')
      .populate('attendees');
    if (!event) return null;
    return mapEvent(event);
  },

  async deleteEvent(id: string): Promise<boolean> {
    const result = await Event.findByIdAndDelete(id);
    return result !== null;
  },
};

/**
 * Map a Mongoose document to the IEvent interface.
 */
function mapEvent(doc: any): IEvent {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    startTime: doc.startTime instanceof Date ? doc.startTime.toISOString() : doc.startTime,
    endTime: doc.endTime instanceof Date ? doc.endTime.toISOString() : doc.endTime,
    location: doc.location,
    creator: {
      id: doc.creator._id.toString(),
      email: doc.creator.email,
      name: doc.creator.name,
      avatar: doc.creator.avatar,
      googleId: doc.creator.googleId,
    },
    attendees: (doc.attendees || []).map((a: any) => ({
      id: a._id.toString(),
      email: a.email,
      name: a.name,
      avatar: a.avatar,
      googleId: a.googleId,
    })),
    googleEventId: doc.googleEventId,
  };
}
