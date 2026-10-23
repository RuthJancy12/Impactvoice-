import React, { useState } from 'react';
import {
  Download,
  Filter,
  Search,
} from 'lucide-react';
import {
  IssueCategory,
  IssueReport,
  PriorityLevel,
  ReportStatus,
  ScreenId,
} from '../types';
import { ISSUE_CATEGORIES, MUNICIPAL_CREWS, THOOTHUKUDI_LOCATIONS } from '../mockData';
import { PriorityIndicator, StatusIndicator } from './StatusIndicators';

interface AdminDashboardProps {
  reports: IssueReport[];
  onNavigate: (screen: ScreenId, reportId?: string) => void;
  onUpdateReportStatus: (
    reportId: string,
    status: ReportStatus,
    crew: string,
    priority: PriorityLevel,
    note: string
  ) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reports,
  onNavigate,
  onUpdateReportStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'All'>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');

  const totalReports = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'Pending').length;
  const inProgressCount = reports.filter((r) => r.status === 'In Progress').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const criticalCount = reports.filter((r) => r.priority === 'Critical').length;

  const filteredReports = reports.filter((r) => {
    if (departmentFilter !== 'All' && r.assignedDepartment !== departmentFilter) return false;
    if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && r.priority !== priorityFilter) return false;
    if (
      locationFilter !== 'All' &&
      !r.location.toLowerCase().includes(locationFilter.toLowerCase())
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.referenceCode.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.assignedDepartment.toLowerCase().includes(q) ||
        r.reporterName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categoryCounts = ISSUE_CATEGORIES.map((cat) => {
    const count = reports.filter((r) => r.category === cat.category).length;
    const pct = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
    return { ...cat, count, pct };
  });

  const handleExportDispatchCSV = () => {
    const headers = [
      'Reference',
      'Category',
      'Department',
      'Priority',
      'Status',
      'Location',
      'Assigned Crew',
      'Upvotes',
    ];
    const rows = filteredReports.map((r) => [
      r.referenceCode,
      r.category,
      `"${r.assignedDepartment}"`,
      r.priority,
      r.status,
      `"${r.location}"`,
      `"${r.assignedCrew || 'Unassigned'}"`,
      r.upvotes,
    ]);
    const csv =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'thoothukudi_dispatch_queue.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-14">
      {/* Top Bar Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
            Thoothukudi Municipal Corporation · Multi-Department Dispatch Console
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Admin & Department Dispatch Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportDispatchCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Queue CSV</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report-issue')}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors cursor-pointer"
          >
            + Log Field Inspection
          </button>
        </div>
      </div>

      {/* High-Density KPI Strip (Total Reports, Pending, In Progress, Resolved, Critical Issues) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Reports</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalReports}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            All Thoothukudi zones
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {pendingCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Awaiting assignment
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">In Progress</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
            {inProgressCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Crews deployed in field
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Resolved</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {resolvedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Verified closures
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Critical Issues</p>
          <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
            {criticalCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Emergency priority
          </p>
        </div>
      </section>

      {/* Category Distribution Breakdown & Department Units */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Issue Statistics by Category & Routed Department
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Click any bar to filter dispatch table
            </span>
          </div>

          <div className="space-y-3">
            {categoryCounts.map((item) => (
              <div
                key={item.category}
                onClick={() =>
                  setCategoryFilter(
                    categoryFilter === item.category ? 'All' : item.category
                  )
                }
                className="group cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                    {item.category}{' '}
                    <span className="font-normal text-slate-500">
                      → {item.department}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {item.count} tickets ({item.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-600 dark:bg-sky-500 rounded-full transition-all"
                    style={{ width: `${Math.max(item.pct, 6)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Active Thoothukudi Field Units
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign any unit directly from the dispatch table below to update Firestore and notify residents.
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {MUNICIPAL_CREWS.filter((c) => c !== 'Unassigned').map((crew) => {
                const assignedCount = reports.filter(
                  (r) => r.assignedCrew === crew && r.status !== 'Resolved'
                ).length;
                return (
                  <div
                    key={crew}
                    className="py-2.5 flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {crew}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {assignedCount} active
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Official Department Assigned Reports Filter Bar */}
      <section className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Official Department View — Assigned Complaints by Authority
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Select a department to inspect its assigned complaints, location, priority, and description
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              'All',
              'TWAD Board',
              'TANGEDCO',
              'Highways Department',
              'Sanitation Department',
              'Thoothukudi Corporation',
            ] as const
          ).map((dept) => {
            const count =
              dept === 'All'
                ? reports.length
                : reports.filter((r) => r.assignedDepartment === dept).length;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setDepartmentFilter(dept)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  departmentFilter === dept
                    ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                }`}
              >
                {dept === 'All' ? 'All Departments' : dept} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Interactive Dispatch Data Grid */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Dispatch Queue ({filteredReports.length} records)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, location, department..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as IssueCategory | 'All')}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="All">All Categories</option>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'All')}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | 'All')}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="All">All Locations</option>
              {THOOTHUKUDI_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Responsive High-Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Issue & Location</th>
                <th className="py-3 px-4">Category & Department</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Crew</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {report.referenceCode}
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <p
                      onClick={() => onNavigate('report-details', report.id)}
                      className="font-semibold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer truncate"
                    >
                      {report.title}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                      {report.description}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                      {report.location} · {report.ward}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {report.category}
                    </p>
                    <p className="text-[11px] text-sky-600 dark:text-sky-400">
                      {report.assignedDepartment}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <PriorityIndicator priority={report.priority} />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <select
                      value={report.assignedCrew || 'Unassigned'}
                      onChange={(e) =>
                        onUpdateReportStatus(
                          report.id,
                          report.status === 'Pending' ? 'In Progress' : report.status,
                          e.target.value,
                          report.priority,
                          `Assigned to ${e.target.value} via Admin Console.`
                        )
                      }
                      className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {MUNICIPAL_CREWS.map((crew) => (
                        <option key={crew} value={crew}>
                          {crew}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <select
                      value={report.status}
                      onChange={(e) =>
                        onUpdateReportStatus(
                          report.id,
                          e.target.value as ReportStatus,
                          report.assignedCrew || 'Unassigned',
                          report.priority,
                          `Status updated to ${e.target.value} by Municipal Dispatch.`
                        )
                      }
                      className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onNavigate('report-details', report.id)}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
