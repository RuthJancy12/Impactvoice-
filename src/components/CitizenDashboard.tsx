import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  MapPin,
  Plus,
  RefreshCw,
  ThumbsUp,
  WifiOff,
} from 'lucide-react';
import { AppNotification, IssueCategory, IssueReport, ScreenId, UserProfile } from '../types';
import { ISSUE_CATEGORIES } from '../mockData';
import { ResilientImage } from './ResilientImage';
import { PriorityIndicator, StatusIndicator } from './StatusIndicators';

interface CitizenDashboardProps {
  user: UserProfile;
  reports: IssueReport[];
  notifications: AppNotification[];
  isOnline: boolean;
  onNavigate: (screen: ScreenId, reportId?: string) => void;
  onSelectCategoryForReport: (category: IssueCategory) => void;
  onToggleUpvote: (reportId: string) => void;
  onSyncOfflineQueue: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  user,
  reports,
  notifications,
  isOnline,
  onNavigate,
  onSelectCategoryForReport,
  onToggleUpvote,
  onSyncOfflineQueue,
}) => {
  const totalReports = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'Pending').length;
  const inProgressCount = reports.filter((r) => r.status === 'In Progress').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const criticalCount = reports.filter((r) => r.priority === 'Critical').length;
  const offlineQueuedCount = reports.filter((r) => r.isOfflineQueued).length;
  const unreadNotifs = notifications.filter((n) => !n.read);

  const categoryStats = ISSUE_CATEGORIES.map((cat) => {
    const count = reports.filter((r) => r.category === cat.category).length;
    const pct = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
    return { ...cat, count, pct };
  });

  const recentReports = reports.slice(0, 6);

  return (
    <div className="space-y-10 pb-12">
      {/* Welcome & Primary Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Thoothukudi Civic Workspace</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-sky-600 dark:text-sky-400">
              {user.location || 'Bryant Nagar'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{user.ward}</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('report-issue')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report an Issue</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('my-reports')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>All Reports ({totalReports})</span>
          </button>
        </div>
      </div>

      {/* Offline Queue Alert Banner if any reports are queued or offline */}
      {(offlineQueuedCount > 0 || !isOnline) && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {!isOnline
                  ? 'Offline Mode Active — Local Device Storage Enabled'
                  : `${offlineQueuedCount} Offline Report(s) Ready to Sync`}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {!isOnline
                  ? 'You can continue inspecting cached reports and submitting new field issues. They will automatically upload when connectivity returns.'
                  : 'Connection restored. Sync your locally saved reports to the municipal dispatch queue.'}
              </p>
            </div>
          </div>
          {isOnline && offlineQueuedCount > 0 && (
            <button
              type="button"
              onClick={onSyncOfflineQueue}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-500 transition-colors whitespace-nowrap cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Now ({offlineQueuedCount})</span>
            </button>
          )}
        </div>
      )}

      {/* Enhanced Dashboard KPI Strip: Total Reports, Pending, In Progress, Resolved, Critical Issues */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div
          onClick={() => onNavigate('my-reports')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500 transition-colors cursor-pointer"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Reports</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalReports}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Thoothukudi civic ledger
          </p>
        </div>

        <div
          onClick={() => onNavigate('my-reports')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 transition-colors cursor-pointer"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {pendingCount}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Awaiting field crew dispatch
          </p>
        </div>

        <div
          onClick={() => onNavigate('my-reports')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500 transition-colors cursor-pointer"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">In Progress</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
            {inProgressCount}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Active department repair
          </p>
        </div>

        <div
          onClick={() => onNavigate('my-reports')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 transition-colors cursor-pointer"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Resolved</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {resolvedCount}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Completed & verified
          </p>
        </div>

        <div
          onClick={() => onNavigate('my-reports')}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-500 transition-colors cursor-pointer col-span-2 sm:col-span-1"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Critical Issues</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
            {criticalCount}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Urgent safety priority
          </p>
        </div>
      </section>

      {/* Quick Issue Category Launcher (All 7 Required Categories with Department Routing) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Quick Issue Launcher & Automatic Department Routing
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a category to automatically route your report to the responsible Thoothukudi department.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {ISSUE_CATEGORIES.map((cat) => (
            <button
              key={cat.category}
              type="button"
              onClick={() => {
                onSelectCategoryForReport(cat.category);
                onNavigate('report-issue');
              }}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500 dark:hover:border-sky-500 text-left transition-colors cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <p className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 truncate">
                  {cat.department}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400">
                  {cat.category}
                </p>
              </div>
              <p className="mt-3 text-xs text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                <span>Report</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Main Two-Column Feed: Recent Reports + Issue Statistics & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Recent Reports */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Reports in Thoothukudi
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('my-reports')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Filter & Search All ({reports.length}) →
            </button>
          </div>

          <div className="space-y-4">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {report.imageUrl && (
                    <div
                      onClick={() => onNavigate('report-details', report.id)}
                      className="sm:w-36 h-28 rounded-lg overflow-hidden shrink-0 cursor-pointer bg-slate-100 dark:bg-slate-800"
                    >
                      <ResilientImage
                        src={report.imageUrl}
                        alt={report.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                        {report.referenceCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {report.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
                        <Building2 className="w-3 h-3" />
                        <span>{report.assignedDepartment}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {report.createdAt.replace('T', ' ').slice(0, 16)}
                      </span>
                    </div>

                    <h3
                      onClick={() => onNavigate('report-details', report.id)}
                      className="mt-1.5 text-base font-semibold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer"
                    >
                      {report.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {report.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <StatusIndicator status={report.status} />
                        <PriorityIndicator priority={report.priority} />
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                          <span>{report.location}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleUpvote(report.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono tabular-nums rounded-md border transition-colors cursor-pointer ${
                            report.userUpvoted
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{report.upvotes}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('report-details', report.id)}
                          className="px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                        >
                          Inspect →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Issue Statistics & Recent Notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Issue Statistics Breakdown */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Issue Statistics by Category
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {totalReports} total
              </span>
            </div>

            <div className="space-y-3">
              {categoryStats.map((stat) => (
                <div key={stat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {stat.category}{' '}
                      <span className="text-slate-400 dark:text-slate-500">
                        ({stat.department})
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {stat.count} ({stat.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-600 dark:bg-sky-500 rounded-full"
                      style={{ width: `${Math.max(stat.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Updates ({unreadNotifs.length} unread)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('notifications')}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                All ({notifications.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.reportId) {
                      onNavigate('report-details', n.reportId);
                    } else {
                      onNavigate('notifications');
                    }
                  }}
                  className="py-3 first:pt-0 last:pb-0 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className={!n.read ? 'font-semibold text-sky-600 dark:text-sky-400' : ''}>
                      {!n.read ? 'New Update' : 'Read'}
                    </span>
                    <span className="font-mono tabular-nums">{n.timestamp}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400">
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Firebase Firestore + Offline Sync</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Reports are synced with Firebase Firestore and cached locally so you can inspect statuses or log Thoothukudi civic issues anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
