import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import type { GetEventData } from '@/graphql/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CREATE_EVENT, UPDATE_EVENT } from '@/graphql/mutations';
import { GET_EVENTS, GET_EVENT } from '@/graphql/queries';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeEventModal } from '@/store/uiSlice';
import { Ban, Loader2, Sparkles } from 'lucide-react';
import type { Participation } from '@/graphql/types';
import { IconGlyph } from './EventIcon';
import { EVENT_ICONS, EVENT_ICON_KEYS, NO_ICON, suggestEventIcon } from '@/lib/eventIcons';
import { cn } from '@/lib/utils';
import { useVisualViewport } from '@/lib/useVisualViewport';

/**
 * Format an ISO string to `YYYY-MM-DDTHH:mm` for datetime-local input.
 */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Default start time: next full hour from now.
 */
function defaultStart(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toDatetimeLocal(d.toISOString());
}

/**
 * Default end time: 1 hour after start.
 */
function defaultEnd(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  return toDatetimeLocal(d.toISOString());
}

interface FormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  participation: Participation;
  /** Icon key, NO_ICON, or null to use the icon suggested from the title. */
  icon: string | null;
}

/**
 * Event create/edit modal.
 * Full-screen style on mobile via max-w override.
 */
export function EventModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.ui.isEventModalOpen);
  const editingId = useAppSelector((s) => s.ui.editingEventId);
  const selectedDate = useAppSelector((s) => s.ui.selectedDate);
  const isEditing = editingId !== null;
  // Follow the visible area so the on-screen keyboard cannot cover the form.
  const viewport = useVisualViewport(isOpen);

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    startTime: defaultStart(),
    endTime: defaultEnd(),
    location: '',
    participation: 'JOINED',
    icon: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Fetch event data when editing
  const { data: eventData } = useQuery<GetEventData>(GET_EVENT, {
    variables: { id: editingId },
    skip: !isEditing,
  });

  // Pre-fill form when editing or when selected date changes (for create)
  useEffect(() => {
    if (isEditing && eventData?.getEvent) {
      const evt = eventData.getEvent;
      setForm({
        title: evt.title,
        description: evt.description || '',
        startTime: toDatetimeLocal(evt.startTime),
        endTime: toDatetimeLocal(evt.endTime),
        location: evt.location || '',
        participation: evt.participation ?? 'JOINED',
        icon: evt.icon ?? null,
      });
    } else if (!isEditing && isOpen) {
      // Use selected date for new events
      const d = new Date(selectedDate);
      d.setHours(new Date().getHours() + 1, 0, 0, 0);
      const start = toDatetimeLocal(d.toISOString());
      d.setHours(d.getHours() + 1);
      const end = toDatetimeLocal(d.toISOString());
      setForm({
        title: '',
        description: '',
        startTime: start,
        endTime: end,
        location: '',
        participation: 'JOINED',
        icon: null,
      });
    }
    setErrors({});
  }, [isEditing, eventData, isOpen, selectedDate]);

  const [createEvent, { loading: creating }] = useMutation(CREATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });

  const [updateEvent, { loading: updating }] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
  });

  const loading = creating || updating;

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.startTime) newErrors.startTime = 'Start time is required';
    if (!form.endTime) newErrors.endTime = 'End time is required';
    if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) {
      newErrors.endTime = 'End time must be after start time';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = async () => {
    if (!validate()) return;

    const input = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      location: form.location.trim() || undefined,
      participation: form.participation,
    };

    try {
      if (isEditing) {
        // null clears a picked icon, going back to the suggestion.
        await updateEvent({ variables: { id: editingId, input: { ...input, icon: form.icon } } });
      } else {
        await createEvent({ variables: { input: { ...input, icon: form.icon ?? undefined } } });
      }
      dispatch(closeEventModal());
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) dispatch(closeEventModal());
      }}
    >
      {/* Cap the dialog at the visible viewport (dvh tracks iOS Safari's
          toolbars) and scroll only the fields, so the header and the save
          button stay reachable on short phone screens. */}
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md"
        style={
          viewport
            ? {
                top: viewport.offsetTop + viewport.height / 2,
                maxHeight: viewport.height - 32,
              }
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>

        <div className="-mx-4 flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              placeholder="Event title"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={errors.title ? 'border-destructive' : ''}
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Icon */}
          <IconPicker
            value={form.icon}
            suggested={suggestEventIcon(form)}
            onChange={(icon) => updateField('icon', icon)}
          />

          {/* Participation */}
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Event type">
              {(
                [
                  ['JOINED', 'Joined'],
                  ['INTERESTED', 'Just interested'],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={form.participation === value}
                  variant={form.participation === value ? 'default' : 'outline'}
                  onClick={() => updateField('participation', value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {form.participation === 'INTERESTED' && (
              <p className="text-xs text-muted-foreground">
                Interested events are not counted when checking for schedule conflicts.
              </p>
            )}
          </div>

          {/* Start Time */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-start">Start</Label>
            <Input
              id="event-start"
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => updateField('startTime', e.target.value)}
              className={errors.startTime ? 'border-destructive' : ''}
            />
            {errors.startTime && (
              <p className="text-xs text-destructive">{errors.startTime}</p>
            )}
          </div>

          {/* End Time */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-end">End</Label>
            <Input
              id="event-end"
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => updateField('endTime', e.target.value)}
              className={errors.endTime ? 'border-destructive' : ''}
            />
            {errors.endTime && (
              <p className="text-xs text-destructive">{errors.endTime}</p>
            )}
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              placeholder="Add location (optional)"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              placeholder="Add description (optional)"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface IconPickerProps {
  value: string | null;
  suggested: ReturnType<typeof suggestEventIcon>;
  onChange: (icon: string | null) => void;
}

/** Choose the icon shown before the title: suggested from the title (Auto), a specific one, or none. */
function IconPicker({ value, suggested, onChange }: IconPickerProps) {
  const option = (key: string | null, label: string, content: React.ReactNode) => {
    const selected = value === key;
    return (
      <button
        key={key ?? 'auto'}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={label}
        title={label}
        onClick={() => onChange(key)}
        className={cn(
          'flex h-9 items-center justify-center gap-1 rounded-md border text-xs transition-colors',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border text-foreground hover:bg-accent',
        )}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Icon</Label>
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5"
        role="radiogroup"
        aria-label="Event icon"
      >
        {option(
          null,
          suggested ? `Auto (${EVENT_ICONS[suggested].label})` : 'Auto (no icon suggested)',
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {suggested && <IconGlyph icon={suggested} className="h-4 w-4" />}
          </>,
        )}
        {option(NO_ICON, 'No icon', <Ban className="h-4 w-4" />)}
        {EVENT_ICON_KEYS.map((key) => option(key, EVENT_ICONS[key].label, <IconGlyph icon={key} className="h-5 w-5" />))}
      </div>
      <p className="text-xs text-muted-foreground">
        {value === null
          ? suggested
            ? `Auto: ${EVENT_ICONS[suggested].label}, guessed from the title.`
            : 'Auto: no icon fits the title yet.'
          : value === NO_ICON
            ? 'No icon.'
            : EVENT_ICONS[value as keyof typeof EVENT_ICONS]?.label}
      </p>
    </div>
  );
}
