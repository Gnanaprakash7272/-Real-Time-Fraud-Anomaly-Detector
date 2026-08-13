// ============================================================
// CURRENCY UTILITY — USD → INR DISPLAY
// ============================================================
//
// ML models and backend store amounts as USD-equivalent
// numeric values (PaySim training data).
//
// For the India-based demo, we display all amounts in ₹.
// Backend values are NEVER modified — display-only conversion.
//
// Fixed rate: ₹84.00 per USD
// (avoids amount flickering between dashboard refreshes)
// ============================================================

export const USD_TO_INR_RATE = 84.00;

/**
 * Converts a USD-equivalent amount to ₹ display string.
 *
 * Uses Indian number formatting (lakhs/crores):
 *   84000    → ₹70,56,000.00
 *   1250.50  → ₹1,05,042.00
 *
 * @param {number} usdAmount - Raw amount from backend
 * @param {object} options
 * @param {boolean} options.compact - Show compact form (e.g. ₹70.6L)
 * @returns {string} Formatted INR string
 */
export function formatINR(usdAmount, { compact = false } = {}) {
  const amount = Number(usdAmount) || 0;
  const inr = amount * USD_TO_INR_RATE;

  if (compact) {
    if (inr >= 1_00_00_000) {
      return `₹${(inr / 1_00_00_000).toFixed(2)}Cr`;
    }
    if (inr >= 1_00_000) {
      return `₹${(inr / 1_00_000).toFixed(2)}L`;
    }
    if (inr >= 1_000) {
      return `₹${(inr / 1_000).toFixed(1)}K`;
    }
  }

  return (
    '₹' +
    inr.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}
