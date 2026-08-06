// ─── Unit conversion utilities ──────────────────────
// All weights are stored internally in kg.
// These helpers convert for display and input.

const KG_TO_LB = 2.20462;

/**
 * Convert a stored kg value to the user's display unit.
 */
export function displayWeight(kgValue, unit) {
  if (unit === 'lb') {
    return Math.round(kgValue * KG_TO_LB * 10) / 10;
  }
  return kgValue;
}

/**
 * Convert a user-entered value (in their display unit) back to kg for storage.
 */
export function inputToKg(displayValue, unit) {
  if (unit === 'lb') {
    return Math.round((displayValue / KG_TO_LB) * 100) / 100;
  }
  return displayValue;
}

/**
 * Format a weight value for display with appropriate precision.
 */
export function formatWeight(kgValue, unit) {
  const val = displayWeight(kgValue, unit);
  // Show 1 decimal for lb, 1 decimal for kg if fractional
  if (unit === 'lb') {
    return Number.isInteger(val) ? val.toString() : val.toFixed(1);
  }
  return Number.isInteger(val) ? val.toString() : val.toFixed(1);
}

/**
 * Get the appropriate weight step for the user's unit.
 * kg: 2.5 kg steps, lb: 5 lb steps (both are standard plate increments).
 * Returns the step in kg (for internal storage).
 */
export function weightStepKg(unit) {
  if (unit === 'lb') {
    return 5 / KG_TO_LB; // ~2.268 kg
  }
  return 2.5;
}

/**
 * Get the display step for the user's unit.
 */
export function weightStepDisplay(unit) {
  return unit === 'lb' ? 5 : 2.5;
}
