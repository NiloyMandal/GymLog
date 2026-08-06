import { X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { inputToKg, displayWeight } from '../utils/units';

const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const LB_PLATES = [45, 35, 25, 10, 5, 2.5];

export default function PlateCalculator({ weight, onClose }) {
  const { settings } = useSettings();
  const unit = settings.unit;
  
  // weight passed is the display weight (e.g., 135 lb or 60 kg)
  // barWeight is also in display unit (e.g. 45 lb or 20 kg)
  const barWeight = settings.barWeight || (unit === 'kg' ? 20 : 45);
  
  const target = parseFloat(weight);
  
  let platesNeeded = [];
  let remaining = 0;
  let exact = false;

  if (!isNaN(target) && target >= barWeight) {
    const plates = unit === 'kg' ? KG_PLATES : LB_PLATES;
    remaining = (target - barWeight) / 2;
    
    for (const plate of plates) {
      while (remaining >= plate) {
        platesNeeded.push(plate);
        remaining -= plate;
      }
    }
    // Handle floating point math errors
    if (remaining < 0.01) {
      exact = true;
      remaining = 0;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-[var(--color-bg-secondary)] shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-lg font-bold">Plate Calculator</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-[var(--color-bg-elevated)] p-2 text-[var(--color-text-muted)] transition-colors hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6 flex justify-between text-sm">
            <div>
              <p className="text-[var(--color-text-muted)]">Target Weight</p>
              <p className="text-xl font-black">{isNaN(target) ? '--' : target} <span className="text-sm font-medium">{unit}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[var(--color-text-muted)]">Bar Weight</p>
              <p className="text-xl font-bold">{barWeight} <span className="text-sm font-medium">{unit}</span></p>
            </div>
          </div>

          {isNaN(target) || target < barWeight ? (
            <div className="rounded-xl bg-[var(--color-bg-elevated)] p-6 text-center text-[var(--color-text-muted)]">
              Target weight must be greater than or equal to the bar weight ({barWeight} {unit}).
            </div>
          ) : (
             <>
              <div className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Plates per side</p>
                {platesNeeded.length === 0 ? (
                  <p className="text-sm font-bold text-[var(--color-accent)]">Just the bar!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {platesNeeded.map((p, i) => (
                      <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] font-black shadow-sm ring-1 ring-[var(--color-border)]">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {!exact && (
                <p className="mt-4 text-xs text-[var(--color-warning)]">
                  Note: Cannot load exact weight with standard plates. Off by {(remaining * 2).toFixed(1)}{unit}.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
