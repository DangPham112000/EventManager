import { SignIn, SignUp } from '@clerk/react';

/** Full-screen Clerk sign-in / sign-up, centred on the app background. */
export function SignInPage({ mode = 'sign-in' }: { mode?: 'sign-in' | 'sign-up' }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 safe-top">
      {mode === 'sign-in' ? (
        <SignIn routing="path" path="/sign-in" />
      ) : (
        <SignUp routing="path" path="/sign-up" />
      )}
    </div>
  );
}
