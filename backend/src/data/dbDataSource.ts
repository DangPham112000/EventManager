import type { IDataSource, IUser, IEvent, CreateEventInput, UpdateEventInput, Participation } from './types.js';
import mongoose from 'mongoose';
import { Event } from '../models/Event.js';

const POPULATE = ['creator', 'attendees.user'];

/**
 * MongoDB/Mongoose data source.
 * Used when running with real database (USE_MOCK is not set).
 */
export const dbDataSource: IDataSource = {
  async getEvent(id: string): Promise<IEvent | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const event = await Event.findById(id).populate(POPULATE);
    if (!event) return null;
    return mapEvent(event);
  },

  async getUserEvents(userId: string, from?: Date, to?: Date): Promise<IEvent[]> {
    const events = await Event.find({
      $or: [{ creator: userId }, { 'attendees.user': userId }],
      ...(to && { startTime: { $lt: to } }),
      ...(from && { endTime: { $gt: from } }),
    })
      .sort({ startTime: 1 })
      .populate(POPULATE);
    return events.map(mapEvent);
  },

  async createEvent({ participation, ...input }: CreateEventInput, creator: IUser): Promise<IEvent> {
    const event = await Event.create({
      ...input,
      creator: creator.id,
      attendees: [{ user: creator.id, participation: participation ?? 'JOINED' }],
    });

    const populated = await event.populate(POPULATE);
    return mapEvent(populated);
  },

  async updateEvent(id: string, input: UpdateEventInput): Promise<IEvent | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const event = await Event.findByIdAndUpdate(id, input, { new: true }).populate(POPULATE);
    if (!event) return null;
    return mapEvent(event);
  },

  async deleteEvent(id: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) return false;
    const result = await Event.findByIdAndDelete(id);
    return result !== null;
  },

  async joinEvent(id: string, user: IUser, participation: Participation): Promise<IEvent | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    // Change the participation if the user already attends; otherwise add them.
    const updated = await Event.findOneAndUpdate(
      { _id: id, 'attendees.user': user.id },
      { $set: { 'attendees.$.participation': participation } },
      { new: true },
    ).populate(POPULATE);
    if (updated) return mapEvent(updated);
    const added = await Event.findOneAndUpdate(
      { _id: id, 'attendees.user': { $ne: user.id } },
      { $push: { attendees: { user: user.id, participation } } },
      { new: true },
    ).populate(POPULATE);
    // Lost a race with a concurrent join: the user is attending now, so just set it again.
    if (!added) return (await Event.exists({ _id: id })) ? dbDataSource.joinEvent(id, user, participation) : null;
    return mapEvent(added);
  },

  async leaveEvent(id: string, userId: string): Promise<IEvent | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const event = await Event.findByIdAndUpdate(
      id,
      { $pull: { attendees: { user: userId } } },
      { new: true },
    ).populate(POPULATE);
    if (!event) return null;
    return mapEvent(event);
  },
};

function mapUser(doc: any): IUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    avatar: doc.avatar,
    googleId: doc.googleId,
  };
}

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
    creator: mapUser(doc.creator),
    attendees: (doc.attendees || [])
      // Skip attendees whose user was deleted.
      .filter((a: any) => a.user)
      .map((a: any) => ({ user: mapUser(a.user), participation: a.participation ?? 'JOINED' })),
    shareToken: doc.shareToken,
    googleEventId: doc.googleEventId,
  };
}
