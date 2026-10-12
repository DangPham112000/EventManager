import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { Check, Copy, ExternalLink, Eye, EyeOff, Loader2, RefreshCw, Share2 } from 'lucide-react';
import type { CalendarShareData, CalendarShareMode } from '@/graphql/types';
import { GET_CALENDAR_SHARE } from '@/graphql/queries';
import { REGENERATE_CALENDAR_SHARE_TOKEN, UPDATE_CALENDAR_SHARE } from '@/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const MODES: { value: CalendarShareMode; label: string; description: string; icon: typeof Eye }[] = [
  {
    value: 'PRIVATE',
    label: 'Private',
    description: 'Every event shows as "Busy". Titles, places, notes and icons stay hidden.',
    icon: EyeOff,
  },
  {
    value: 'PUBLIC',
    label: 'Public',
    description: 'Everyone with the link sees all event details.',
    icon: Eye,
  },
];

/**
 * /sharing: turn on a read-only link to the user's calendar, pick what it
 * shows, and replace the link to cut off everyone who has the old one.
 */
export function CalendarSharing() {
  const [copied, setCopied] = useState(false);
  const { data, loading } = useQuery<CalendarShareData>(GET_CALENDAR_SHARE);
  // The mutations return the whole CalendarShare, which Apollo writes back to the cached query.
  const [updateShare, { loading: updating }] = useMutation(UPDATE_CALENDAR_SHARE, {
    update: (cache, { data: result }) => {
      const share = (result as { updateCalendarShare?: CalendarShareData['calendarShare'] })?.updateCalendarShare;
      if (share) cache.writeQuery({ query: GET_CALENDAR_SHARE, data: { calendarShare: share } });
    },
  });
  const [regenerate, { loading: regenerating }] = useMutation(REGENERATE_CALENDAR_SHARE_TOKEN, {
    update: (cache, { data: result }) => {
      const share = (result as { regenerateCalendarShareToken?: CalendarShareData['calendarShare'] })
        ?.regenerateCalendarShareToken;
      if (share) cache.writeQuery({ query: GET_CALENDAR_SHARE, data: { calendarShare: share } });
    },
  });

  const share = data?.calendarShare;
  const link = share?.token ? `${window.location.origin}/share/${share.token}` : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Share2 className="h-5 w-5" /> Share calendar
          </h2>
          <p className="text-sm text-muted-foreground">
            Give people a link to see your calendar. They do not need an account and cannot change
            anything.
          </p>
        </div>

        {loading || !share ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">Share my calendar</span>
                <span className="block text-xs text-muted-foreground">
                  {share.enabled ? 'Anyone with the link can view it.' : 'The link is turned off.'}
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="peer sr-only"
                checked={share.enabled}
                disabled={updating}
                onChange={(e) => updateShare({ variables: { enabled: e.target.checked } })}
              />
              <span
                aria-hidden
                className="relative h-6 w-11 shrink-0 rounded-full bg-input transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-background after:shadow after:transition-transform peer-checked:after:translate-x-5"
              />
            </label>

            <div className="space-y-2" role="radiogroup" aria-label="What the link shows">
              <Label>What people see</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {MODES.map(({ value, label, description, icon: Icon }) => {
                  const selected = share.mode === value;
                  return (
                    <button
                      key={value}
                      role="radio"
                      aria-checked={selected}
                      disabled={updating}
                      onClick={() => !selected && updateShare({ variables: { mode: value } })}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors no-select ${
                        selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                      }`}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{label}</span>
                        <span className="block text-xs text-muted-foreground">{description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {share.enabled && link && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Link</Label>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-secondary px-3 py-2 text-xs">
                      {link}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyLink} aria-label="Copy link">
                      {copied ? <Check /> : <Copy />}
                      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(link, '_blank', 'noopener')}
                    >
                      <ExternalLink /> Open
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={regenerating}
                      onClick={() => {
                        if (confirm('Make a new link? The current link will stop working for everyone who has it.')) {
                          regenerate();
                        }
                      }}
                    >
                      {regenerating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                      New link
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
