import type { IDataSource, IUser, IEvent, CreateEventInput, UpdateEventInput, Participation } from './types.js';
import mongoose from 'mongoose';
import { Event } from '../models/Event.js';
import { findCoreUsers } from '../coreUsers.js';

/**
 * MongoDB/Mongoose data source.
 * Used when running with real database (USE_MOCK is not set).
 */
export const dbDataSource: IDataSource = {
  async getEvent(id: string): Promise<IEvent | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const event = await Event.findById(id);
    if (!event) return null;
    return mapEvent(event);
  },

  async getUserEvents(userId: string, from?: Date, to?: Date): Promise<IEvent[]> {
    const events = await Event.find({
      $or: [{ creator: userId }, { 'attendees.user': userId }],
      ...(to && { startTime: { $lt: to } }),
      ...(from && { endTime: { $gt: from } }),
    }).sort({ startTime: 1 });
    return mapEvents(events);
  },

  async createEvent({ participation, ...input }: CreateEventInput, creator: IUser): Promise<IEvent> {
    const event = await Event.create({
      ...input,
      creator: creator.id,
      attendees: [{ user: creator.id, participation: participation ?? 'JOINED' }],
    });

    return mapEvent(event);
  },

  async updateEvent(id: string, input: UpdateEventInput): Promise<IEvent | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const { icon, ...fields } = input;
    const update = icon === null ? { ...fields, $unset: { icon: '' } } : input;
    const event = await Event.findByIdAndUpdate(id, update, { new: true });
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
    );
    if (updated) return mapEvent(updated);
    const added = await Event.findOneAndUpdate(
      { _id: id, 'attendees.user': { $ne: user.id } },
      { $push: { attendees: { user: user.id, participation } } },
      { new: true },
    );
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
    );
    if (!event) return null;
    return mapEvent(event);
  },
};

async function mapEvent(doc: any): Promise<IEvent> {
  return (await mapEvents([doc]))[0];
}

/**
 * Map Mongoose documents to IEvent, filling in creators and attendees from
 * core.users with one query.
 */
async function mapEvents(docs: any[]): Promise<IEvent[]> {
  const ids = docs.flatMap((doc) => [doc.creator, ...(doc.attendees || []).map((a: any) => a.user)]);
  const users = await findCoreUsers(ids.filter(Boolean).map(String));
  return docs.map((doc) => toEvent(doc, users));
}

function toEvent(doc: any, users: Map<string, IUser>): IEvent {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    startTime: doc.startTime instanceof Date ? doc.startTime.toISOString() : doc.startTime,
    endTime: doc.endTime instanceof Date ? doc.endTime.toISOString() : doc.endTime,
    location: doc.location,
    icon: doc.icon ?? undefined,
    creator: users.get(String(doc.creator))!,
    attendees: (doc.attendees || [])
      .filter((a: any) => a.user)
      .map((a: any) => ({ user: users.get(String(a.user))!, participation: a.participation ?? 'JOINED' })),
    shareToken: doc.shareToken,
    googleEventId: doc.googleEventId,
  };
}
