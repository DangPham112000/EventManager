import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { authEnabled, clerkPublishableKey } from '@/lib/auth';

/**
 * ClerkProvider wired to React Router, so Clerk's redirects stay inside the SPA.
 * Renders children as-is when Clerk is not configured.
 */
export function ClerkWithRouter({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  if (!authEnabled) return <>{children}</>;

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey!}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      afterSignOutUrl="/sign-in"
    >
      {children}
    </ClerkProvider>
  );
}
