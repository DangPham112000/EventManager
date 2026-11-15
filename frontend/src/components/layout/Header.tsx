import {
  Menu,
  Plus,
  ChevronLeft,
  ChevronRight,
  ListFilter,
} from 'lucide-react';
import { UserButton } from '@clerk/react';
import { Button } from '@/components/ui/button';
import { authEnabled } from '@/lib/auth';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  toggleSidebar,
  openEventModal,
  setCalendarView,
  setParticipationFilter,
  type ParticipationFilter,
} from '@/store/uiSlice';
import { getHeaderTitle } from '@/lib/headerTitle';

const FILTERS: [ParticipationFilter, string][] = [
  ['ALL', 'All'],
  ['JOINED', 'Joined'],
  ['INTERESTED', 'Interested'],
];

/**
 * Top header bar — mobile-first.
 * Contains: hamburger menu, date range title, participation filter, view switcher,
 * create button, user menu.
 */
export function Header() {
  const dispatch = useAppDispatch();
  const calendarView = useAppSelector((s) => s.ui.calendarView);
  const selectedDate = useAppSelector((s) => s.ui.selectedDate);
  const visibleRange = useAppSelector((s) => s.ui.visibleRange);
  const filter = useAppSelector((s) => s.ui.participationFilter);
  const filterLabel = FILTERS.find(([value]) => value === filter)?.[1] ?? 'All';

  const title = getHeaderTitle(calendarView, visibleRange, selectedDate);

  const viewLabels: Record<string, string> = {
    dayGridMonth: 'Month',
    timeGridWeek: 'Week',
    timeGridDay: 'Day',
    listUpcoming: 'List',
  };

  // The upcoming list is not tied to a date range, so it has no prev/next
  const isUpcomingList = calendarView === 'listUpcoming';

  const views = ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listUpcoming'] as const;

  return (
    <header className="glass-strong flex w-full min-w-0 items-center gap-1 rounded-none border-x-0 border-t-0 py-2 pr-[max(0.5rem,env(safe-area-inset-right))] pl-[max(0.25rem,env(safe-area-inset-left))] sm:gap-2 sm:px-4">
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
        {!isUpcomingList && (
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
        )}
        <h1 className="min-w-0 truncate text-center text-sm font-semibold sm:min-w-[120px] sm:text-base">
          {isUpcomingList ? (
            'Upcoming'
          ) : (
            <>
              <span className="sm:hidden">{title.short}</span>
              <span className="hidden sm:inline lg:hidden">{title.medium}</span>
              <span className="hidden lg:inline">{title.long}</span>
            </>
          )}
        </h1>
        {!isUpcomingList && (
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
        )}
      </div>

      {/* Participation filter — next to the title, applies to every view */}
      <div
        className="glass ml-1 hidden items-center gap-0.5 rounded-full p-1 sm:flex"
        role="radiogroup"
        aria-label="Filter events"
      >
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            role="radio"
            aria-checked={filter === value}
            onClick={() => dispatch(setParticipationFilter(value))}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors no-select ${
              filter === value
                ? 'glass-thumb text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mobile: compact filter that cycles All → Joined → Interested */}
      <button
        onClick={() => {
          const currentIndex = FILTERS.findIndex(([value]) => value === filter);
          dispatch(setParticipationFilter(FILTERS[(currentIndex + 1) % FILTERS.length][0]));
        }}
        className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium no-select sm:hidden ${
          filter === 'ALL'
            ? 'glass text-secondary-foreground'
            : 'glass-primary text-primary-foreground'
        }`}
        aria-label={`Filter events: ${filterLabel}`}
      >
        <ListFilter className="h-3.5 w-3.5" />
        {filterLabel}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View switcher — compact on mobile */}
      <div className="glass hidden items-center gap-0.5 rounded-full p-1 sm:flex">
        {views.map((v) => (
          <button
            key={v}
            onClick={() => dispatch(setCalendarView(v))}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors no-select ${
              calendarView === v
                ? 'glass-thumb text-foreground'
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
          className="glass rounded-full px-3 py-1.5 text-xs font-medium text-secondary-foreground no-select"
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
