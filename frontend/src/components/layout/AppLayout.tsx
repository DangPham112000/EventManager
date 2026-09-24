import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { EventModal } from '../events/EventModal';
import { EventDetailPanel } from '../events/EventDetailPanel';

/**
 * Main app shell. Mobile-first layout:
 * - Header at top (with safe-area-inset-top)
 * - Content fills remaining height
 * - Sheet sidebar (triggered from header)
 * - Event modals rendered here so they're accessible from all routes
 */
export function AppLayout() {
  return (
    <div className="flex h-dvh flex-col bg-background safe-top">
      <Header />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <Sidebar />
      <EventModal />
      <EventDetailPanel />
    </div>
  );
}
