import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { initDB, seedDatabase } from './db';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ExerciseDetail from './pages/ExerciseDetail';
import Routines from './pages/Routines';
import RoutineEditor from './pages/RoutineEditor';
import Progress from './pages/Progress';
import Settings from './pages/Settings';

export default function App() {
  useEffect(() => {
    async function setup() {
      await initDB();
      await seedDatabase();
    }
    setup();
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-[100dvh] flex-col bg-[var(--color-bg-primary)]">
        <main className="flex-1 overflow-y-auto pb-20">
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
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
