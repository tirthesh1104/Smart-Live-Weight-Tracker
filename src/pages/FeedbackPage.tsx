import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  MessageSquarePlus,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  User,
  ShieldCheck,
  FileText,
  Tag,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Building,
  GraduationCap,
  Briefcase,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  FeedbackSubmission,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
  UserRole
} from '../types';
import { FeedbackService, SubmitFeedbackPayload } from '../services/feedbackService';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';

export const FeedbackPage: React.FC = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const { t } = useLanguage();

  // Active tab: 'submit' | 'my_tickets' | 'admin_console'
  const [activeTab, setActiveTab] = useState<'submit' | 'my_tickets' | 'admin_console'>(
    isAdmin ? 'admin_console' : 'submit'
  );

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('General Feedback');
  const [description, setDescription] = useState('');
  const [relatedModule, setRelatedModule] = useState('Passenger Portal');
  const [priority, setPriority] = useState<FeedbackPriority>('Medium');
  const [userRole, setUserRole] = useState<UserRole>(user?.role || 'passenger');
  const [userName, setUserName] = useState(user?.full_name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessTicket, setSubmitSuccessTicket] = useState<string | null>(null);

  // Tickets List State
  const [allTickets, setAllTickets] = useState<FeedbackSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | FeedbackStatus>('All');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | FeedbackCategory>('All');
  const [selectedTicket, setSelectedTicket] = useState<FeedbackSubmission | null>(null);

  // Admin Response Modal / Editor State
  const [adminStatusInput, setAdminStatusInput] = useState<FeedbackStatus>('Under Review');
  const [adminResponseInput, setAdminResponseInput] = useState('');
  const [assignedToInput, setAssignedToInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load Tickets
  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const tickets = await FeedbackService.getAllFeedback();
      setAllTickets(tickets);
    } catch (err) {
      console.error('Failed to load feedback tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Sync user info if auth changes
  useEffect(() => {
    if (user) {
      setUserRole(user.role);
      if (!userName) setUserName(user.full_name || '');
      if (!userEmail) setUserEmail(user.email || '');
    }
  }, [user]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !userName.trim() || !userEmail.trim()) {
      alert('Please fill in all mandatory fields (Name, Email, Title, Description).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SubmitFeedbackPayload = {
        title,
        category,
        description,
        related_module: relatedModule,
        priority,
        user_name: userName,
        user_email: userEmail,
        user_role: userRole,
        user_id: user?.id,
        attachment_url: attachmentUrl.trim() || undefined
      };

      const result = await FeedbackService.submitFeedback(payload);
      setSubmitSuccessTicket(result.ticket_id);
      setTitle('');
      setDescription('');
      setAttachmentUrl('');
      await loadTickets();
    } catch (err) {
      console.error('Submission error:', err);
      alert('An error occurred while submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Admin Update
  const handleAdminUpdate = async (ticketId: string) => {
    if (!selectedTicket) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await FeedbackService.updateFeedback(ticketId, {
        status: adminStatusInput,
        admin_response: adminResponseInput.trim() || selectedTicket.admin_response,
        admin_responder_name: user?.full_name || 'Central Systems Administrator',
        assigned_to_name: assignedToInput.trim() || selectedTicket.assigned_to_name
      });

      if (updated) {
        setSelectedTicket(updated);
        await loadTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filtered Tickets
  const stats = FeedbackService.getStatistics();
  const myTickets = allTickets.filter(t => {
    if (user?.id && t.user_id === user.id) return true;
    if (userEmail && t.user_email?.toLowerCase() === userEmail.toLowerCase()) return true;
    return false;
  });

  const ticketsToDisplay = activeTab === 'my_tickets' ? myTickets : allTickets;
  const filteredTickets = ticketsToDisplay.filter(t => {
    const matchesSearch =
      t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesRole = roleFilter === 'All' || t.user_role === roleFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesRole && matchesCategory;
  });

  // Status Badge Helper
  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'Under Review':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'In Progress':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'Awaiting Information':
        return 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      case 'Resolved':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Closed':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'Rejected':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getPriorityBadge = (p: FeedbackPriority) => {
    switch (p) {
      case 'Critical':
        return 'bg-rose-100 text-rose-900 border-rose-400 font-bold';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />;
      case 'staff':
        return <Briefcase className="w-3.5 h-3.5 text-blue-600" />;
      case 'faculty':
        return <GraduationCap className="w-3.5 h-3.5 text-purple-600" />;
      case 'passenger':
      default:
        return <User className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-5 py-4">
      {/* Page Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Indian Railways Portal Services &bull; Issue &amp; Suggestion Desk
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Feedback, Suggestions &amp; Grievance Resolution Portal
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Centralized communications platform for Passengers, Railway Staff, Faculty, and Administrators.
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-sm border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          title="Refresh latest ticket statuses"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 gov-card flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Tickets
            </div>
            <div className="text-xl font-bold font-tabular tabular-nums text-slate-900 dark:text-slate-100">
              {stats.total}
            </div>
          </div>
          <div className="w-8 h-8 rounded-sm bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 gov-card flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Under Review
            </div>
            <div className="text-xl font-bold font-tabular tabular-nums text-amber-700 dark:text-amber-400">
              {stats.underReview}
            </div>
          </div>
          <div className="w-8 h-8 rounded-sm bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 gov-card flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              In Progress
            </div>
            <div className="text-xl font-bold font-tabular tabular-nums text-purple-700 dark:text-purple-400">
              {stats.inProgress}
            </div>
          </div>
          <div className="w-8 h-8 rounded-sm bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center">
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 gov-card flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Resolved &amp; Closed
            </div>
            <div className="text-xl font-bold font-tabular tabular-nums text-emerald-700 dark:text-emerald-400">
              {stats.resolved + stats.closed}
            </div>
          </div>
          <div className="w-8 h-8 rounded-sm bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-300 dark:border-slate-700 gap-1">
        <button
          onClick={() => setActiveTab('submit')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'submit'
              ? 'border-[#003366] text-[#003366] dark:border-blue-400 dark:text-blue-300 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Submit Feedback / Report Issue</span>
        </button>

        <button
          onClick={() => setActiveTab('my_tickets')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'my_tickets'
              ? 'border-[#003366] text-[#003366] dark:border-blue-400 dark:text-blue-300 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Submissions ({myTickets.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin_console')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'admin_console'
                ? 'border-[#003366] text-[#003366] dark:border-blue-400 dark:text-blue-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Admin Management Console ({allTickets.length})</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: SUBMISSION FORM */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'submit' && (
        <div className="gov-card p-5 space-y-4 max-w-4xl">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
            <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-[#003366] dark:text-blue-400" />
              New Feedback / Grievance Submission
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Please provide clear and descriptive details. Every submission receives a tracking ID for follow-up.
            </p>
          </div>

          {submitSuccessTicket && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Feedback Registered Successfully!</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Your tracking ticket number is{' '}
                <strong className="font-mono text-emerald-800 dark:text-emerald-300 font-bold">
                  {submitSuccessTicket}
                </strong>
                . Central operations and administration have been alerted. You can monitor progress under the{' '}
                <strong>My Submissions</strong> tab.
              </p>
              <div className="pt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('my_tickets');
                    setSubmitSuccessTicket(null);
                  }}
                  className="px-3 py-1 bg-emerald-700 text-white text-xs font-semibold rounded-sm hover:bg-emerald-800 transition"
                >
                  Track My Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitSuccessTicket(null)}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-sm"
                >
                  Submit Another Report
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role & Submitter Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Submitting Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="passenger">Passenger / Commuter</option>
                  <option value="staff">Railway Staff / Station Master</option>
                  <option value="faculty">Faculty / Academic Guide</option>
                  <option value="admin">Railway Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Category, Module & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Feedback Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="General Feedback">General Feedback</option>
                  <option value="Technical Problem">Technical Problem</option>
                  <option value="Login or Registration Issue">Login or Registration Issue</option>
                  <option value="Train Information Issue">Train Information Issue</option>
                  <option value="Coach Monitoring Issue">Coach Monitoring Issue</option>
                  <option value="Weight Simulation Issue">Weight Simulation Issue</option>
                  <option value="AI Prediction Issue">AI Prediction Issue</option>
                  <option value="Dashboard Issue">Dashboard Issue</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Improvement Suggestion">Improvement Suggestion</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Related Application Module
                </label>
                <select
                  value={relatedModule}
                  onChange={(e) => setRelatedModule(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="Passenger Portal">Passenger Portal (#/passenger)</option>
                  <option value="Staff Operations">Staff Operations (#/staff)</option>
                  <option value="Admin Center">Admin Operations (#/admin)</option>
                  <option value="Weight Simulator">Weight Simulator (#/simulator)</option>
                  <option value="AI Predictions">AI Predictions / Forecasting</option>
                  <option value="Railway Explorer">All-India Railway Explorer</option>
                  <option value="Platform Display">Station Platform Display (#/display)</option>
                  <option value="Operational Reports">Operational Reports (#/reports)</option>
                  <option value="Auth / Accounts">Auth / Registration / Security PIN</option>
                  <option value="General">General / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Low">Low – Non-urgent suggestion / enquiry</option>
                  <option value="Medium">Medium – Standard issue or question</option>
                  <option value="High">High – Operational discrepancy / bug</option>
                  <option value="Critical">Critical – Safety alert or blocking failure</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Summary / Issue Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary of the suggestion, discrepancy, or technical issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe what occurred, expected outcome, train/coach number (if applicable), and steps to reproduce..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
              />
              <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right mt-0.5">
                {description.length} characters
              </div>
            </div>

            {/* Attachment Reference URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional Screenshot or Reference URL
              </label>
              <input
                type="text"
                placeholder="Optional link to screenshot or diagnostic reference log (e.g. https://... or docs/...)"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Official grievance protocol governed by Indian Railways IT Standards.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-sm flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Registering...' : 'Submit Feedback Ticket'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2 & 3: TICKET LISTING & ADMIN CONSOLE */}
      {/* ------------------------------------------------------------- */}
      {(activeTab === 'my_tickets' || activeTab === 'admin_console') && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="gov-card p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-1 min-w-[200px] items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket ID, title, submitter, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-800 dark:text-slate-200"
                >
                  <option value="All">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Information">Awaiting Information</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Role Filter (Admin Only) */}
              {activeTab === 'admin_console' && (
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All Roles</option>
                    <option value="passenger">Passenger</option>
                    <option value="staff">Staff</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              {/* Category Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-800 dark:text-slate-200"
                >
                  <option value="All">All Categories</option>
                  <option value="General Feedback">General Feedback</option>
                  <option value="Technical Problem">Technical Problem</option>
                  <option value="Coach Monitoring Issue">Coach Monitoring Issue</option>
                  <option value="Weight Simulation Issue">Weight Simulation Issue</option>
                  <option value="AI Prediction Issue">AI Prediction Issue</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Improvement Suggestion">Improvement Suggestion</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table / List */}
          <div className="gov-card overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300 flex items-center justify-between">
              <span>
                {activeTab === 'admin_console' ? 'All Received Feedback' : 'My Registered Feedback'} ({filteredTickets.length})
              </span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 normal-case">
                Click any ticket to inspect details or administrative resolution
              </span>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No feedback tickets match the selected filters.
                </p>
                <p className="text-slate-400">
                  Switch to the "Submit Feedback" tab to register a new report.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setAdminStatusInput(ticket.status);
                      setAdminResponseInput(ticket.admin_response || '');
                      setAssignedToInput(ticket.assigned_to_name || '');
                    }}
                    className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#002244] dark:text-blue-300">
                          {ticket.ticket_id}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border uppercase font-tabular tabular-nums ${getStatusBadge(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`px-1.5 py-0.2 text-[9px] uppercase rounded-xs border ${getPriorityBadge(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xs border border-slate-300 dark:border-slate-700">
                          {ticket.category}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {ticket.title}
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                        {ticket.description}
                      </div>

                      {ticket.admin_response && (
                        <div className="text-[11px] bg-blue-50/80 dark:bg-blue-950/40 border-l-2 border-[#003366] dark:border-blue-400 p-2 rounded-r-sm text-slate-700 dark:text-slate-300 mt-1">
                          <strong className="text-[#002244] dark:text-blue-200">Admin Response:</strong> {ticket.admin_response}
                        </div>
                      )}
                    </div>

                    {/* Submitter & Date Info */}
                    <div className="w-full md:w-56 shrink-0 text-right text-[11px] text-slate-500 dark:text-slate-400 flex md:flex-col items-center md:items-end justify-between gap-1">
                      <div className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                        {getRoleIcon(ticket.user_role)}
                        <span>{ticket.user_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(ticket.created_at).toLocaleDateString()} {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {ticket.assigned_to_name && (
                        <div className="text-[10px] text-purple-700 dark:text-purple-300">
                          Assigned: {ticket.assigned_to_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TICKET DETAIL & RESOLUTION MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm max-w-2xl w-full p-5 space-y-4 shadow-xl my-8">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#002244] dark:text-blue-300">
                    {selectedTicket.ticket_id}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border uppercase font-tabular tabular-nums ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`px-1.5 py-0.2 text-[9px] uppercase rounded-xs border ${getPriorityBadge(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedTicket.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold px-2 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Ticket Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-3 rounded-sm border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-slate-400 uppercase text-[9px] font-bold">Category</div>
                <div className="font-medium text-slate-800 dark:text-slate-200">{selectedTicket.category}</div>
              </div>
              <div>
                <div className="text-slate-400 uppercase text-[9px] font-bold">Related Module</div>
                <div className="font-medium text-slate-800 dark:text-slate-200">{selectedTicket.related_module}</div>
              </div>
              <div>
                <div className="text-slate-400 uppercase text-[9px] font-bold">Submitter Role</div>
                <div className="font-medium text-slate-800 dark:text-slate-200 capitalize">{selectedTicket.user_role}</div>
              </div>
              <div>
                <div className="text-slate-400 uppercase text-[9px] font-bold">Submitted Date</div>
                <div className="font-mono text-slate-700 dark:text-slate-300">
                  {new Date(selectedTicket.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Grievance / Feedback Content
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-sm text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.description}
              </div>
            </div>

            {/* Attachment if present */}
            {selectedTicket.attachment_url && (
              <div className="text-xs flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Reference:</span>
                <a
                  href={selectedTicket.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <span>{selectedTicket.attachment_url}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Official Administrative Response Block */}
            {selectedTicket.admin_response && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-sm space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Administrative Resolution</span>
                  </span>
                  {selectedTicket.admin_responder_name && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      By: {selectedTicket.admin_responder_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {selectedTicket.admin_response}
                </p>
                {selectedTicket.resolved_at && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono pt-1">
                    Resolved at: {new Date(selectedTicket.resolved_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* ADMIN ACTIONS: Only rendered if Administrator */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Administrative Resolution Desk (Restricted Clearance)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Update Issue Status
                    </label>
                    <select
                      value={adminStatusInput}
                      onChange={(e) => setAdminStatusInput(e.target.value as FeedbackStatus)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Awaiting Information">Awaiting Information</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assign to Staff Wing / Officer
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rolling Stock Maintenance, Dadar"
                      value={assignedToInput}
                      onChange={(e) => setAssignedToInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Administrator Response / Action Taken
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide official resolution note, inspection findings, or technical remedial actions..."
                    value={adminResponseInput}
                    onChange={(e) => setAdminResponseInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-sm transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleAdminUpdate(selectedTicket.ticket_id)}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isUpdatingStatus ? 'Updating...' : 'Save Resolution & Dispatch'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
