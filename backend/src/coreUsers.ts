import mongoose from 'mongoose';
import type { IUser } from './data/types.js';

/**
 * Shared user table `core.users` (DAN-91). The core-users service in ecosystem-infra
 * is its only writer and keeps it in sync with Clerk; this app's Mongo user can only
 * read it. Users are identified by their Clerk id everywhere in Event Manager (DAN-92).
 */
export interface CoreUser {
  clerkId: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

export function coreUsers() {
  return mongoose.connection.useDb('core', { useCache: true }).collection<CoreUser>('users');
}

export function toUser(doc: Pick<CoreUser, 'clerkId' | 'email' | 'name' | 'avatar'>): IUser {
  return {
    id: doc.clerkId,
    email: doc.email,
    name: doc.name || doc.email.split('@')[0],
    avatar: doc.avatar || undefined,
  };
}

/** Shown in place of a user who is no longer in Clerk. */
function deletedUser(clerkId: string): IUser {
  return { id: clerkId, email: '', name: 'Deleted user' };
}

export async function findCoreUser(clerkId: string): Promise<IUser | null> {
  const doc = await coreUsers().findOne({ clerkId });
  return doc ? toUser(doc) : null;
}

/** Look up many users at once. Ids missing from core.users map to a "Deleted user". */
export async function findCoreUsers(clerkIds: string[]): Promise<Map<string, IUser>> {
  const ids = [...new Set(clerkIds.map(String))];
  const docs = ids.length ? await coreUsers().find({ clerkId: { $in: ids } }).toArray() : [];
  const found = new Map(docs.map((doc) => [doc.clerkId, toUser(doc)]));
  return new Map(ids.map((id) => [id, found.get(id) ?? deletedUser(id)]));
}
