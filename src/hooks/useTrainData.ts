import { useTrain } from '../context/TrainContext';
import { AIClientService } from '../services/aiClient';

export function useTrainData() {
  const context = useTrain();
  const {
    trains,
    selectedTrainId,
    selectedTrain,
    setSelectedTrainId,
    simulatedTrain,
    updateSimulatedCoachWeight,
    resetSimulatedCoachWeight,
    presetSimulatedRandomCrowd,
    presetSimulatedRushHour,
    presetSimulatedEmptyTrain,
    isAutoSimulating,
    toggleAutoSimulate,
    lastUpdated,
    notifications,
    markNotificationRead,
    incidents,
    addIncidentReport
  } = context;

  const currentTrain = selectedTrain || trains[0] || simulatedTrain;
  const recommendation = currentTrain && currentTrain.coaches.length > 0
    ? AIClientService.getBestCoachRecommendation(currentTrain.coaches)
    : null;

  return {
    ...context,
    trains,
    selectedTrainId,
    selectedTrain: currentTrain,
    setSelectedTrainId,
    recommendation,
    updateCoachWeight: (_trainId: string, coachId: string, weight: number) => {
      updateSimulatedCoachWeight(coachId, weight);
    },
    resetCoachWeight: (_trainId: string, coachId: string) => {
      resetSimulatedCoachWeight(coachId);
    },
    resetAllCoaches: () => {
      presetSimulatedEmptyTrain();
    },
    presetRandomCrowd: () => {
      presetSimulatedRandomCrowd();
    },
    presetRushHour: () => {
      presetSimulatedRushHour();
    },
    presetEmptyTrain: () => {
      presetSimulatedEmptyTrain();
    },
    isAutoSimulating,
    toggleAutoSimulate,
    lastUpdated,
    notifications,
    markNotificationRead,
    incidents,
    addIncidentReport
  };
}
