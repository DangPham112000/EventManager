import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { ApiKey } from './models/ApiKey.js';
import { User } from './models/User.js';
import { toUser } from './auth.js';
import { SEED_USER } from './data/mockData.js';
import type { IUser } from './data/types.js';

export const API_KEY_PREFIX = 'emk_';

export interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

const useMock = () => process.env.USE_MOCK === 'true';

// Mock mode keeps keys in memory, like the mock event store.
const mockKeys: (ApiKeyInfo & { hash: string; userId: string })[] = [];
let mockNextId = 1;

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

function toInfo(doc: any): ApiKeyInfo {
  return {
    id: doc._id.toString(),
    name: doc.name,
    prefix: doc.prefix,
    createdAt: doc.createdAt.toISOString(),
    lastUsedAt: doc.lastUsedAt?.toISOString(),
  };
}

/** Create a key for the user. The raw key is returned only here. */
export async function createApiKey(user: IUser, name: string): Promise<{ key: string; apiKey: ApiKeyInfo }> {
  const key = API_KEY_PREFIX + randomBytes(32).toString('base64url');
  const prefix = key.slice(0, API_KEY_PREFIX.length + 6);
  const trimmed = name.trim().slice(0, 100) || 'AI agent';

  if (useMock()) {
    const apiKey = { id: `key-${mockNextId++}`, name: trimmed, prefix, createdAt: new Date().toISOString() };
    mockKeys.push({ ...apiKey, hash: hashKey(key), userId: user.id });
    return { key, apiKey };
  }

  const doc = await ApiKey.create({ user: user.id, name: trimmed, hash: hashKey(key), prefix });
  return { key, apiKey: toInfo(doc) };
}

export async function listApiKeys(user: IUser): Promise<ApiKeyInfo[]> {
  if (useMock()) {
    return mockKeys.filter((k) => k.userId === user.id).map(({ hash, userId, ...info }) => info);
  }
  const docs = await ApiKey.find({ user: user.id }).sort({ createdAt: -1 });
  return docs.map(toInfo);
}

export async function revokeApiKey(user: IUser, id: string): Promise<boolean> {
  if (useMock()) {
    const index = mockKeys.findIndex((k) => k.id === id && k.userId === user.id);
    if (index === -1) return false;
    mockKeys.splice(index, 1);
    return true;
  }
  if (!mongoose.isValidObjectId(id)) return false;
  const result = await ApiKey.deleteOne({ _id: id, user: user.id });
  return result.deletedCount === 1;
}

/** Resolve the user who owns a raw API key, or null when it is unknown. */
export async function getUserFromApiKey(key: string | undefined): Promise<IUser | null> {
  if (!key?.startsWith(API_KEY_PREFIX)) return null;
  const hash = hashKey(key);

  if (useMock()) {
    const found = mockKeys.find((k) => k.hash === hash);
    if (!found) return null;
    found.lastUsedAt = new Date().toISOString();
    return SEED_USER;
  }

  const doc = await ApiKey.findOneAndUpdate({ hash }, { $set: { lastUsedAt: new Date() } });
  if (!doc) return null;
  const user = await User.findById(doc.user);
  return user ? toUser(user) : null;
}
