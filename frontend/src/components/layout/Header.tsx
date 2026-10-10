import {
  Menu,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserButton } from '@clerk/react';
import { Button } from '@/components/ui/button';
import { authEnabled } from '@/lib/auth';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar, openEventModal, setCalendarView } from '@/store/uiSlice';

/**
 * Top header bar — mobile-first.
 * Contains: hamburger menu, month/year title, view switcher, create button, user menu.
 */
export function Header() {
  const dispatch = useAppDispatch();
  const calendarView = useAppSelector((s) => s.ui.calendarView);
  const selectedDate = useAppSelector((s) => s.ui.selectedDate);

  const displayDate = new Date(selectedDate);
  const monthYear = displayDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  // Short form for narrow phones (e.g. iPhone 11 Pro, 375px wide)
  const monthYearShort = displayDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const viewLabels: Record<string, string> = {
    dayGridMonth: 'Month',
    timeGridWeek: 'Week',
    timeGridDay: 'Day',
    listMonth: 'List',
  };

  const views = ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listMonth'] as const;

  return (
    <header className="flex w-full min-w-0 items-center gap-1 border-b border-border bg-background/80 py-2 pr-[max(0.5rem,env(safe-area-inset-right))] pl-[max(0.25rem,env(safe-area-inset-left))] backdrop-blur-md sm:gap-2 sm:px-4">
      {/* Hamburger — opens sheet sidebar */}
      <Button
        variant="ghost"
        size="icon"
        className="touch-target no-select shrink-0"
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Month/Year display + nav arrows */}
      <div className="flex min-w-0 items-center sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="no-select h-11 w-8 shrink-0 sm:touch-target"
          onClick={() => {
            // Calendar component handles navigation via ref
            const event = new CustomEvent('calendar-nav', { detail: 'prev' });
            window.dispatchEvent(event);
          }}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="min-w-0 truncate text-center text-sm font-semibold sm:min-w-[120px] sm:text-base">
          <span className="sm:hidden">{monthYearShort}</span>
          <span className="hidden sm:inline">{monthYear}</span>
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="no-select h-11 w-8 shrink-0 sm:touch-target"
          onClick={() => {
            const event = new CustomEvent('calendar-nav', { detail: 'next' });
            window.dispatchEvent(event);
          }}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View switcher — compact on mobile */}
      <div className="hidden items-center gap-0.5 rounded-lg bg-secondary p-0.5 sm:flex">
        {views.map((v) => (
          <button
            key={v}
            onClick={() => dispatch(setCalendarView(v))}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors no-select ${
              calendarView === v
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>

      {/* Mobile: compact view switcher (just current + dropdown) */}
      <div className="flex shrink-0 items-center sm:hidden">
        <button
          onClick={() => {
            const currentIndex = views.indexOf(calendarView);
            const nextView = views[(currentIndex + 1) % views.length];
            dispatch(setCalendarView(nextView));
          }}
          className="rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground no-select"
        >
          {viewLabels[calendarView]}
        </button>
      </div>

      {/* Create event button */}
      <Button
        size="icon"
        className="no-select h-9 w-9 shrink-0 rounded-full"
        onClick={() => dispatch(openEventModal())}
        aria-label="Create event"
      >
        <Plus className="h-5 w-5" />
      </Button>

      {authEnabled && (
        <div className="flex shrink-0 items-center">
          <UserButton />
        </div>
      )}
    </header>
  );
}
