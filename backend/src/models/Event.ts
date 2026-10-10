import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

export function newShareToken(): string {
  return randomBytes(16).toString('base64url');
}

const attendeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participation: { type: String, enum: ['JOINED', 'INTERESTED'], default: 'JOINED' },
  },
  { _id: false },
);

// TODO: Define full Event Schema
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Each attendee's own participation; the creator is always one of them.
  attendees: [attendeeSchema],
  shareToken: { type: String, default: newShareToken },
  googleEventId: { type: String },
});

eventSchema.index({ creator: 1 });
eventSchema.index({ 'attendees.user': 1 });

export const Event = mongoose.model('Event', eventSchema);

/**
 * Bring events saved before participation was per user up to date: their
 * single `participation` field becomes the creator's attendee entry, and
 * plain user ids in `attendees` become attendee entries. Also gives every
 * event a share token. Safe to run on every start.
 */
export async function migrateEvents(): Promise<void> {
  const collection = Event.collection;
  const legacy = await collection
    .find({ $or: [{ participation: { $exists: true } }, { 'attendees.0': { $type: 'objectId' } }] })
    .toArray();
  for (const doc of legacy) {
    const creatorId = String(doc.creator);
    const ids = [doc.creator, ...(doc.attendees ?? [])].filter(
      (id, i, all) => all.findIndex((other) => String(other) === String(id)) === i,
    );
    const attendees = ids.map((id) => ({
      user: id,
      participation: String(id) === creatorId ? (doc.participation ?? 'JOINED') : 'JOINED',
    }));
    await collection.updateOne({ _id: doc._id }, { $set: { attendees }, $unset: { participation: '' } });
  }

  const withoutToken = await collection.find({ shareToken: { $exists: false } }, { projection: { _id: 1 } }).toArray();
  for (const doc of withoutToken) {
    await collection.updateOne({ _id: doc._id }, { $set: { shareToken: newShareToken() } });
  }

  if (legacy.length || withoutToken.length) {
    console.log(`🔁 Migrated ${legacy.length} events to per-user participation, added ${withoutToken.length} share tokens`);
  }
}
