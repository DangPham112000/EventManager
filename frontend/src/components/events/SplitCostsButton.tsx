import { Wallet } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { Event } from '@/graphql/types';
import { cn } from '@/lib/utils';

/** Bill Splitter, another app of the ecosystem on the same Clerk sign-in. */
const billSplitterUrl = (
  (import.meta.env.VITE_BILL_SPLITTER_URL as string | undefined) || 'https://bills.dantepham.site'
).replace(/\/$/, '');

/**
 * Opens the event's splitter in Bill Splitter, which creates it on the spot the first time
 * (title, dates and attendees copied from the event; DAN-96). Only attendees see it, since
 * Bill Splitter reads the event with the user's own sign-in.
 */
export function SplitCostsButton({ event, className }: { event: Event; className?: string }) {
  if (!event.isOwner && !event.participation) return null;
  return (
    <a
      href={`${billSplitterUrl}/events/${encodeURIComponent(event.id)}`}
      target="_blank"
      rel="noreferrer"
      className={cn(buttonVariants({ variant: 'outline' }), 'gap-2 touch-target', className)}
    >
      <Wallet className="h-4 w-4" />
      Split costs
    </a>
  );
}
