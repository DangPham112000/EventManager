import { Calendar, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MiniCalendar } from '../calendar/MiniCalendar';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSidebarOpen, openEventModal } from '@/store/uiSlice';

/**
 * Sheet sidebar — slides from left.
 * Contains: branding, create button, mini calendar, navigation.
 */
export function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isOpen = useAppSelector((s) => s.ui.isSidebarOpen);

  const handleNavigate = (path: string) => {
    navigate(path);
    dispatch(setSidebarOpen(false));
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => dispatch(setSidebarOpen(open))}
    >
      <SheetContent side="left" className="w-[280px] p-0 safe-left sm:max-w-[300px]">
        {/* Header / Branding */}
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            Event Manager
          </SheetTitle>
        </SheetHeader>

        {/* Create Event */}
        <div className="px-4 py-2">
          <Button
            className="w-full justify-start gap-2 rounded-xl"
            onClick={() => {
              dispatch(openEventModal());
              dispatch(setSidebarOpen(false));
            }}
          >
            <span className="text-lg leading-none">+</span>
            Create Event
          </Button>
        </div>

        <Separator className="my-1" />

        {/* Mini Calendar */}
        <div className="px-3 py-2">
          <MiniCalendar />
        </div>

        <Separator className="my-1" />

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 px-2 py-1">
          <button
            onClick={() => handleNavigate('/')}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent no-select touch-target"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            Dashboard
          </button>
        </nav>

        {/* Footer spacer */}
        <div className="flex-1" />
      </SheetContent>
    </Sheet>
  );
}
