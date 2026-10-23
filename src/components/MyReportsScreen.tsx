import React, { useState } from 'react';
import {
  Building2,
  Download,
  MapPin,
  Plus,
  Search,
  ThumbsUp,
} from 'lucide-react';
import {
  IssueCategory,
  IssueReport,
  PriorityLevel,
  ReportStatus,
  ScreenId,
  UserProfile,
} from '../types';
import { ISSUE_CATEGORIES, THOOTHUKUDI_LOCATIONS } from '../mockData';
import { ResilientImage } from './ResilientImage';
import { PriorityIndicator, StatusIndicator } from './StatusIndicators';

interface MyReportsScreenProps {
  user: UserProfile;
  reports: IssueReport[];
  onNavigate: (screen: ScreenId, reportId?: string) => void;
  onToggleUpvote: (reportId: string) => void;
}

export const MyReportsScreen: React.FC<MyReportsScreenProps> = ({
  user,
  reports,
  onNavigate,
  onToggleUpvote,
}) => {
  const [scope, setScope] = useState<'mine' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'All'>('All');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'All'>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');

  const filteredReports = reports.filter((report) => {
    if (
      scope === 'mine' &&
      report.reporterId !== user.id &&
      report.userId !== user.id &&
      report.reporterName !== user.name
    ) {
      return false;
    }
    if (selectedCategory !== 'All' && report.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'All' && report.status !== selectedStatus) {
      return false;
    }
    if (selectedPriority !== 'All' && report.priority !== selectedPriority) {
      return false;
    }
    if (
      selectedLocation !== 'All' &&
      !report.location.toLowerCase().includes(selectedLocation.toLowerCase())
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = report.title.toLowerCase().includes(q);
      const matchDesc = report.description.toLowerCase().includes(q);
      const matchLoc = report.location.toLowerCase().includes(q);
      const matchRef = report.referenceCode.toLowerCase().includes(q);
      const matchCat = report.category.toLowerCase().includes(q);
      const matchDept = report.assignedDepartment.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchLoc || matchRef || matchCat || matchDept;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Reference',
      'Category',
      'Department',
      'Priority',
      'Status',
      'Location',
      'Created At',
    ];
    const rows = filteredReports.map((r) => [
      r.referenceCode,
      r.category,
      `"${r.assignedDepartment}"`,
      r.priority,
      r.status,
      `"${r.location}"`,
      r.createdAt,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thoothukudi_reports_${scope}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mySubmissionCount = reports.filter(
    (r) => r.reporterId === user.id || r.userId === user.id || r.reporterName === user.name
  ).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
            Thoothukudi Civic Ledger & Firestore Report Explorer
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Reports & Neighborhood Tracker
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report-issue')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          {/* Segmented Scope Selector */}
          <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 self-start">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                scope === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Thoothukudi Reports ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setScope('mine')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                scope === 'mine'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              My Submissions ({mySubmissionCount})
            </button>
          </div>

          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, location (e.g. Millerpuram), department, or ID..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Category, Priority, Status & Location Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as IssueCategory | 'All')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="All">All 7 Categories</option>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as PriorityLevel | 'All')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | 'All')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Thoothukudi Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="All">All 13 Locations</option>
              {THOOTHUKUDI_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results List or Empty State */}
      {filteredReports.length === 0 ? (
        <div className="p-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            No matching issue reports found
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try clearing your search or location filters, or log a new Thoothukudi civic report directly.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSelectedPriority('All');
                setSelectedLocation('All');
                setScope('all');
              }}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => onNavigate('report-issue')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 cursor-pointer"
            >
              Log New Report
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <article
              key={report.id}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/70 transition-colors"
            >
              <div className="flex flex-col md:flex-row gap-5">
                {report.imageUrl && (
                  <div
                    onClick={() => onNavigate('report-details', report.id)}
                    className="md:w-44 h-32 rounded-lg overflow-hidden shrink-0 cursor-pointer bg-slate-100 dark:bg-slate-800"
                  >
                    <ResilientImage
                      src={report.imageUrl}
                      alt={report.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                        {report.referenceCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {report.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{report.assignedDepartment}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Created {report.createdAt.replace('T', ' ').slice(0, 16)}
                      </span>
                    </div>

                    <h2
                      onClick={() => onNavigate('report-details', report.id)}
                      className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer"
                    >
                      {report.title}
                    </h2>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <StatusIndicator status={report.status} />
                      <PriorityIndicator priority={report.priority} />
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                        <span>{report.location}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleUpvote(report.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border transition-colors cursor-pointer ${
                          report.userUpvoted
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Confirm ({report.upvotes})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate('report-details', report.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-sky-600 rounded-lg hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
