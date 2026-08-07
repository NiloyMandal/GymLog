import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { initDB, seedDatabase } from './db';
import { useSettings } from './hooks/useSettings';
import BottomNav from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ExerciseDetail from './pages/ExerciseDetail';
import Routines from './pages/Routines';
import RoutineEditor from './pages/RoutineEditor';
import Progress from './pages/Progress';
import Settings from './pages/Settings';

function App() {
  const { settings } = useSettings();

  useEffect(() => {
    async function setup() {
      await initDB();
      await seedDatabase();
    }
    setup();
  }, []);

  return (
    <ErrorBoundary>
      <div className={`theme-${settings.theme}`}>
        <Router>
          <div className="flex h-[100dvh] flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] antialiased transition-colors duration-300">
            
            {/* Main scrollable content area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-nav">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/workout" element={<LogWorkout />} />
                <Route path="/exercises" element={<ExerciseLibrary />} />
                <Route path="/exercises/:id" element={<ExerciseDetail />} />
                <Route path="/routines" element={<Routines />} />
                <Route path="/routines/new" element={<RoutineEditor />} />
                <Route path="/routines/:id/edit" element={<RoutineEditor />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
            
          </div>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App;
