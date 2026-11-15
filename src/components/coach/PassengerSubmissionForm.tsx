import React, { useState } from 'react';
import { 
  Train, 
  Coach, 
  PassengerSubmission, 
  VerificationState 
} from '../../types';
import { CoachLayoutService } from '../../services/coachLayoutService';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  User, 
  Ticket, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  FileText,
  AlertCircle,
  Edit2,
  Trash2,
  ShieldCheck
} from 'lucide-react';

interface PassengerSubmissionFormProps {
  trains: Train[];
  activeTrainId?: string;
  activeCoachId?: string;
  onSubmissionSuccess?: (sub: PassengerSubmission) => void;
}

export const PassengerSubmissionForm: React.FC<PassengerSubmissionFormProps> = ({
  trains,
  activeTrainId,
  activeCoachId,
  onSubmissionSuccess
}) => {
  const { user } = useAuth();

  const [selectedTrainId, setSelectedTrainId] = useState<string>(activeTrainId || trains[0]?.id || '');
  const selectedTrain = trains.find(t => t.id === selectedTrainId) || trains[0];

  const [selectedCoachNo, setSelectedCoachNo] = useState<string>(
    selectedTrain?.coaches[0]?.coach_no || 'S1'
  );
  const [seatNumber, setSeatNumber] = useState<number | ''>(12);
  const [pnrNumber, setPnrNumber] = useState('');
  const [passengerName, setPassengerName] = useState(user?.full_name || '');
  const [journeyFrom, setJourneyFrom] = useState(selectedTrain?.from_station || 'CSMT');
  const [journeyTo, setJourneyTo] = useState(selectedTrain?.to_station || 'PUNE');
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().slice(0, 10));
  const [isPhysicallyPresent, setIsPhysicallyPresent] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Submissions list
  const [submissions, setSubmissions] = useState<PassengerSubmission[]>(() => {
    return CoachLayoutService.getPassengerSubmissions();
  });

  const selectedCoach = selectedTrain?.coaches.find(c => c.coach_no === selectedCoachNo) || selectedTrain?.coaches[0];
  const template = selectedCoach ? CoachLayoutService.getTemplate(selectedCoach) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!selectedTrain || !selectedCoachNo || seatNumber === '') {
      setFeedbackMsg({ type: 'error', text: 'Please select a valid train, coach, and seat number.' });
      return;
    }

    if (template && (seatNumber < 1 || seatNumber > template.total_seats)) {
      setFeedbackMsg({ 
        type: 'error', 
        text: `Invalid seat number for Coach ${selectedCoachNo} (${template.class_code}). Must be between 1 and ${template.total_seats}.` 
      });
      return;
    }

    if (!pnrNumber.trim() || pnrNumber.trim().length < 6) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a valid PNR or reservation ticket reference (minimum 6 characters).' });
      return;
    }

    if (!passengerName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Passenger full name is required for verification.' });
      return;
    }

    const newSub = CoachLayoutService.addPassengerSubmission({
      user_id: user?.id,
      train_id: selectedTrain.id,
      train_number: selectedTrain.number,
      train_name: selectedTrain.name,
      coach_no: selectedCoachNo,
      seat_number: Number(seatNumber),
      pnr_number: pnrNumber.trim(),
      passenger_name: passengerName.trim(),
      mobile_masked: '******' + (Math.floor(1000 + Math.random() * 9000)),
      journey_from: journeyFrom,
      journey_to: journeyTo,
      journey_date: journeyDate,
      is_physically_present: isPhysicallyPresent
    });

    setSubmissions(CoachLayoutService.getPassengerSubmissions());
    setFeedbackMsg({ 
      type: 'success', 
      text: `Seat #${newSub.seat_number} in Coach ${newSub.coach_no} registered successfully. Status marked as "Submitted / Pending Verification".` 
    });

    if (onSubmissionSuccess) {
      onSubmissionSuccess(newSub);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Official Header & Guidelines Banner */}
      <div className="gov-card p-4 space-y-2 border-t-4 border-t-[#003366] dark:border-t-blue-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#003366] dark:text-blue-300 flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#002244] dark:text-blue-100 uppercase tracking-tight">
              Passenger On-Board Seat Check-in &amp; Occupancy Confirmation
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Voluntary check-in for commuters on board. Confirms presence and assists bogie load balancing.
            </p>
          </div>
        </div>

        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong>Verification Protocol Notice:</strong>
            <p className="text-[11px] leading-relaxed">
              Self-reported check-ins remain in <em>Submitted / Pending Verification</em> state until cross-checked by on-duty TTE staff or train sensors. This portal does not issue railway tickets or reassign reservations.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Check-in Submission Form */}
      <div className="gov-card p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200 pb-2 border-b border-slate-200 dark:border-slate-800">
          Enter Your Journey &amp; Berth Details
        </h3>

        {feedbackMsg && (
          <div className={`p-3 rounded-xs text-xs flex items-center gap-2 border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
          }`}>
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Train selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Train *
              </label>
              <select
                value={selectedTrainId}
                onChange={(e) => {
                  setSelectedTrainId(e.target.value);
                  const t = trains.find(tr => tr.id === e.target.value);
                  if (t) {
                    setSelectedCoachNo(t.coaches[0]?.coach_no || 'S1');
                    setJourneyFrom(t.from_station);
                    setJourneyTo(t.to_station);
                  }
                }}
                className="w-full px-2.5 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-[#003366]"
              >
                {trains.map(t => (
                  <option key={t.id} value={t.id}>
                    #{t.number} - {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Coach Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Coach No *
              </label>
              <select
                value={selectedCoachNo}
                onChange={(e) => setSelectedCoachNo(e.target.value)}
                className="w-full px-2.5 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-[#003366]"
              >
                {selectedTrain?.coaches.map(c => (
                  <option key={c.id} value={c.coach_no}>
                    Coach {c.coach_no} ({c.coach_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Seat/Berth Number */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Seat / Berth No *
              </label>
              <input
                type="number"
                min={1}
                max={template?.total_seats || 120}
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 18"
                required
                className="w-full px-2.5 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-[#003366]"
              />
              {template && (
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Capacity: 1 to {template.total_seats} berths ({template.class_code})
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PNR / Ticket Ref */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                PNR / Ticket Reference Number *
              </label>
              <input
                type="text"
                value={pnrNumber}
                onChange={(e) => setPnrNumber(e.target.value)}
                placeholder="e.g. 2485671042"
                required
                className="w-full px-2.5 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-[#003366]"
              />
            </div>

            {/* Passenger Full Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Passenger Name *
              </label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
                className="w-full px-2.5 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Boarding Station
              </label>
              <input
                type="text"
                value={journeyFrom}
                onChange={(e) => setJourneyFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Station
              </label>
              <input
                type="text"
                value={journeyTo}
                onChange={(e) => setJourneyTo(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date of Journey
              </label>
              <input
                type="date"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
              />
            </div>
          </div>

          {/* Physical Confirmation Checkbox */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPhysicallyPresent}
                onChange={(e) => setIsPhysicallyPresent(e.target.checked)}
                className="mt-0.5 rounded-xs text-[#003366] focus:ring-0"
              />
              <span className="text-slate-700 dark:text-slate-300 font-semibold leading-tight">
                I hereby declare that I am physically seated / occupying Berth #{seatNumber || '—'} in Coach {selectedCoachNo} on board this train.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold rounded-sm text-xs cursor-pointer transition shadow-sm flex items-center justify-center gap-2"
          >
            <span>Submit Passenger Check-in Declaration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 3. My Submitted Check-in Records */}
      <div className="gov-card overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200">
              My Active Journey Check-in Records ({submissions.length})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Check verification status by Duty Staff / Platform TTE personnel.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Train &amp; Route</th>
                <th className="w-24">Coach / Seat</th>
                <th className="w-32">PNR Reference</th>
                <th>Passenger</th>
                <th className="w-36">Verification Status</th>
                <th>Staff Inspection Notes</th>
                <th className="w-28 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length > 0 ? (
                submissions.map((sub) => {
                  let statusBadge = 'bg-slate-100 text-slate-800 border-slate-300';
                  if (sub.verification_state === 'Verified') {
                    statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
                  } else if (sub.verification_state === 'Pending Verification' || sub.verification_state === 'Submitted') {
                    statusBadge = 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
                  } else if (sub.verification_state === 'Rejected') {
                    statusBadge = 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300';
                  }

                  return (
                    <tr key={sub.id}>
                      <td>
                        <strong className="text-slate-900 dark:text-slate-100 block">
                          #{sub.train_number} {sub.train_name}
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          {sub.journey_from} &rarr; {sub.journey_to}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-[#003366] dark:text-blue-300">
                        {sub.coach_no} / #{sub.seat_number}
                      </td>
                      <td className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                        {sub.pnr_number}
                      </td>
                      <td className="font-semibold text-slate-900 dark:text-slate-100">
                        {sub.passenger_name}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${statusBadge}`}>
                          {sub.verification_state}
                        </span>
                      </td>
                      <td className="text-[11px] text-slate-600 dark:text-slate-400">
                        {sub.staff_notes || 'Awaiting platform duty verification'}
                      </td>
                      <td className="text-right text-[11px] text-slate-500">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                    No active check-in declarations registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
