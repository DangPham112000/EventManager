import type { IDataSource, IUser, IEvent, CreateEventInput, UpdateEventInput } from './types.js';
import mongoose from 'mongoose';
import { Event } from '../models/Event.js';

/**
 * MongoDB/Mongoose data source.
 * Used when running with real database (USE_MOCK is not set).
 *
 * TODO: Implement full Mongoose queries when MongoDB is wired up.
 * For now, these are typed stubs matching the IDataSource interface.
 */
export const dbDataSource: IDataSource = {
  async getEvents(): Promise<IEvent[]> {
    const events = await Event.find().populate('creator').populate('attendees');
    return events.map(mapEvent);
  },

  async getEvent(id: string): Promise<IEvent | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const event = await Event.findById(id).populate('creator').populate('attendees');
    if (!event) return null;
    return mapEvent(event);
  },

  async getUserEvents(userId: string, from?: Date, to?: Date): Promise<IEvent[]> {
    const events = await Event.find({
      $or: [{ creator: userId }, { attendees: userId }],
      ...(to && { startTime: { $lt: to } }),
      ...(from && { endTime: { $gt: from } }),
    })
      .sort({ startTime: 1 })
      .populate('creator')
      .populate('attendees');
    return events.map(mapEvent);
  },

  async createEvent(input: CreateEventInput, creator: IUser): Promise<IEvent> {
    const event = await Event.create({
      ...input,
      creator: creator.id,
      attendees: [creator.id],
    });

    const populated = await event.populate(['creator', 'attendees']);
    return mapEvent(populated);
  },

  async updateEvent(id: string, input: UpdateEventInput): Promise<IEvent | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const event = await Event.findByIdAndUpdate(id, input, { new: true })
      .populate('creator')
      .populate('attendees');
    if (!event) return null;
    return mapEvent(event);
  },

  async deleteEvent(id: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) return false;
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
