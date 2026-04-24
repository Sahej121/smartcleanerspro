/**
 * Production Stage Thresholds (in minutes)
 * Used to identify bottlenecks in the garment assembly workflow.
 */
export const STAGE_THRESHOLDS = {
  received: 120,      // 2 hours to start sorting
  sorting: 60,       // 1 hour to move to cleaning
  washing: 180,      // 3 hours for washing cycle + queue
  dry_cleaning: 240, // 4 hours for dry cleaning cycle
  drying: 120,       // 2 hours for drying
  ironing: 180,      // 3 hours for ironing queue
  quality_check: 60, // 1 hour for final inspection
  ready: null,       // No bottleneck for ready items
  delivered: null    // No bottleneck for delivered items
};

/**
 * Check if a stage duration is considered a bottleneck.
 * @param {string} stage - The current stage of the garment.
 * @param {number} durationMinutes - How long the garment has been in this stage.
 * @returns {boolean}
 */
export function isOverdue(stage, durationMinutes) {
  const threshold = STAGE_THRESHOLDS[stage];
  if (threshold === null || threshold === undefined) return false;
  return durationMinutes > threshold;
}
