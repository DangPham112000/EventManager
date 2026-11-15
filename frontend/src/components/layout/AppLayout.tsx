import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { EventModal } from '../events/EventModal';
import { EventDetailPanel } from '../events/EventDetailPanel';

/**
 * Main app shell. Mobile-first layout:
 * - Header at top (with safe-area-inset-top)
 * - Content fills remaining height, on the "liquid glass" backdrop (see index.css)
 * - Sheet sidebar (triggered from header)
 * - Event modals rendered here so they're accessible from all routes
 */
export function AppLayout() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden safe-top">
      <Header />
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden pt-1.5 pr-[max(0.375rem,env(safe-area-inset-right))] pb-[max(0.375rem,env(safe-area-inset-bottom))] pl-[max(0.375rem,env(safe-area-inset-left))] sm:p-3">
        <Outlet />
      </main>
      <Sidebar />
      <EventModal />
      <EventDetailPanel />
    </div>
  );
}
