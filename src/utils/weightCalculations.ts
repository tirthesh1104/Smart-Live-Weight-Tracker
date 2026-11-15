import { CoachType, OccupancyStatus } from '../types';

export interface OccupancyResult {
  rawOccupancy: number;          // Unclamped for calculations & analytics
  clampedOccupancy: number;      // 0 - 100%
  status: OccupancyStatus;
  statusLabel: string;
  statusColorClass: string;
  bgColorClass: string;
  textColorClass: string;
  borderColorClass: string;
  isOverloaded: boolean;
  excessWeightKg: number;
  netPassengerPayloadKg: number;
  estimatedPassengerCount: number; // Approximate, clearly flagged
}

/**
 * Core formula:
 * occupancy_percentage = ((current_weight - empty_weight) / (max_capacity - empty_weight)) * 100
 */
export function calculateCoachOccupancy(
  currentWeightKg: number,
  emptyWeightKg: number,
  maxCapacityKg: number,
  coachType?: CoachType
): OccupancyResult {
  // Engines and Pantry cars special handling
  if (coachType === 'Engine') {
    return {
      rawOccupancy: 0,
      clampedOccupancy: 0,
      status: 'available',
      statusLabel: 'Locomotive',
      statusColorClass: 'bg-slate-700 text-white',
      bgColorClass: 'bg-slate-100 dark:bg-slate-800',
      textColorClass: 'text-slate-700 dark:text-slate-300',
      borderColorClass: 'border-slate-500',
      isOverloaded: false,
      excessWeightKg: 0,
      netPassengerPayloadKg: 0,
      estimatedPassengerCount: 0
    };
  }

  const payloadCapacity = Math.max(1, maxCapacityKg - emptyWeightKg);
  const netPayload = Math.max(0, currentWeightKg - emptyWeightKg);
  
  const rawOccupancy = (netPayload / payloadCapacity) * 100;
  const clampedOccupancy = Math.min(100, Math.max(0, Math.round(rawOccupancy * 10) / 10));
  
  const isOverloaded = currentWeightKg > maxCapacityKg;
  const excessWeightKg = isOverloaded ? Math.round(currentWeightKg - maxCapacityKg) : 0;

  // Average weight per passenger with luggage ~ 75-80 kg
  const estimatedPassengerCount = Math.round(netPayload / 78);

  let status: OccupancyStatus = 'available';
  let statusLabel = 'Space Available';
  let statusColorClass = 'bg-emerald-500 text-white';
  let bgColorClass = 'bg-emerald-50 dark:bg-emerald-950/40';
  let textColorClass = 'text-emerald-700 dark:text-emerald-400';
  let borderColorClass = 'border-emerald-500';

  if (isOverloaded) {
    status = 'overloaded';
    statusLabel = 'OVERLOADED';
    statusColorClass = 'bg-rose-900 text-white animate-pulse';
    bgColorClass = 'bg-rose-100 dark:bg-rose-950/80';
    textColorClass = 'text-rose-900 dark:text-rose-300 font-bold';
    borderColorClass = 'border-rose-900 dark:border-rose-600 ring-2 ring-rose-600';
  } else if (rawOccupancy > 75) {
    status = 'full';
    statusLabel = 'Full / Heavy';
    statusColorClass = 'bg-rose-600 text-white';
    bgColorClass = 'bg-rose-50 dark:bg-rose-950/40';
    textColorClass = 'text-rose-700 dark:text-rose-400';
    borderColorClass = 'border-rose-500';
  } else if (rawOccupancy > 40) {
    status = 'moderate';
    statusLabel = 'Moderately Crowded';
    statusColorClass = 'bg-amber-500 text-white';
    bgColorClass = 'bg-amber-50 dark:bg-amber-950/40';
    textColorClass = 'text-amber-700 dark:text-amber-400';
    borderColorClass = 'border-amber-500';
  }

  return {
    rawOccupancy: Math.round(rawOccupancy * 10) / 10,
    clampedOccupancy,
    status,
    statusLabel,
    statusColorClass,
    bgColorClass,
    textColorClass,
    borderColorClass,
    isOverloaded,
    excessWeightKg,
    netPassengerPayloadKg: Math.round(netPayload),
    estimatedPassengerCount
  };
}

export function formatWeight(kg: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(kg)) + ' kg';
}

export function formatWeightTonnes(kg: number): string {
  return (kg / 1000).toFixed(1) + ' T';
}

export function formatOccupancy(percent: number): string {
  return Math.round(percent) + '%';
}

export function formatPassengerEstimate(count: number): string {
  return `~${new Intl.NumberFormat('en-IN').format(count)} (ESTIMATED)`;
}
