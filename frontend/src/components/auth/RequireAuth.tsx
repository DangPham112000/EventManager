import type { ReactNode } from 'react';
import { RedirectToSignIn, Show } from '@clerk/react';
import { authEnabled } from '@/lib/auth';

/** Shows children to signed-in users and sends everyone else to /sign-in. */
export function RequireAuth({ children }: { children: ReactNode }) {
  if (!authEnabled) return <>{children}</>;

  return (
    <Show when="signed-in" fallback={<RedirectToSignIn />}>
      {children}
    </Show>
  );
}
