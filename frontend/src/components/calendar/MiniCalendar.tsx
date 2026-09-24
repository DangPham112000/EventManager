import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedDate } from '@/store/uiSlice';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Compact month grid for the sidebar.
 * Highlights today + selected date with indigo accent.
 */
export function MiniCalendar() {
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector((s) => s.ui.selectedDate);
  const selected = new Date(selectedDate);

  // State for the displayed month (based on selected date)
  const year = selected.getFullYear();
  const month = selected.getMonth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); // 0=Sun

    const cells: (Date | null)[] = [];

    // Leading empty cells
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }

    // Days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(year, month, d));
    }

    return cells;
  }, [year, month]);

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    dispatch(setSelectedDate(prev.toISOString()));
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    dispatch(setSelectedDate(next.toISOString()));
  };

  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isSelected = (date: Date) =>
    date.getDate() === selected.getDate() &&
    date.getMonth() === selected.getMonth() &&
    date.getFullYear() === selected.getFullYear();

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground touch-target"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-foreground">{monthLabel}</span>
        <button
          onClick={handleNextMonth}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground touch-target"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0">
        {weekdays.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0">
        {days.map((date, i) => (
          <div key={i} className="flex items-center justify-center py-0.5">
            {date ? (
              <button
                onClick={() => dispatch(setSelectedDate(date.toISOString()))}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ${
                  isSelected(date) && !isToday(date)
                    ? 'bg-primary/20 text-primary'
                    : isToday(date)
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-foreground hover:bg-accent'
                }`}
              >
                {date.getDate()}
              </button>
            ) : (
              <span className="h-7 w-7" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
