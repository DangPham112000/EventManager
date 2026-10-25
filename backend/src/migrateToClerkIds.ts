import mongoose from 'mongoose';
import { coreUsers } from './coreUsers.js';

/**
 * DAN-92: Event Manager stops keeping its own user table and reads users from the
 * shared core.users. This rewrites every reference to an old `users` document
 * (events.creator, events.attendees.user, apikeys.user) from its Mongo _id to the
 * user's Clerk id, and copies the calendar-share settings to `usersettings`.
 *
 * Safe to run on every start: once a user's references are rewritten, nothing matches
 * their _id any more, and settings are only inserted, never overwritten.
 *
 * Once no event or API key points at an old user any more, the old `users` collection
 * is dropped (verified in production on 2026-10-25; a dump from before the migration is
 * in /opt/event-manager/backups/pre-dan-92.archive). If anything still points at it,
 * it is kept and a warning is logged.
 */
export async function migrateUsersToClerkIds(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Not connected to MongoDB');
  const legacyUsers = await db.collection('users').find({}).toArray();
  if (legacyUsers.length === 0) return;

  const events = db.collection('events');
  const apiKeys = db.collection('apikeys');
  const settings = db.collection('usersettings');
  const counts = { events: 0, attendees: 0, apiKeys: 0, settings: 0 };

  for (const legacy of legacyUsers) {
    const email = typeof legacy.email === 'string' ? legacy.email.toLowerCase() : null;
    // core.users reflects the current Clerk app, so a match by email wins over a stored
    // clerkId that could be from an older Clerk app.
    const core = email ? await coreUsers().findOne({ email }) : null;
    const clerkId: string | undefined = core?.clerkId ?? legacy.clerkId;
    if (!clerkId) {
      console.warn(`⚠️  User ${legacy._id} has no Clerk id and is not in core.users; their data is not migrated`);
      continue;
    }

    const id = legacy._id;
    counts.events += (await events.updateMany({ creator: id }, { $set: { creator: clerkId } })).modifiedCount;
    counts.attendees += (
      await events.updateMany(
        { 'attendees.user': id },
        { $set: { 'attendees.$[a].user': clerkId } },
        { arrayFilters: [{ 'a.user': id }] },
      )
    ).modifiedCount;
    counts.apiKeys += (await apiKeys.updateMany({ user: id }, { $set: { user: clerkId } })).modifiedCount;
    if (legacy.calendarShare) {
      const res = await settings.updateOne(
        { clerkId },
        { $setOnInsert: { clerkId, calendarShare: legacy.calendarShare } },
        { upsert: true },
      );
      counts.settings += res.upsertedCount;
    }
  }

  if (Object.values(counts).some(Boolean)) {
    console.log(
      `🔁 DAN-92: moved to Clerk ids: ${counts.events} event creators, ${counts.attendees} events' attendees, ` +
        `${counts.apiKeys} API keys, ${counts.settings} calendar-share settings`,
    );
  }

  const leftovers =
    (await events.countDocuments({
      $or: [{ creator: { $type: 'objectId' } }, { 'attendees.user': { $type: 'objectId' } }],
    })) + (await apiKeys.countDocuments({ user: { $type: 'objectId' } }));
  if (leftovers > 0) {
    console.warn(`⚠️  ${leftovers} events or API keys still reference old users; keeping the users collection`);
    return;
  }
  await db.collection('users').drop();
  console.log(`🗑️  DAN-92: dropped the old users collection (${legacyUsers.length} users)`);
}
