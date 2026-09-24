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
import { Loader2 } from 'lucide-react';

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

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    startTime: defaultStart(),
    endTime: defaultEnd(),
    location: '',
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
    };

    try {
      if (isEditing) {
        await updateEvent({ variables: { id: editingId, input } });
      } else {
        await createEvent({ variables: { input } });
      }
      dispatch(closeEventModal());
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
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
