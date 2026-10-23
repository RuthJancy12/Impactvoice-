import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Send,
  ThumbsUp,
  User,
  Wrench,
} from 'lucide-react';
import {
  IssueReport,
  PriorityLevel,
  ReportStatus,
  ScreenId,
  UserProfile,
} from '../types';
import { MUNICIPAL_CREWS } from '../mockData';
import { ResilientImage } from './ResilientImage';
import { PriorityIndicator, StatusIndicator } from './StatusIndicators';

interface ReportDetailsScreenProps {
  report: IssueReport;
  user: UserProfile;
  onNavigate: (screen: ScreenId) => void;
  onToggleUpvote: (reportId: string) => void;
  onAddComment: (reportId: string, message: string) => void;
  onUpdateReportStatus: (
    reportId: string,
    status: ReportStatus,
    crew: string,
    priority: PriorityLevel,
    note: string
  ) => void;
}

export const ReportDetailsScreen: React.FC<ReportDetailsScreenProps> = ({
  report,
  onNavigate,
  onToggleUpvote,
  onAddComment,
  onUpdateReportStatus,
}) => {
  const [commentText, setCommentText] = useState('');
  const [editStatus, setEditStatus] = useState<ReportStatus>(report.status);
  const [editCrew, setEditCrew] = useState<string>(report.assignedCrew || 'Unassigned');
  const [editPriority, setEditPriority] = useState<PriorityLevel>(report.priority);
  const [dispatchNote, setDispatchNote] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setEditStatus(report.status);
    setEditCrew(report.assignedCrew || 'Unassigned');
    setEditPriority(report.priority);
  }, [report.id, report.status, report.assignedCrew, report.priority]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(report.id, commentText.trim());
    setCommentText('');
  };

  const handleDispatchUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateReportStatus(
      report.id,
      editStatus,
      editCrew,
      editPriority,
      dispatchNote.trim() || `Status updated to ${editStatus} (${editCrew}).`
    );
    setDispatchNote('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-8 pb-14">
      {/* Top Breadcrumb & Back Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('my-reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Reports</span>
          </button>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Reference {report.referenceCode}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleUpvote(report.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono tabular-nums rounded-lg border transition-colors cursor-pointer ${
              report.userUpvoted
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>
              {report.userUpvoted ? 'Confirmed by You & ' : 'Confirm Issue ('}
              {report.upvotes} Neighbors{report.userUpvoted ? '' : ')'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Columns: Report Evidence, Metadata Grid & Status Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <StatusIndicator status={report.status} />
              <PriorityIndicator priority={report.priority} />
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {report.category}
              </span>
              <span className="font-mono tabular-nums">
                Created: {report.createdAt.replace('T', ' ').slice(0, 16)}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {report.title}
            </h1>

            <div className="space-y-1.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Issue Description
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {report.description}
              </p>
            </div>

            {report.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 max-h-[380px]">
                <ResilientImage
                  src={report.imageUrl}
                  alt={report.title}
                  className="w-full h-full object-cover max-h-[380px]"
                />
              </div>
            )}

            {/* Structured Issue Metadata: Location, Assigned Department, Reporter, Created Date, Priority, Status */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Location</span>
                </p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {report.location}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{report.ward}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>Assigned Department</span>
                </p>
                <p className="mt-1 font-semibold text-sky-600 dark:text-sky-400">
                  {report.assignedDepartment}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Crew: {report.assignedCrew || 'Pending Assignment'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>Reporter</span>
                </p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {report.reporterName}
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                  ID: {report.userId || report.reporterId}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Created Date</span>
                </p>
                <p className="mt-1 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {report.createdAt.replace('T', ' ').slice(0, 16)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <p className="text-slate-500 dark:text-slate-400 mb-1">Priority</p>
                <PriorityIndicator priority={report.priority} />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <p className="text-slate-500 dark:text-slate-400 mb-1">Current Status</p>
                <StatusIndicator status={report.status} />
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Status Timeline & Dispatch Audit Log
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {report.timeline.length} stage(s)
              </span>
            </div>

            {/* Visual 3-Step Progress Bar: Pending -> In Progress -> Resolved */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              {(['Pending', 'In Progress', 'Resolved'] as ReportStatus[]).map((step, index) => {
                const statusOrder: Record<ReportStatus, number> = {
                  Pending: 0,
                  'In Progress': 1,
                  Resolved: 2,
                };
                const currentIdx = statusOrder[report.status] ?? 0;
                const isReached = index <= currentIdx;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-2 p-2 rounded-lg font-semibold ${
                      isReached
                        ? step === 'Resolved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    <span className="font-mono">0{index + 1}.</span>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-5">
              {report.timeline.map((item, idx) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono tabular-nums ${
                        idx === report.timeline.length - 1
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {idx < report.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
                    )}
                  </div>
                  <div className="pb-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <StatusIndicator status={item.status} />
                      <span className="text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.actor}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resident & Crew Discussion Thread */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Field Notes & Resident Updates ({report.comments.length})</span>
              </h2>
            </div>

            {report.comments.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No neighbor or crew comments posted yet. Add a field observation below.
              </p>
            ) : (
              <div className="space-y-3">
                {report.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {c.authorName}
                        </strong>{' '}
                        · {c.authorRole}
                      </span>
                      <span className="font-mono tabular-nums">{c.timestamp}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {c.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a field update or note for neighbors and dispatch..."
                className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Note</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 4 Columns: Street Pin Map & Municipal Dispatch Update Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Geotagged Street Map Pin */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Thoothukudi Geotagged Pin
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {report.coordinates.lat}° N, {report.coordinates.lng}° E
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950">
              <svg viewBox="0 0 400 200" className="w-full h-40">
                <rect width="400" height="200" className="fill-slate-100 dark:fill-slate-950" />
                <rect x="15" y="15" width="95" height="65" rx="6" className="fill-emerald-500/15" />
                <line x1="0" y1="50" x2="400" y2="50" stroke="#94a3b8" strokeWidth="4" opacity="0.35" />
                <line x1="0" y1="105" x2="400" y2="105" stroke="#94a3b8" strokeWidth="6" opacity="0.45" />
                <line x1="0" y1="160" x2="400" y2="160" stroke="#94a3b8" strokeWidth="4" opacity="0.35" />
                <line x1="85" y1="0" x2="85" y2="200" stroke="#94a3b8" strokeWidth="4" opacity="0.35" />
                <line x1="190" y1="0" x2="190" y2="200" stroke="#94a3b8" strokeWidth="6" opacity="0.45" />
                <line x1="285" y1="0" x2="285" y2="200" stroke="#94a3b8" strokeWidth="4" opacity="0.35" />
                <circle
                  cx={(report.coordinates.mapX / 100) * 400}
                  cy={(report.coordinates.mapY / 100) * 200}
                  r="16"
                  className="fill-sky-500/25"
                />
                <circle
                  cx={(report.coordinates.mapX / 100) * 400}
                  cy={(report.coordinates.mapY / 100) * 200}
                  r="6"
                  className="fill-sky-600 stroke-white stroke-2"
                />
              </svg>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>
                {report.location} · {report.ward}
              </span>
            </p>
          </div>

          {/* Update Report Status Control Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Update Report Status
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update status ({report.assignedDepartment}), assign a field crew, or log an official inspection note to Firestore.
            </p>

            {savedNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Report status & timeline synced.</span>
              </div>
            )}

            <form onSubmit={handleDispatchUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Report Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ReportStatus)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Field Unit
                </label>
                <select
                  value={editCrew}
                  onChange={(e) => setEditCrew(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  {MUNICIPAL_CREWS.map((crew) => (
                    <option key={crew} value={crew}>
                      {crew}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Priority Level
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status Update Note
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder="e.g., TWAD Board engineer inspected site; repair crew dispatched."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 dark:bg-sky-600 rounded-lg hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors cursor-pointer"
              >
                Update Status
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
