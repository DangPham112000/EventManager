// Clerk publishable key, inlined at build time. Without it (local mock
// development) the app runs with no sign-in.
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

export const authEnabled = Boolean(clerkPublishableKey);
