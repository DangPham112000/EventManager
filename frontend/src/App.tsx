import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ClerkWithRouter } from './components/auth/ClerkWithRouter';
import { RequireAuth } from './components/auth/RequireAuth';
import { Dashboard } from './pages/Dashboard';
import { EventDetail } from './pages/EventDetail';
import { AiAgents } from './pages/AiAgents';
import { SignInPage } from './pages/SignInPage';
import { authEnabled } from './lib/auth';

function App() {
  return (
    <BrowserRouter>
      <ClerkWithRouter>
        <Routes>
          {authEnabled && (
            <>
              <Route path="/sign-in/*" element={<SignInPage mode="sign-in" />} />
              <Route path="/sign-up/*" element={<SignInPage mode="sign-up" />} />
            </>
          )}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/ai-agents" element={<AiAgents />} />
          </Route>
        </Routes>
      </ClerkWithRouter>
    </BrowserRouter>
  );
}

export default App;
