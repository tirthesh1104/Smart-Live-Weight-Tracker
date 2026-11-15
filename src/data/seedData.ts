import { Train, UserProfile, SystemNotification, IncidentReport, Coach } from '../types';
import { calculateCoachOccupancy } from '../utils/weightCalculations';

// Operational dataset starts completely clean per Phase 3 specifications.
// No preloaded demonstration trains, sample profiles, fake alerts, or fake statistics.
export const INITIAL_PROFILES: UserProfile[] = [];
export const INITIAL_TRAINS: Train[] = [];
export const INITIAL_NOTIFICATIONS: SystemNotification[] = [];
export const INITIAL_INCIDENTS: IncidentReport[] = [];

/**
 * Creates an empty or custom coach structure for manual simulation scenarios.
 * Marked strictly as 'SIMULATED DATA'.
 */
export function createSimulatedCoach(
  trainId: string,
  id: string,
  coachNo: string,
  coachType: any,
  emptyKg: number,
  maxKg: number,
  currKg: number
): Coach {
  const occ = calculateCoachOccupancy(currKg, emptyKg, maxKg, coachType);
  return {
    id,
    train_id: trainId,
    coach_no: coachNo,
    coach_type: coachType,
    empty_weight_kg: emptyKg,
    max_capacity_kg: maxKg,
    current_weight_kg: currKg,
    occupancy_percentage: occ.clampedOccupancy,
    status: occ.status,
    last_updated: new Date().toISOString(),
    data_source: 'SIMULATED DATA'
  };
}

/**
 * Helper to build a standard 10-coach simulation scenario when explicitly triggered
 * by the authorized user in the /simulator module.
 */
export function createDefaultSimulationScenario(trainNumber = 'SIM-101', trainName = 'Simulation Test Rake'): Train {
  const trainId = 'sim-train-' + Date.now();
  return {
    id: trainId,
    number: trainNumber,
    name: trainName,
    from_station: 'Station Alpha',
    to_station: 'Station Omega',
    created_at: new Date().toISOString(),
    data_source: 'SIMULATED DATA',
    coaches: [
      createSimulatedCoach(trainId, 'sc-01', 'LOCO', 'Engine', 123000, 123000, 123000),
      createSimulatedCoach(trainId, 'sc-02', 'GEN-1', 'General', 38000, 48500, 41000),
      createSimulatedCoach(trainId, 'sc-03', 'S1', 'Sleeper', 39500, 47000, 42000),
      createSimulatedCoach(trainId, 'sc-04', 'S2', 'Sleeper', 39500, 47000, 43500),
      createSimulatedCoach(trainId, 'sc-05', 'B1', 'AC 3 Tier', 44000, 50500, 46500),
      createSimulatedCoach(trainId, 'sc-06', 'B2', 'AC 3 Tier', 44000, 50500, 47000),
      createSimulatedCoach(trainId, 'sc-07', 'A1', 'AC 2 Tier', 45000, 50000, 46000),
      createSimulatedCoach(trainId, 'sc-08', 'S3', 'Sleeper', 39500, 47000, 41500),
      createSimulatedCoach(trainId, 'sc-09', 'S4', 'Sleeper', 39500, 47000, 42200),
      createSimulatedCoach(trainId, 'sc-10', 'GEN-2', 'General', 38000, 48500, 40500)
    ]
  };
}
