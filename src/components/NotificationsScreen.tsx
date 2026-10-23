import React, { useState } from 'react';
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCheck,
  MapPin,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { AppNotification, IssueReport, ScreenId } from '../types';
import { getOfficialForDepartment } from '../mockData';
import { PriorityIndicator, StatusIndicator } from './StatusIndicators';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  reports?: IssueReport[];
  onNavigate: (screen: ScreenId, reportId?: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
}

const DEPARTMENTS = [
  'All Departments',
  'TWAD Board',
  'TANGEDCO',
  'Highways Department',
  'Sanitation Department',
  'Thoothukudi Corporation',
] as const;

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  reports = [],
  onNavigate,
  onMarkAsRead,
  onMarkAllRead,
  onDeleteNotification,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'official' | 'status'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('All Departments');

  const filtered = notifications.filter((n) => {
    if (selectedDept !== 'All Departments' && n.department && n.department !== selectedDept) {
      return false;
    }
    if (filter === 'unread') return !n.read;
    if (filter === 'official') return n.type === 'official' || Boolean(n.department);
    if (filter === 'status') return n.type === 'status' || n.type === 'reply';
    return true;
  });

  const assignedReports = reports.filter((r) =>
    selectedDept === 'All Departments' ? true : r.assignedDepartment === selectedDept
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
            Official Department Notification & Assigned Complaint Feed
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Official Notifications & Assigned Reports ({unreadCount} Unread)
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Respective Thoothukudi department officials can filter by department below to inspect assigned complaints, locations, priorities, and descriptions.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Department Official Selector Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>Filter by Respective Thoothukudi Department Official:</span>
          </div>
          {selectedDept !== 'All Departments' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{getOfficialForDepartment(selectedDept)}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((dept) => {
            const count =
              dept === 'All Departments'
                ? reports.length
                : reports.filter((r) => r.assignedDepartment === dept).length;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                }`}
              >
                {dept} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Assigned Reports for Respective Department Official (Complaint, Location, Priority, Description) */}
      {assignedReports.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Assigned Complaints for {selectedDept} ({assignedReports.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct view for department officials showing complaint title, location, priority, and full description.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedReports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4 hover:border-sky-500/60 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-700 dark:text-sky-300">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{rep.assignedDepartment}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <PriorityIndicator priority={rep.priority} />
                      <StatusIndicator status={rep.status} />
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {rep.referenceCode}
                    </span>
                    <span>·</span>
                    <span>{rep.category}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      <span>{rep.location}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {rep.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rep.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 truncate">
                    Official: {getOfficialForDepartment(rep.assignedDepartment)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('report-details', rep.id)}
                    className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline shrink-0 cursor-pointer"
                  >
                    <span>Open & Update</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notification Alert Feed */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Dispatch Notification Log
          </h2>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg">
            {(
              [
                { id: 'all', label: `All (${notifications.length})` },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'official', label: 'Official Department Alerts' },
                { id: 'status', label: 'Status Updates' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
            <Bell className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              No notifications in this view
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When reports are routed to officials or status updates are logged, they appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !n.read ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span
                      className={
                        !n.read
                          ? 'font-semibold text-sky-600 dark:text-sky-400'
                          : 'text-slate-500'
                      }
                    >
                      {!n.read ? 'New Official Alert' : 'Read'}
                    </span>
                    {n.department && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {n.department}
                        </span>
                      </>
                    )}
                    {n.location && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-600" />
                          <span>{n.location}</span>
                        </span>
                      </>
                    )}
                    {n.priority && (
                      <>
                        <span aria-hidden="true">·</span>
                        <PriorityIndicator priority={n.priority} />
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{n.timestamp}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {n.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.message}
                  </p>

                  {n.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      “{n.description}”
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.reportId && (
                    <button
                      type="button"
                      onClick={() => {
                        onMarkAsRead(n.id);
                        onNavigate('report-details', n.reportId);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors cursor-pointer"
                    >
                      <span>View Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => onMarkAsRead(n.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteNotification(n.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
