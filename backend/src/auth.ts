import { createClerkClient, verifyToken } from '@clerk/backend';
import { findCoreUser, toUser } from './coreUsers.js';
import type { IUser } from './data/types.js';

const secretKey = process.env.CLERK_SECRET_KEY;
const clerk = secretKey ? createClerkClient({ secretKey }) : null;

// Origins allowed to use a session token (the token's "azp" claim).
// Comma-separated, e.g. "https://events.dantepham.site,http://localhost:5173".
const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Resolve the signed-in user from an "Authorization: Bearer <Clerk session token>" header.
 * Returns null when the header is missing or the token is invalid.
 */
export async function getUserFromAuthHeader(header: string | undefined): Promise<IUser | null> {
  if (!clerk || !header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();

  let clerkId: string;
  try {
    const payload = await verifyToken(token, { secretKey, authorizedParties });
    clerkId = payload.sub;
  } catch {
    return null;
  }

  return getUserByClerkId(clerkId);
}

/**
 * Resolve the signed-in user from a Clerk OAuth access token, which AI agents
 * get by signing in through Clerk (see mcp/oauth.ts). Returns null when the
 * token is invalid, expired or revoked.
 */
export async function getUserFromOAuthToken(token: string): Promise<IUser | null> {
  if (!clerk) return null;
  let clerkId: string;
  try {
    const accessToken = await clerk.idPOAuthAccessToken.verify(token);
    if (accessToken.revoked || accessToken.expired) return null;
    clerkId = accessToken.subject;
  } catch {
    return null;
  }
  return getUserByClerkId(clerkId);
}

/**
 * The user for a Clerk user id, read from the shared core.users. Falls back to the
 * Clerk API when core.users does not have the user yet (its webhook can arrive a
 * moment after a brand-new user's first request). Never writes core.users.
 */
export async function getUserByClerkId(clerkId: string): Promise<IUser | null> {
  const user = await findCoreUser(clerkId);
  if (user || !clerk) return user;

  try {
    const clerkUser = await clerk.users.getUser(clerkId);
    const email = (
      clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress
    )?.toLowerCase();
    if (!email) return null;
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || null;
    return toUser({ clerkId, email, name, avatar: clerkUser.imageUrl || null });
  } catch {
    return null;
  }
}
