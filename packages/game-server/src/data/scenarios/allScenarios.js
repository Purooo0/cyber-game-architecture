/**
 * Central registry untuk semua scenarios/missions
 * Setiap scenario yang baru cukup ditambah di array ini
 */

import { scenario1 } from "./scenario1.js";
import { scenario2 } from "./scenario2.js";
import { scenario3 } from "./scenario3.js";

/**
 * Array semua available scenarios
 * Tambahkan scenario baru langsung di sini
 */
export const ALL_SCENARIOS = [
  scenario1,
  scenario2,
  scenario3,
  // TODO: scenario4 ketika siap
  // scenario4,
];

/**
 * Create a map untuk quick lookup by ID
 */
export const SCENARIOS_MAP = ALL_SCENARIOS.reduce((map, scenario) => {
  map[scenario.id] = scenario;
  return map;
}, {});

/**
 * Get total scenario count
 */
export const TOTAL_SCENARIOS = ALL_SCENARIOS.length;
