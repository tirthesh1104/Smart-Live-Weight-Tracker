import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Train, Coach, SystemNotification, IncidentReport } from '../types';
import { OfflineStorageService } from '../services/offlineStorage';
import { calculateCoachOccupancy } from '../utils/weightCalculations';
import { createDefaultSimulationScenario, createSimulatedCoach } from '../data/seedData';

export type SimulationScenarioId = 
  | 'empty_train'
  | 'normal_load'
  | 'peak_hour'
  | 'festival_rush'
  | 'weekend_rush'
  | 'overloaded_coach'
  | 'uneven_occupancy'
  | 'sudden_boarding'
  | 'passenger_departure'
  | 'journey_progression';

interface TrainContextType {
  // Operational Records (Empty initial dataset, user-created or authorized)
  trains: Train[];
  selectedTrainId: string;
  selectedTrain: Train | undefined;
  setSelectedTrainId: (id: string) => void;
  addTrain: (trainData: { number: string; name: string; from_station: string; to_station: string; data_source?: any }) => void;
  updateTrain: (id: string, updates: Partial<Train>) => void;
  deleteTrain: (id: string) => void;
  addCoach: (trainId: string, coachData: { coach_no: string; coach_type: any; empty_weight_kg: number; max_capacity_kg: number }) => void;
  updateCoach: (trainId: string, coachId: string, updates: Partial<Coach>) => void;
  deleteCoach: (trainId: string, coachId: string) => void;

  // Operational Alerts & Incidents
  notifications: SystemNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearReadNotifications: () => void;
  addNotification: (notif: Omit<SystemNotification, 'id' | 'created_at'>) => void;
  incidents: IncidentReport[];
  addIncidentReport: (incident: Omit<IncidentReport, 'id' | 'created_at'>) => void;

  // Simulator Scenario (Separate from operational records)
  simulatedTrain: Train | null;
  initSimulationScenario: (trainNumber?: string, trainName?: string) => void;
  clearSimulationScenario: () => void;
  updateSimulatedCoachWeight: (coachId: string, newWeightKg: number) => void;
  resetSimulatedCoachWeight: (coachId: string) => void;
  presetSimulatedRandomCrowd: () => void;
  presetSimulatedRushHour: () => void;
  presetSimulatedEmptyTrain: () => void;
  applySimulationScenario: (scenarioId: SimulationScenarioId) => void;
  resetDemoSimulation: () => void;
  isAutoSimulating: boolean;
  toggleAutoSimulate: () => void;

  // Sync state
  lastUpdated: Date;
  refreshOperationalData: () => void;
}

const TrainContext = createContext<TrainContextType | undefined>(undefined);

export const TrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Operational dataset starts clean (0 trains by default)
  const [trains, setTrains] = useState<Train[]>(() => OfflineStorageService.getTrains());
  const [selectedTrainId, setSelectedTrainId] = useState<string>(() => trains[0]?.id || '');
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => OfflineStorageService.getNotifications());
  const [incidents, setIncidents] = useState<IncidentReport[]>(() => OfflineStorageService.getIncidents());

  // 2. Separate Simulator Scenario
  const [simulatedTrain, setSimulatedTrain] = useState<Train | null>(() => OfflineStorageService.getSimulationScenario());
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const autoSimTimerRef = useRef<any>(null);

  const selectedTrain = trains.find(t => t.id === selectedTrainId) || trains[0];

  const refreshOperationalData = () => {
    setTrains(OfflineStorageService.getTrains());
    setNotifications(OfflineStorageService.getNotifications());
    setIncidents(OfflineStorageService.getIncidents());
    setSimulatedTrain(OfflineStorageService.getSimulationScenario());
    setLastUpdated(new Date());
  };

  // Save changes to operational trains
  const syncAndSaveTrains = (updatedTrains: Train[]) => {
    setTrains(updatedTrains);
    setLastUpdated(new Date());
    OfflineStorageService.saveTrains(updatedTrains);
  };

  // Helper to re-evaluate coach status
  const evaluateCoach = (coach: Coach, newWeightKg: number, source: any = 'SIMULATED_TEST'): Coach => {
    const occ = calculateCoachOccupancy(newWeightKg, coach.empty_weight_kg, coach.max_capacity_kg, coach.coach_type);
    return {
      ...coach,
      current_weight_kg: Math.round(newWeightKg),
      occupancy_percentage: occ.clampedOccupancy,
      status: occ.status,
      last_updated: new Date().toISOString(),
      data_source: source
    };
  };

  // Operational Train CRUD
  const addTrain = (trainData: { number: string; name: string; from_station: string; to_station: string; data_source?: any }) => {
    const newTrainId = 'tr-' + Date.now();
    const newTrain: Train = {
      id: newTrainId,
      number: trainData.number.trim().toUpperCase(),
      name: trainData.name.trim(),
      from_station: trainData.from_station.trim(),
      to_station: trainData.to_station.trim(),
      coaches: [],
      created_at: new Date().toISOString(),
      data_source: trainData.data_source || 'MANUAL_ENTRY'
    };

    const updated = [...trains, newTrain];
    syncAndSaveTrains(updated);
    if (!selectedTrainId) setSelectedTrainId(newTrainId);
    OfflineStorageService.addAuditLog('Registered Train', { number: newTrain.number, name: newTrain.name });
  };

  const updateTrain = (id: string, updates: Partial<Train>) => {
    const updated = trains.map(t => t.id === id ? { ...t, ...updates } : t);
    syncAndSaveTrains(updated);
    OfflineStorageService.addAuditLog('Updated Train', { id, ...updates });
  };

  const deleteTrain = (id: string) => {
    const updated = trains.filter(t => t.id !== id);
    syncAndSaveTrains(updated);
    if (selectedTrainId === id && updated.length > 0) {
      setSelectedTrainId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedTrainId('');
    }
    OfflineStorageService.addAuditLog('Deleted Train', { id });
  };

  // Operational Coach CRUD
  const addCoach = (trainId: string, coachData: { coach_no: string; coach_type: any; empty_weight_kg: number; max_capacity_kg: number }) => {
    const updated = trains.map(t => {
      if (t.id !== trainId) return t;
      const newCoach = evaluateCoach({
        id: 'c-' + Date.now(),
        train_id: trainId,
        coach_no: coachData.coach_no.trim().toUpperCase(),
        coach_type: coachData.coach_type,
        empty_weight_kg: Number(coachData.empty_weight_kg),
        max_capacity_kg: Number(coachData.max_capacity_kg),
        current_weight_kg: Number(coachData.empty_weight_kg),
        occupancy_percentage: 0,
        status: 'available',
        last_updated: new Date().toISOString(),
        data_source: 'MANUAL_ENTRY'
      }, Number(coachData.empty_weight_kg));

      return {
        ...t,
        coaches: [...t.coaches, newCoach]
      };
    });
    syncAndSaveTrains(updated);
    OfflineStorageService.addAuditLog('Added Coach', { coachNo: coachData.coach_no, trainId });
  };

  const updateCoach = (trainId: string, coachId: string, updates: Partial<Coach>) => {
    const updated = trains.map(t => {
      if (t.id !== trainId) return t;
      return {
        ...t,
        coaches: t.coaches.map(c => {
          if (c.id !== coachId) return c;
          const merged = { ...c, ...updates };
          return evaluateCoach(merged, merged.current_weight_kg, merged.data_source || 'MANUAL_ENTRY');
        })
      };
    });
    syncAndSaveTrains(updated);
    OfflineStorageService.addAuditLog('Updated Coach', { coachId, trainId });
  };

  const deleteCoach = (trainId: string, coachId: string) => {
    const updated = trains.map(t => {
      if (t.id !== trainId) return t;
      return {
        ...t,
        coaches: t.coaches.filter(c => c.id !== coachId)
      };
    });
    syncAndSaveTrains(updated);
    OfflineStorageService.addAuditLog('Deleted Coach', { coachId, trainId });
  };

  // Operational Alerts & Incidents
  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    setNotifications(updated);
    OfflineStorageService.saveNotifications(updated);
  };

  const markAllNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, is_read: true }));
    setNotifications(updated);
    OfflineStorageService.saveNotifications(updated);
  };

  const clearReadNotifications = () => {
    const updated = notifications.filter(n => !n.is_read);
    setNotifications(updated);
    OfflineStorageService.saveNotifications(updated);
  };

  const addNotification = (notifData: Omit<SystemNotification, 'id' | 'created_at'>) => {
    const newNotif: SystemNotification = {
      ...notifData,
      id: 'notif-' + Date.now(),
      created_at: new Date().toISOString()
    };
    OfflineStorageService.addNotification(newNotif);
    setNotifications(OfflineStorageService.getNotifications());
  };

  const addIncidentReport = (incidentData: Omit<IncidentReport, 'id' | 'created_at'>) => {
    const newIncident: IncidentReport = {
      ...incidentData,
      id: 'inc-' + Date.now(),
      created_at: new Date().toISOString()
    };
    OfflineStorageService.addIncident(newIncident);
    setIncidents(prev => [newIncident, ...prev]);
  };

  // -------------------------------------------------------------
  // SIMULATOR SCENARIO METHODS (Strictly isolated from Real Data)
  // -------------------------------------------------------------
  const initSimulationScenario = (trainNumber = 'SIM-101', trainName = 'Simulation Test Rake') => {
    const scenario = createDefaultSimulationScenario(trainNumber, trainName);
    setSimulatedTrain(scenario);
    OfflineStorageService.saveSimulationScenario(scenario);
    setLastUpdated(new Date());
  };

  const clearSimulationScenario = () => {
    if (autoSimTimerRef.current) clearInterval(autoSimTimerRef.current);
    setIsAutoSimulating(false);
    setSimulatedTrain(null);
    OfflineStorageService.clearSimulationScenario();
    setLastUpdated(new Date());
  };

  const resetDemoSimulation = () => {
    if (autoSimTimerRef.current) clearInterval(autoSimTimerRef.current);
    setIsAutoSimulating(false);
    const fresh = createDefaultSimulationScenario('SIM-12001', 'Simulation Express (LHB 12-Rake)');
    setSimulatedTrain(fresh);
    OfflineStorageService.saveSimulationScenario(fresh);
    // Purge simulated alerts only, preserving official shift logs and user accounts
    const nonSimNotifs = notifications.filter(n => !n.id.startsWith('sim-'));
    setNotifications(nonSimNotifs);
    OfflineStorageService.saveNotifications(nonSimNotifs);
    setLastUpdated(new Date());
  };

  const updateSimulatedCoachWeight = (coachId: string, newWeightKg: number) => {
    if (!simulatedTrain) return;
    const updatedCoaches = simulatedTrain.coaches.map(c => {
      if (c.id !== coachId) return c;
      const evaluated = evaluateCoach(c, newWeightKg, 'SIMULATED DATA');

      // Check for overload in simulation
      if (evaluated.current_weight_kg > c.max_capacity_kg && c.current_weight_kg <= c.max_capacity_kg) {
        const notif: SystemNotification = {
          id: 'sim-notif-' + Date.now(),
          title: `[SIMULATED] Overload Detected on Coach ${c.coach_no}`,
          message: `Simulated weight reached ${evaluated.current_weight_kg.toLocaleString()} kg (> ${c.max_capacity_kg.toLocaleString()} kg max capacity).`,
          severity: 'overload',
          train_id: simulatedTrain.id,
          coach_id: c.id,
          created_at: new Date().toISOString(),
          is_read: false
        };
        OfflineStorageService.addNotification(notif);
        setNotifications(prev => [notif, ...prev]);
      }

      return evaluated;
    });

    const updatedScenario = { ...simulatedTrain, coaches: updatedCoaches };
    setSimulatedTrain(updatedScenario);
    OfflineStorageService.saveSimulationScenario(updatedScenario);
    setLastUpdated(new Date());
  };

  const resetSimulatedCoachWeight = (coachId: string) => {
    if (!simulatedTrain) return;
    const coach = simulatedTrain.coaches.find(c => c.id === coachId);
    if (coach) {
      updateSimulatedCoachWeight(coachId, coach.empty_weight_kg);
    }
  };

  const presetSimulatedRandomCrowd = () => {
    if (!simulatedTrain) return;
    const updatedCoaches = simulatedTrain.coaches.map(c => {
      if (c.coach_type === 'Engine') return c;
      const payloadCap = c.max_capacity_kg - c.empty_weight_kg;
      const factor = 0.20 + Math.random() * 0.65;
      return evaluateCoach(c, c.empty_weight_kg + payloadCap * factor, 'SIMULATED DATA');
    });
    const updated = { ...simulatedTrain, coaches: updatedCoaches };
    setSimulatedTrain(updated);
    OfflineStorageService.saveSimulationScenario(updated);
    setLastUpdated(new Date());
  };

  const presetSimulatedRushHour = () => {
    if (!simulatedTrain) return;
    const updatedCoaches = simulatedTrain.coaches.map(c => {
      if (c.coach_type === 'Engine') return c;
      const payloadCap = c.max_capacity_kg - c.empty_weight_kg;
      const factor = c.coach_type === 'General' ? 1.08 + Math.random() * 0.05 : 0.85 + Math.random() * 0.12;
      return evaluateCoach(c, c.empty_weight_kg + payloadCap * factor, 'SIMULATED DATA');
    });
    const updated = { ...simulatedTrain, coaches: updatedCoaches };
    setSimulatedTrain(updated);
    OfflineStorageService.saveSimulationScenario(updated);
    setLastUpdated(new Date());
  };

  const presetSimulatedEmptyTrain = () => {
    applySimulationScenario('empty_train');
  };

  const applySimulationScenario = (scenarioId: SimulationScenarioId) => {
    const active = simulatedTrain || createDefaultSimulationScenario('SIM-12001', 'Simulation Express (LHB 12-Rake)');
    let updatedCoaches: Coach[] = [];

    switch (scenarioId) {
      case 'empty_train':
        updatedCoaches = active.coaches.map(c => evaluateCoach(c, c.empty_weight_kg, 'SIMULATED DATA'));
        break;

      case 'normal_load':
        updatedCoaches = active.coaches.map(c => {
          if (c.coach_type === 'Engine') return c;
          const payloadCap = c.max_capacity_kg - c.empty_weight_kg;
          const factor = 0.45 + Math.random() * 0.20; // 45-65%
          return evaluateCoach(c, c.empty_weight_kg + payloadCap * factor, 'SIMULATED DATA');
        });
        break;

      case 'peak_hour':
        updatedCoaches = active.coaches.map(c => {
          if (c.coach_type === 'Engine') return c;
          const payloadCap = c.max_capacity_kg - c.empty_weight_kg;
          const factor = c.coach_type === 'General' ? 1.02 + Math.random() * 0.05 : 0.88 + Math.random() * 0.08;
          return evaluateCoach(c, c.empty_weight_kg + payloadCap * factor, 'SIMULATED DATA');
        });
        break;

      case 'festival_rush':
        updatedCoaches = active.coaches.map(c => {
          if (c.coach_type === 'Engine') return c;
          const payloadCap = c.max_capacity_kg - c.empty_weight_kg;
          const factor = c.coach_type === 'General' 
            ? 1.15 + Math.random() * 0.10 // 115-125% severe overload
            : c.coach_type === 'Sleeper' ? 1.02 + Math.random() * 0.06 : 0.92 + Math.random() * 0.05;
          return evaluateCoach(c, c.empty_weight_kg + payloadCap * factor, 'SIMULATED DATA');
        });
        break;

      case 'weekend_rush':
        updatedCoaches = active.coaches.map(c => {
          if (c.coach_type === 'Engine') return c;
          const payloadCap = c.max_capacity_kg - c.empty_weight_kg;
          const factor = c.coach_type.startsWith('AC') ? 0.88 + Math.random() * 0.08 : 0.72 + Math.random() * 0.12;
          return evaluateCoach(c, c.empty_weight_kg + payloadCap * factor, 'SIMULATED DATA');
        });
        break;

      case 'overloaded_coach':
        updatedCoaches = active.coaches.map((c, idx) => {
          if (c.coach_type === 'Engine') return c;
          const payloadCap = c.max_capacity_kg - c.empty_weight_kg;
          // Inject severe overload on first 2 passenger coaches
          const factor = idx === 1 || idx === 2 ? 1.22 : 0.48 + Math.random() * 0.15;
          return evaluateCoach(c, c.empty_weight_kg + payloadCap * factor, 'SIMULATED DATA');
        });
        break;

      case 'uneven_occupancy':
        updatedCoaches = active.coaches.map((c, idx) => {
          if (c.coach_type === 'Engine') return c;
          const payloadCap = c.max_capacity_kg - c.empty_weight_kg;
          // Front: 98%, Middle: 28%, Rear: 55%
          let factor = 0.50;
          if (idx <= 3) factor = 0.98; // Front crowded
          else if (idx <= 6) factor = 0.28; // Middle vacant
          else factor = 0.55; // Rear moderate
          return evaluateCoach(c, c.empty_weight_kg + payloadCap * factor, 'SIMULATED DATA');
        });
        break;

      case 'sudden_boarding':
        updatedCoaches = active.coaches.map(c => {
          if (c.coach_type === 'Engine') return c;
          // Add +45 passengers (~3,060 kg)
          const addWeight = 45 * 68;
          const newWeight = Math.min(c.max_capacity_kg * 1.15, c.current_weight_kg + addWeight);
          return evaluateCoach(c, newWeight, 'SIMULATED DATA');
        });
        break;

      case 'passenger_departure':
        updatedCoaches = active.coaches.map(c => {
          if (c.coach_type === 'Engine') return c;
          // Remove -40 passengers (~2,720 kg)
          const subWeight = 40 * 68;
          const newWeight = Math.max(c.empty_weight_kg, c.current_weight_kg - subWeight);
          return evaluateCoach(c, newWeight, 'SIMULATED DATA');
        });
        break;

      case 'journey_progression':
        updatedCoaches = active.coaches.map((c, idx) => {
          if (c.coach_type === 'Engine') return c;
          const payloadCap = c.max_capacity_kg - c.empty_weight_kg;
          // Dynamic progression bell curve across rakes
          const wave = Math.sin((idx / active.coaches.length) * Math.PI);
          const factor = 0.35 + wave * 0.55;
          return evaluateCoach(c, c.empty_weight_kg + payloadCap * factor, 'SIMULATED DATA');
        });
        break;

      default:
        updatedCoaches = active.coaches;
        break;
    }

    const updated = { ...active, coaches: updatedCoaches };
    setSimulatedTrain(updated);
    OfflineStorageService.saveSimulationScenario(updated);

    // Trigger notification if any coach is overloaded in this scenario
    const overloaded = updatedCoaches.find(c => c.current_weight_kg > c.max_capacity_kg);
    if (overloaded) {
      const notif: SystemNotification = {
        id: 'sim-scenario-' + Date.now(),
        title: `[SIMULATED SCENARIO] Overload Hazard: Coach ${overloaded.coach_no}`,
        message: `Scenario '${scenarioId}' triggered overload on Coach ${overloaded.coach_no} (${overloaded.occupancy_percentage}% occupancy).`,
        severity: 'overload',
        train_id: updated.id,
        coach_id: overloaded.id,
        created_at: new Date().toISOString(),
        is_read: false
      };
      OfflineStorageService.addNotification(notif);
      setNotifications(prev => [notif, ...prev]);
    }

    setLastUpdated(new Date());
  };

  const toggleAutoSimulate = () => {
    setIsAutoSimulating(prev => !prev);
  };

  useEffect(() => {
    if (!isAutoSimulating || !simulatedTrain) {
      if (autoSimTimerRef.current) clearInterval(autoSimTimerRef.current);
      return;
    }

    autoSimTimerRef.current = setInterval(() => {
      setSimulatedTrain(current => {
        if (!current) return null;
        const updated = {
          ...current,
          coaches: current.coaches.map(c => {
            if (c.coach_type === 'Engine') return c;
            const delta = (Math.random() - 0.48) * 140;
            const newWeight = Math.max(c.empty_weight_kg * 0.99, c.current_weight_kg + delta);
            return evaluateCoach(c, newWeight, 'SIMULATED DATA');
          })
        };
        OfflineStorageService.saveSimulationScenario(updated);
        return updated;
      });
      setLastUpdated(new Date());
    }, 3000);

    return () => {
      if (autoSimTimerRef.current) clearInterval(autoSimTimerRef.current);
    };
  }, [isAutoSimulating, simulatedTrain]);

  return (
    <TrainContext.Provider value={{
      trains,
      selectedTrainId,
      selectedTrain,
      setSelectedTrainId,
      addTrain,
      updateTrain,
      deleteTrain,
      addCoach,
      updateCoach,
      deleteCoach,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      clearReadNotifications,
      addNotification,
      incidents,
      addIncidentReport,
      simulatedTrain,
      initSimulationScenario,
      clearSimulationScenario,
      updateSimulatedCoachWeight,
      resetSimulatedCoachWeight,
      presetSimulatedRandomCrowd,
      presetSimulatedRushHour,
      presetSimulatedEmptyTrain,
      applySimulationScenario,
      resetDemoSimulation,
      isAutoSimulating,
      toggleAutoSimulate,
      lastUpdated,
      refreshOperationalData
    }}>
      {children}
    </TrainContext.Provider>
  );
};

export const useTrain = () => {
  const context = useContext(TrainContext);
  if (!context) throw new Error('useTrain must be used within TrainProvider');
  return context;
};
