import React, { useState, useEffect } from 'react';
import { X, Scale, Clock, ShieldAlert, Cpu, Sparkles } from 'lucide-react';
import { Coach } from '../../types';
import { calculateCoachOccupancy, formatWeight } from '../../utils/weightCalculations';
import { AIClientService, PredictionResult } from '../../services/aiClient';
import { useLanguage } from '../../context/LanguageContext';

interface CoachDetailModalProps {
  coach: Coach | null;
  onClose: () => void;
  trainName: string;
  trainNumber: string;
}

export const CoachDetailModal: React.FC<CoachDetailModalProps> = ({
  coach,
  onClose,
  trainName,
  trainNumber
}) => {
  const { language } = useLanguage();
  const isMr = language === 'mr';
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  useEffect(() => {
    if (!coach) return;
    setLoadingAI(true);
    AIClientService.getCrowdPrediction(coach)
      .then(res => setPrediction(res))
      .catch(err => console.error(err))
      .finally(() => setLoadingAI(false));
  }, [coach]);

  if (!coach) return null;

  const occ = calculateCoachOccupancy(
    coach.current_weight_kg,
    coach.empty_weight_kg,
    coach.max_capacity_kg,
    coach.coach_type
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${
          occ.isOverloaded 
            ? 'bg-rose-950/80 text-rose-100 border-rose-800' 
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
              occ.isOverloaded ? 'bg-rose-700 text-white animate-pulse' : 'bg-blue-600 text-white'
            }`}>
              {coach.coach_no}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Coach {coach.coach_no} ({coach.coach_type})
                </h3>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${occ.statusColorClass}`}>
                  {occ.statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Train {trainNumber} - {trainName}</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {coach.data_source || 'VERIFIED_REAL'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Overload Alert Warning */}
          {occ.isOverloaded && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-600 text-rose-200 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong className="block text-sm font-bold text-rose-300">
                  DANGER: Coach Overload Limit Exceeded!
                </strong>
                Current gross weight exceeds safe rated payload capacity by {formatWeight(occ.excessWeightKg)}. Immediate passenger de-boarding or diversion required to maintain railway braking & axle integrity.
              </div>
            </div>
          )}

          {/* Plain-Language Passenger Action Advice */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            occ.isOverloaded
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
              : occ.clampedOccupancy > 75
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
          }`}>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
                {isMr ? '💡 प्रवाशांसाठी सल्ला (What Should I Do?)' : '💡 Recommended Passenger Action'}
              </span>
              <p className="text-xs font-semibold mt-0.5">
                {occ.isOverloaded
                  ? (isMr ? 'डब्यात मर्यादेपेक्षा जास्त भार आहे! कृपया या डब्यात चढणे टाळा आणि शेजारच्या डब्यात जा.' : 'Coach is over safe load limit! Please do not board this coach; move to a less crowded coach.')
                  : occ.clampedOccupancy > 75
                  ? (isMr ? 'डब्यात बरीच गर्दी आहे. सामान जपून चढा किंवा शेजारील डबे तपासा.' : 'Coach is busy with heavy crowd. Board carefully or check adjacent coaches.')
                  : (isMr ? 'या डब्यात पुरेशी जागा उपलब्ध आहे. तुम्ही आरामात प्रवास करू शकता.' : 'Ample seating/standing room available. Safe and comfortable to board.')}
              </p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg shrink-0 ${
              occ.isOverloaded ? 'bg-rose-600 text-white' : occ.clampedOccupancy > 75 ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {occ.isOverloaded 
                ? (isMr ? 'चढू नका' : 'Do Not Board') 
                : occ.clampedOccupancy > 75 
                ? (isMr ? 'सावध राहा' : 'Board Carefully') 
                : (isMr ? 'चढण्यास सुरक्षित' : 'Safe to Board')}
            </span>
          </div>

          {/* Occupancy Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-slate-600 dark:text-slate-400">
                {isMr ? 'डब्यातील गर्दीची टक्केवारी (Occupancy)' : 'Coach Fullness / Occupancy Ratio'}
              </span>
              <span className={`text-sm font-bold ${occ.textColorClass}`}>
                {occ.clampedOccupancy}% {occ.isOverloaded && `(${isMr ? 'प्रत्यक्ष' : 'Actual'}: ${occ.rawOccupancy}%)`}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  occ.isOverloaded ? 'bg-rose-800' :
                  occ.clampedOccupancy > 75 ? 'bg-rose-500' :
                  occ.clampedOccupancy > 40 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, occ.clampedOccupancy)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>0% {isMr ? 'रिकामा' : 'Empty'}</span>
              <span>40% {isMr ? 'जागा उपलब्ध' : 'Space Avail'}</span>
              <span>75% {isMr ? 'मध्यम गर्दी' : 'Moderate'}</span>
              <span>100% {isMr ? 'पूर्ण भरलेला' : 'Full'}</span>
            </div>
          </div>

          {/* Weight Metrics Grid with Plain Language Explanations */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                {isMr ? 'एकूण वजन' : 'Current Gross Wt'}
              </span>
              <span className="text-[10px] text-slate-400 block mb-1">
                {isMr ? '(डबा + प्रवासी + सामान)' : '(Coach + all passengers)'}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formatWeight(coach.current_weight_kg)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                {isMr ? 'मूळ डब्याचे वजन' : 'Empty Tare Wt'}
              </span>
              <span className="text-[10px] text-slate-400 block mb-1">
                {isMr ? '(प्रवाशांशिवाय मूळ डबा)' : '(Coach without passengers)'}
              </span>
              <span className="text-base font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {formatWeight(coach.empty_weight_kg)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block">
                {isMr ? 'प्रवाशांचे निव्वळ वजन' : 'Net Passenger Load'}
              </span>
              <span className="text-[10px] text-slate-400 block mb-1">
                {isMr ? '(प्रवासी आणि सामानाचे वजन)' : '(Weight of passengers & bags)'}
              </span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">
                {formatWeight(occ.netPassengerPayloadKg)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                {isMr ? 'सुरक्षित कमाल मर्यादा' : 'Max Rated Gross Wt'}
              </span>
              <span className="text-[10px] text-slate-400 block mb-1">
                {isMr ? '(रेल्वेने ठरवलेली सुरक्षित सीमा)' : '(Safe maximum limit)'}
              </span>
              <span className="text-base font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {formatWeight(coach.max_capacity_kg)}
              </span>
            </div>
          </div>

          {/* AI Crowd Prediction Section */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  AI Crowd Forecast (15m, 30m, 60m)
                </h4>
              </div>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-mono">
                {prediction?.source === 'fastapi' ? 'FastAPI Service' : 'Statistical Regression'}
              </span>
            </div>

            {loadingAI ? (
              <div className="py-4 text-center text-xs text-indigo-600 dark:text-indigo-400 animate-pulse">
                Computing time-series regression horizons...
              </div>
            ) : prediction ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {prediction.predictions.map((p) => (
                  <div key={p.horizon_minutes} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" /> +{p.horizon_minutes} min
                      </span>
                      <span className="text-[10px] text-indigo-600 font-mono font-bold">
                        {Math.round(p.confidence_score * 100)}% conf
                      </span>
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {p.predicted_occupancy}%
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {p.explanation}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {prediction && (
              <p className="mt-3 text-[10px] text-indigo-900/70 dark:text-indigo-300/70 italic">
                Model: {prediction.modelUsed}. Limitations: {prediction.limitations}
              </p>
            )}
          </div>

          {/* Important Scientific Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Scale className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              <strong>{isMr ? 'महत्त्वाची नोंद (Note):' : 'Estimated Data Notice:'}</strong>{' '}
              {isMr 
                ? 'डब्यातील प्रवाशांची संख्या ही वजनावर आधारित (सरासरी ७८ किलो प्रति व्यक्ती) अंदाजित आहे. हे प्रत्यक्ष मोजणी नसून सुरक्षिततेसाठी तयार केलेला अंदाज आहे.'
                : 'Coach occupancy is an estimated weight-based metric (~78 kg avg per passenger). It serves as a safety indicator and does not represent an exact turnstile optical head count.'}
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            {isMr ? 'माहिती बंद करा (Close)' : 'Close Coach Details'}
          </button>
        </div>

      </div>
    </div>
  );
};
