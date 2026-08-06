import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, Library, TrendingUp } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/exercises', icon: Library, label: 'Exercises' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[var(--spacing-safe-bottom)]">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-3 text-[11px] font-medium transition-colors duration-150 ${
                isActive
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`
            }
          >
            <Icon size={22} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
