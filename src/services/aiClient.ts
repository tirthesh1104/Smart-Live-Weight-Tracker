import { Coach, PredictionHorizon } from '../types';

const AI_API_BASE = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

export interface CoachRecommendationResult {
  recommendedCoachId: string;
  recommendedCoachNo: string;
  coachType: string;
  occupancyPercentage: number;
  reason: string;
  source: 'fastapi' | 'statistical_fallback';
}

export interface PredictionResult {
  coachId: string;
  coachNo: string;
  currentOccupancy: number;
  velocityKgPerMin?: number;
  predictions: PredictionHorizon[];
  modelUsed: string;
  limitations: string;
  source: 'fastapi' | 'statistical_fallback';
}

export interface DeltaSyncResult {
  coachId: string;
  syncRequired: boolean;
  action: string;
  deltaKg: number;
  absDeltaKg: number;
  deltaPercent: number;
  bandwidthSavedPercent: number;
  compressionRatio: string;
  message: string;
}

export interface SensorFusionResult {
  coachId: string;
  coachNo: string;
  fusedWeightKg: number;
  fusedOccupancyPercentage: number;
  primarySensor: string;
  confidenceScore: number;
  sensorBreakdown: Record<string, any>;
  anomalyDetected: boolean;
  fusionMethod: string;
  healthStatus: string;
  recommendation: string;
  source: 'fastapi' | 'client_fusion';
}

export interface CoachBalancingAdvisory {
  coach_no: string;
  coach_type: string;
  current_occupancy: number;
  status: string;
  suggested_action: string;
  target_migration_coach?: string | null;
  passengers_to_divert: number;
  display_board_message: string;
}

export interface CrowdBalancingResult {
  trainId: string;
  trainNumber: string;
  platformNo: number;
  overallTrainOccupancy: number;
  imbalanceIndex: number;
  advisories: CoachBalancingAdvisory[];
  audioChimeAnnouncement: string;
  ledDisplayTicker: string;
  source: 'fastapi' | 'client_balancer';
}

export class AIClientService {
  /**
   * Predicts crowd density for 15, 30, and 60 minutes using Holt-Winters ML Engine.
   */
  static async getCrowdPrediction(
    coach: Coach,
    isRushHour: boolean = false,
    historicalWeights?: number[]
  ): Promise<PredictionResult> {
    const history = historicalWeights && historicalWeights.length > 0
      ? historicalWeights
      : [
          coach.current_weight_kg - 250,
          coach.current_weight_kg - 100,
          coach.current_weight_kg
        ];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for backend

      const res = await fetch(`${AI_API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: coach.id,
          coach_no: coach.coach_no,
          coach_type: coach.coach_type,
          empty_weight_kg: coach.empty_weight_kg,
          max_capacity_kg: coach.max_capacity_kg,
          current_weight_kg: coach.current_weight_kg,
          historical_weights: history,
          is_rush_hour: isRushHour,
          alpha: 0.35,
          beta: 0.15
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          coachId: data.coach_id,
          coachNo: data.coach_no,
          currentOccupancy: data.current_occupancy,
          velocityKgPerMin: data.velocity_kg_per_min,
          predictions: data.predictions.map((p: any) => ({
            horizon_minutes: p.horizon_minutes,
            predicted_occupancy: p.predicted_occupancy,
            predicted_weight_kg: p.predicted_weight_kg,
            lower_bound_kg: p.lower_bound_kg,
            upper_bound_kg: p.upper_bound_kg,
            confidence_score: p.confidence_score,
            status: p.status,
            explanation: p.explanation
          })),
          modelUsed: data.model_used,
          limitations: data.limitations,
          source: 'fastapi'
        };
      }
    } catch {
      // Graceful fallback to client Holt-Winters simulation
    }

    return this.calculateLocalPrediction(coach, isRushHour, history);
  }

  /**
   * Local Holt-Winters Statistical Fallback for crowd prediction
   */
  static calculateLocalPrediction(coach: Coach, isRushHour: boolean, history?: number[]): PredictionResult {
    const empty = coach.empty_weight_kg;
    const maxCap = coach.max_capacity_kg;
    const curr = coach.current_weight_kg;
    const payloadCap = Math.max(1, maxCap - empty);
    const currOcc = Math.max(0, ((curr - empty) / payloadCap) * 100);

    const horizons: (15 | 30 | 60)[] = [15, 30, 60];
    const rushFactor = isRushHour ? 1.35 : 1.0;
    
    // Estimate baseline trend from history
    let trendPer15Min = 180;
    if (history && history.length >= 2) {
      const delta = history[history.length - 1] - history[0];
      trendPer15Min = (delta / Math.max(1, history.length - 1)) * 3;
    }
    const typeMultiplier = coach.coach_type === 'General' ? 1.5 : coach.coach_type === 'Second Sitting' ? 1.25 : 1.0;
    const velocityKgPerMin = Math.round((trendPer15Min / 15) * 10) / 10;

    const predictions: PredictionHorizon[] = horizons.map((h) => {
      const step = h / 15;
      const surgeKg = trendPer15Min * step * rushFactor * typeMultiplier;
      const projectedWt = Math.min(maxCap * 1.15, Math.max(empty * 0.98, curr + surgeKg));
      const projectedOcc = Math.round((((projectedWt - empty) / payloadCap) * 100) * 10) / 10;

      const varianceKg = 250 * Math.sqrt(step);
      const lowerBound = Math.round(Math.max(empty * 0.95, projectedWt - (1.96 * varianceKg)));
      const upperBound = Math.round(projectedWt + (1.96 * varianceKg));
      
      let status = 'Space Available';
      let explanation = `Occupancy projected to hover around ${projectedOcc}%.`;
      if (projectedOcc > 100) {
        status = 'Overloaded Warning';
        explanation = `Projected to breach structural capacity by +${Math.round(projectedOcc - 100)}% based on platform influx patterns.`;
      } else if (projectedOcc >= 76) {
        status = 'Crowded / Full';
        explanation = `Boarding surge indicates heavy density reaching ${projectedOcc}%.`;
      } else if (projectedOcc >= 41) {
        status = 'Moderately Crowded';
        explanation = `Occupancy projected to remain manageable around ${projectedOcc}%.`;
      }

      return {
        horizon_minutes: h,
        predicted_occupancy: projectedOcc,
        predicted_weight_kg: Math.round(projectedWt),
        lower_bound_kg: lowerBound,
        upper_bound_kg: upperBound,
        confidence_score: h === 15 ? 0.92 : h === 30 ? 0.84 : 0.73,
        status,
        explanation
      };
    });

    return {
      coachId: coach.id,
      coachNo: coach.coach_no,
      currentOccupancy: Math.round(currOcc * 10) / 10,
      velocityKgPerMin,
      predictions,
      modelUsed: 'Client Statistical Time-Series Dampener (Offline Fallback)',
      limitations: 'Calculated locally from current bogie strain gauge reading and historical rate-of-change curve.',
      source: 'statistical_fallback'
    };
  }

  /**
   * Edge Delta-Compression Sync evaluation:
   * Throttles network updates if change is under threshold (15kg or 2%).
   */
  static async evaluateDeltaSync(
    coachId: string,
    currentWeightKg: number,
    previousWeightKg: number,
    payloadCapKg: number = 15000,
    thresholdKg: number = 15.0
  ): Promise<DeltaSyncResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${AI_API_BASE}/delta-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: coachId,
          current_weight_kg: currentWeightKg,
          previous_weight_kg: previousWeightKg,
          payload_capacity_kg: payloadCapKg,
          threshold_kg: thresholdKg
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          coachId: data.coach_id,
          syncRequired: data.sync_required,
          action: data.action,
          deltaKg: data.delta_kg,
          absDeltaKg: data.abs_delta_kg,
          deltaPercent: data.delta_percent,
          bandwidthSavedPercent: data.bandwidth_saved_percent,
          compressionRatio: data.compression_ratio,
          message: data.message
        };
      }
    } catch {
      // Local evaluation
    }

    const delta = currentWeightKg - previousWeightKg;
    const absDelta = Math.abs(delta);
    const deltaPercent = Math.round(((absDelta / Math.max(1, payloadCapKg)) * 100) * 100) / 100;
    const syncRequired = absDelta >= thresholdKg || deltaPercent >= 2.0;

    return {
      coachId,
      syncRequired,
      action: syncRequired ? 'SYNC_DISPATCH' : 'EDGE_SUPPRESSED',
      deltaKg: Math.round(delta * 10) / 10,
      absDeltaKg: Math.round(absDelta * 10) / 10,
      deltaPercent,
      bandwidthSavedPercent: syncRequired ? 0 : 100,
      compressionRatio: syncRequired ? '1:1' : '100% Compressed',
      message: syncRequired
        ? `Telemetry sync dispatched: delta ${absDelta} kg exceeds threshold.`
        : `Edge suppressed: delta ${absDelta} kg within 15kg noise band.`
    };
  }

  /**
   * Multi-Source Sensor Fusion:
   * Fuses Bogie strain, IR door counters, and CCTV head counts.
   */
  static async fuseSensors(
    coach: Coach,
    bogieStrainKg: number,
    irCount?: number,
    cctvCount?: number,
    bogieStatus: 'healthy' | 'degraded' | 'offline' = 'healthy'
  ): Promise<SensorFusionResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const res = await fetch(`${AI_API_BASE}/sensor-fusion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: coach.id,
          coach_no: coach.coach_no,
          coach_type: coach.coach_type,
          empty_weight_kg: coach.empty_weight_kg,
          max_capacity_kg: coach.max_capacity_kg,
          bogie_strain_kg: bogieStrainKg,
          ir_door_count: irCount,
          cctv_head_count: cctvCount,
          bogie_sensor_status: bogieStatus
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const d = await res.json();
        return {
          coachId: d.coach_id,
          coachNo: d.coach_no,
          fusedWeightKg: d.fused_weight_kg,
          fusedOccupancyPercentage: d.fused_occupancy_percentage,
          primarySensor: d.primary_sensor,
          confidenceScore: d.confidence_score,
          sensorBreakdown: d.sensor_breakdown,
          anomalyDetected: d.anomaly_detected,
          fusionMethod: d.fusion_method,
          healthStatus: d.health_status,
          recommendation: d.recommendation,
          source: 'fastapi'
        };
      }
    } catch {
      // Local fusion fallback
    }

    const paxKg = 68;
    const empty = coach.empty_weight_kg;
    const maxCap = coach.max_capacity_kg;
    const payloadCap = Math.max(1, maxCap - empty);

    let wBogie = bogieStatus === 'healthy' ? 0.65 : bogieStatus === 'degraded' ? 0.25 : 0.0;
    let wIr = irCount !== undefined ? (bogieStatus === 'offline' ? 0.55 : 0.20) : 0;
    let wCctv = cctvCount !== undefined ? (bogieStatus === 'offline' ? 0.45 : 0.15) : 0;
    const totalW = Math.max(0.1, wBogie + wIr + wCctv);

    const irWt = irCount !== undefined ? empty + (irCount * paxKg) : bogieStrainKg;
    const cctvWt = cctvCount !== undefined ? empty + (cctvCount * paxKg) : bogieStrainKg;

    const fusedWt = ((bogieStrainKg * wBogie) + (irWt * wIr) + (cctvWt * wCctv)) / totalW;
    const fusedOcc = Math.round((((fusedWt - empty) / payloadCap) * 100) * 10) / 10;

    const isAnomaly = irCount !== undefined && cctvCount !== undefined && (bogieStrainKg - empty) > ((irCount * paxKg) + 2500);

    return {
      coachId: coach.id,
      coachNo: coach.coach_no,
      fusedWeightKg: Math.round(fusedWt),
      fusedOccupancyPercentage: fusedOcc,
      primarySensor: bogieStatus === 'healthy' ? 'Bogie Dual-Axis Strain Gauge (Primary)' : 'Optical Multi-Spectral Redundancy',
      confidenceScore: isAnomaly ? 0.75 : 0.94,
      sensorBreakdown: {
        bogie_strain: { raw_weight_kg: bogieStrainKg, status: bogieStatus },
        ir_door_count: irCount,
        cctv_vision: cctvCount
      },
      anomalyDetected: isAnomaly,
      fusionMethod: 'Local Weighted Multi-Source Fusion',
      healthStatus: isAnomaly ? 'Payload Discrepancy Alert' : 'Optimal',
      recommendation: isAnomaly ? 'Excess cargo suspected in passenger compartment; inspect coach.' : 'Normal telemetry active.',
      source: 'client_fusion'
    };
  }

  /**
   * Platform Crowd Balancing & Dynamic Passenger Migration Advisory:
   */
  static async getBalanceAdvisory(
    trainId: string,
    trainNumber: string,
    platformNo: number,
    coaches: Coach[]
  ): Promise<CrowdBalancingResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${AI_API_BASE}/crowd-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          train_id: trainId,
          train_number: trainNumber,
          platform_no: platformNo,
          coaches: coaches.map(c => ({
            coach_id: c.id,
            coach_no: c.coach_no,
            coach_type: c.coach_type,
            empty_weight_kg: c.empty_weight_kg,
            max_capacity_kg: c.max_capacity_kg,
            current_weight_kg: c.current_weight_kg,
            occupancy_percentage: c.occupancy_percentage
          }))
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const d = await res.json();
        return {
          trainId: d.train_id,
          trainNumber: d.train_number,
          platformNo: d.platform_no,
          overallTrainOccupancy: d.overall_train_occupancy,
          imbalanceIndex: d.imbalance_index,
          advisories: d.advisories,
          audioChimeAnnouncement: d.audio_chime_announcement,
          ledDisplayTicker: d.led_display_ticker,
          source: 'fastapi'
        };
      }
    } catch {
      // Local fallback
    }

    const passengerCoaches = coaches.filter(c => c.coach_type !== 'Engine' && c.coach_type !== 'Pantry Car');
    const occs = passengerCoaches.map(c => c.occupancy_percentage);
    const mean = occs.length > 0 ? occs.reduce((a, b) => a + b, 0) / occs.length : 0;
    const std = occs.length > 0 ? Math.sqrt(occs.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / occs.length) : 0;

    const availableCoaches = passengerCoaches.filter(c => c.occupancy_percentage < 60).sort((a, b) => a.occupancy_percentage - b.occupancy_percentage);
    const bestTarget = availableCoaches[0];

    const advisories: CoachBalancingAdvisory[] = passengerCoaches.map(c => {
      const isHeavy = c.occupancy_percentage >= 80;
      const targetNo = isHeavy && bestTarget && bestTarget.id !== c.id ? bestTarget.coach_no : null;
      return {
        coach_no: c.coach_no,
        coach_type: c.coach_type,
        current_occupancy: c.occupancy_percentage,
        status: c.occupancy_percentage > 100 ? 'CRITICAL_CROWD' : isHeavy ? 'HEAVY_CONGESTION' : c.occupancy_percentage < 50 ? 'SPACE_AVAILABLE' : 'MODERATE',
        suggested_action: targetNo ? `Divert commuters towards Coach ${targetNo} (${bestTarget.occupancy_percentage}% occupied).` : 'Standard boarding.',
        target_migration_coach: targetNo,
        passengers_to_divert: isHeavy ? Math.max(5, Math.round((c.occupancy_percentage - 75) * 0.9)) : 0,
        display_board_message: targetNo
          ? `COACH ${c.coach_no} FULL -> BOARD COACH ${targetNo} (${Math.round(bestTarget.occupancy_percentage)}%)`
          : `COACH ${c.coach_no} (${Math.round(c.occupancy_percentage)}% OCCUPIED)`
      };
    });

    const heavyList = advisories.filter(a => a.target_migration_coach);
    const audioAnnouncement = heavyList.length > 0
      ? `Attention passengers on Platform ${platformNo}. Train ${trainNumber}: Coach ${heavyList[0].coach_no} is heavily crowded. Commuters are advised to move towards Coach ${heavyList[0].target_migration_coach}.`
      : `Attention passengers on Platform ${platformNo}. Train ${trainNumber} has balanced passenger load across coaches.`;

    const ledDisplayTicker = `PLATFORM ${platformNo} | TRAIN ${trainNumber} | ` + advisories.map(a => a.display_board_message).join(' | ');

    return {
      trainId,
      trainNumber,
      platformNo,
      overallTrainOccupancy: Math.round(mean * 10) / 10,
      imbalanceIndex: Math.round(std * 10) / 10,
      advisories,
      audioChimeAnnouncement: audioAnnouncement,
      ledDisplayTicker,
      source: 'client_balancer'
    };
  }

  /**
   * Recommends the least crowded coach. Returns null if no passenger coaches exist or data is unavailable.
   */
  static getBestCoachRecommendation(coaches: Coach[]): CoachRecommendationResult | null {
    if (!coaches || coaches.length === 0) return null;
    const passengerCoaches = coaches.filter(c => c.coach_type !== 'Engine' && c.coach_type !== 'Pantry Car');
    if (passengerCoaches.length === 0) {
      return null;
    }

    // Sort by occupancy ascending
    const sorted = [...passengerCoaches].sort((a, b) => a.occupancy_percentage - b.occupancy_percentage);
    const best = sorted[0];

    const reason = `Coach ${best.coach_no} (${best.coach_type}) has lowest occupancy at ${best.occupancy_percentage}%, offering available seating and optimal aisle access.`;

    return {
      recommendedCoachId: best.id,
      recommendedCoachNo: best.coach_no,
      coachType: best.coach_type,
      occupancyPercentage: best.occupancy_percentage,
      reason,
      source: 'statistical_fallback'
    };
  }

  /**
   * Answers natural language analytics assistant queries
   */
  static async queryAssistant(query: string, trains: any[], readings: any[], alerts: any[]): Promise<{ answer: string; insights: string[] }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${AI_API_BASE}/analytics-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          active_trains: trains,
          latest_readings: readings,
          recent_alerts: alerts
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          answer: data.answer,
          insights: data.insights
        };
      }
    } catch {
      // Local fallback below
    }

    // Deterministic local analysis strictly adhering to rule "Never invent missing readings"
    const q = query.toLowerCase();
    const insights: string[] = [];
    let answer = '';

    const allCoaches = trains.flatMap(t => t.coaches || []);
    const passengerCoaches = allCoaches.filter(c => c.coach_type !== 'Engine');
    const overloadedCoaches = passengerCoaches.filter(c => c.current_weight_kg > c.max_capacity_kg);

    if (q.includes('overload') || q.includes('danger') || q.includes('heavy') || q.includes('exceed')) {
      if (overloadedCoaches.length > 0) {
        answer = `Alert: ${overloadedCoaches.length} coach(es) currently exceed structural weight limit!`;
        overloadedCoaches.forEach(c => {
          const excess = Math.round(c.current_weight_kg - c.max_capacity_kg);
          insights.push(`Coach ${c.coach_no} is carrying ${c.current_weight_kg.toLocaleString()} kg (+${excess.toLocaleString()} kg over ${c.max_capacity_kg.toLocaleString()} kg max capacity).`);
        });
      } else {
        answer = 'All active coaches are currently operating strictly within safe structural weight tolerances.';
        insights.push(`0 out of ${passengerCoaches.length} passenger coaches are overloaded.`);
      }
    } else if (q.includes('average') || q.includes('avg') || q.includes('occupancy') || q.includes('crowd')) {
      const avg = Math.round(passengerCoaches.reduce((acc, c) => acc + c.occupancy_percentage, 0) / Math.max(1, passengerCoaches.length));
      answer = `The fleet-wide average coach occupancy is currently ${avg}% across ${passengerCoaches.length} monitored coaches.`;
      insights.push(`Space Available (<40%): ${passengerCoaches.filter(c => c.occupancy_percentage <= 40).length} coaches.`);
      insights.push(`Moderately Crowded (41-75%): ${passengerCoaches.filter(c => c.occupancy_percentage > 40 && c.occupancy_percentage <= 75).length} coaches.`);
      insights.push(`Full (76-100%): ${passengerCoaches.filter(c => c.occupancy_percentage > 75 && c.occupancy_percentage <= 100).length} coaches.`);
      insights.push(`Overloaded (>100%): ${overloadedCoaches.length} coaches.`);
    } else {
      answer = `System is actively tracking ${trains.length} trains and ${allCoaches.length} total bogie weight sensors.`;
      insights.push(`Live telemetry packet refresh cycle: 3 seconds.`);
      insights.push(`Active logged alerts: ${alerts.length}.`);
      insights.push(`You can inquire about "overloaded coaches", "average crowd occupancy", or "train alerts".`);
    }

    return { answer, insights };
  }
}
