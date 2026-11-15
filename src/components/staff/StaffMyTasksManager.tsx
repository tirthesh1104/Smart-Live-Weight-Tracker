import React, { useState, useEffect } from 'react';
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Edit3, 
  Save, 
  RefreshCw, 
  Check, 
  ShieldAlert, 
  Train as TrainIcon, 
  Info,
  MapPin
} from 'lucide-react';
import { StaffTask, StaffTaskStatus, UserProfile } from '../../types';
import { StaffTaskService } from '../../services/staffTaskService';

interface StaffMyTasksManagerProps {
  currentUser: UserProfile | null;
}

export const StaffMyTasksManager: React.FC<StaffMyTasksManagerProps> = ({ currentUser }) => {
  const [myTasks, setMyTasks] = useState<StaffTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNotesTaskId, setEditingNotesTaskId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadTasks = async () => {
    setIsLoading(true);
    // Strict isolation: only tasks assigned to this staff member
    const tasks = await StaffTaskService.getTasksForUser(currentUser?.id, currentUser?.email, false);
    setMyTasks(tasks);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, [currentUser]);

  const handleStatusChange = async (task: StaffTask, newStatus: StaffTaskStatus) => {
    await StaffTaskService.updateTaskStatus(task.id, newStatus);
    setFeedbackMsg(`Task status updated to "${newStatus}".`);
    setTimeout(() => setFeedbackMsg(null), 4000);
    loadTasks();
  };

  const handleSaveNotes = async (taskId: string) => {
    const task = myTasks.find(t => t.id === taskId);
    if (!task) return;

    await StaffTaskService.updateTaskStatus(taskId, task.status, notesInput);
    setFeedbackMsg('Field inspection findings saved.');
    setTimeout(() => setFeedbackMsg(null), 4000);
    setEditingNotesTaskId(null);
    setNotesInput('');
    loadTasks();
  };

  const filtered = myTasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = myTasks.filter(t => t.status === 'Pending').length;
  const inProgressCount = myTasks.filter(t => t.status === 'In Progress').length;
  const completedCount = myTasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="space-y-4">
      
      {/* Top Banner & KPI Metrics */}
      <div className="gov-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#003366] dark:text-blue-300 flex items-center justify-center shrink-0">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100">
                My Assigned Duty Tasks &bull; Personal Work Order
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assigned to: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.full_name || 'Staff Officer'}</strong> ({currentUser?.employee_id || 'IR-STF'}) &bull; Station: {currentUser?.station_code || 'CSMT'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadTasks}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-sm text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-sm">
            <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400 block">Pending</span>
            <span className="text-lg font-bold font-mono text-amber-900 dark:text-amber-300">{pendingCount}</span>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-sm">
            <span className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-400 block">In Progress</span>
            <span className="text-lg font-bold font-mono text-blue-900 dark:text-blue-300">{inProgressCount}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-sm">
            <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-400 block">Completed</span>
            <span className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-300">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-l-4 border-l-emerald-600 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="gov-card p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase text-slate-500 text-[11px]">Filter by Status:</span>
          <div className="flex items-center gap-1">
            {(['all', 'Pending', 'In Progress', 'Completed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-xs font-semibold text-xs cursor-pointer transition ${
                  filterStatus === st
                    ? 'bg-[#003366] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? `All (${myTasks.length})` : st}
              </button>
            ))}
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          Showing {filtered.length} task(s)
        </span>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.length === 0 ? (
          <div className="col-span-full gov-card p-8 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto opacity-70" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No pending tasks found</p>
            <p className="text-xs text-slate-500">
              You are all caught up! New tasks will appear here when assigned by the Central Traffic Administrator.
            </p>
          </div>
        ) : (
          filtered.map((task) => {
            const isOverdue = task.due_date && new Date(task.due_date).getTime() < Date.now() && task.status !== 'Completed';
            const isEditingThisNotes = editingNotesTaskId === task.id;

            return (
              <div 
                key={task.id} 
                className={`gov-card p-4 space-y-3 border-l-4 transition ${
                  task.priority === 'Critical' ? 'border-l-rose-600' :
                  task.priority === 'High' ? 'border-l-orange-500' :
                  task.priority === 'Medium' ? 'border-l-blue-600' :
                  'border-l-slate-400'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                        task.priority === 'Critical' ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300' :
                        task.priority === 'High' ? 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300' :
                        task.priority === 'Medium' ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {task.priority} Priority
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-xs">
                        {task.task_type}
                      </span>
                      {task.train_number && (
                        <span className="font-mono text-[10px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/50 text-[#003366] dark:text-blue-300 font-bold rounded-xs flex items-center gap-1">
                          <TrainIcon className="w-2.5 h-2.5" />
                          <span>#{task.train_number} {task.coach_no ? `(${task.coach_no})` : ''}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1.5">
                      {task.title}
                    </h3>
                  </div>

                  <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border shrink-0 ${
                    task.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    task.status === 'In Progress' ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300' :
                    task.status === 'Cancelled' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                    'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {task.status}
                  </span>
                </div>

                {/* Description */}
                {task.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Due date info */}
                {task.due_date && (
                  <div className={`text-[11px] flex items-center gap-1.5 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Target Due: {new Date(task.due_date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {isOverdue && <span className="uppercase text-[9px] px-1 bg-rose-100 text-rose-800 rounded-xs">Overdue</span>}
                  </div>
                )}

                {/* Notes Section */}
                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-600 dark:text-slate-400">My Field Findings / Notes:</span>
                    {!isEditingThisNotes && (
                      <button
                        onClick={() => {
                          setEditingNotesTaskId(task.id);
                          setNotesInput(task.notes || '');
                        }}
                        className="text-[#003366] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer text-[10px]"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{task.notes ? 'Edit Notes' : 'Add Findings'}</span>
                      </button>
                    )}
                  </div>

                  {isEditingThisNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        rows={2}
                        placeholder="Enter observation, bogie tare reading, or action taken..."
                        className="gov-input text-xs"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingNotesTaskId(null);
                            setNotesInput('');
                          }}
                          className="px-2 py-1 text-slate-500 text-[11px] hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNotes(task.id)}
                          className="px-2.5 py-1 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-xs text-[11px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save Findings</span>
                        </button>
                      </div>
                    </div>
                  ) : task.notes ? (
                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xs border border-slate-200 dark:border-slate-700">
                      {task.notes}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No notes recorded yet.</p>
                  )}
                </div>

                {/* Status Toggle Action Buttons */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Update Status:</span>

                  <div className="flex items-center gap-1.5">
                    {task.status !== 'In Progress' && task.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(task, 'In Progress')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-300 dark:border-blue-800 rounded-xs cursor-pointer transition"
                      >
                        Start Work
                      </button>
                    )}

                    {task.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(task, 'Completed')}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs cursor-pointer transition flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Completed</span>
                      </button>
                    )}

                    {task.status === 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(task, 'In Progress')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:underline"
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
