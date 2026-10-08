import { createClerkClient, verifyToken } from '@clerk/backend';
import { User } from './models/User.js';
import type { IUser } from './data/types.js';

const secretKey = process.env.CLERK_SECRET_KEY;
const clerk = secretKey ? createClerkClient({ secretKey }) : null;

// Origins allowed to use a session token (the token's "azp" claim).
// Comma-separated, e.g. "https://events.dantepham.site,http://localhost:5173".
const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function toUser(doc: any): IUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    avatar: doc.avatar || undefined,
    googleId: doc.googleId || undefined,
  };
}

/**
 * Resolve the signed-in user from an "Authorization: Bearer <Clerk session token>" header.
 * Returns null when the header is missing or the token is invalid.
 *
 * First sign-in of a Clerk user links to an existing Mongo user with the same
 * email (so users seeded before Clerk keep their events), or creates one.
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

  const existing = await User.findOne({ clerkId });
  if (existing) return toUser(existing);

  const clerkUser = await clerk.users.getUser(clerkId);
  const email = (
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress
  )?.toLowerCase();
  if (!email) return null;

  const google = clerkUser.externalAccounts.find((a) => a.provider.includes('google'));
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.username ||
    email.split('@')[0];

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: { clerkId },
      $setOnInsert: {
        name,
        avatar: clerkUser.imageUrl,
        ...(google?.providerUserId && { googleId: google.providerUserId }),
      },
    },
    { upsert: true, new: true },
  );
  return toUser(user);
}
