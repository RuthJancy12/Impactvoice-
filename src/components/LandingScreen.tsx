import React from 'react';
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, WifiOff } from 'lucide-react';
import { IssueReport, ScreenId } from '../types';
import { ASSETS, ISSUE_CATEGORIES } from '../mockData';
import { ResilientImage } from './ResilientImage';
import { PriorityIndicator, StatusIndicator } from './StatusIndicators';

interface LandingScreenProps {
  reports: IssueReport[];
  onNavigate: (screen: ScreenId, reportId?: string) => void;
  onSelectCategoryForReport: (category: IssueReport['category']) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  reports,
  onNavigate,
  onSelectCategoryForReport,
}) => {
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length + 4278;
  const recentReports = reports.slice(0, 3);

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900">
        <div className="relative h-[480px] md:h-[540px] w-full">
          <ResilientImage
            src={ASSETS.heroCivic}
            alt="Thoothukudi municipal streetscape at golden hour"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/20" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16 max-w-4xl">
            <p className="text-xs font-medium text-sky-400 tracking-wide mb-3">
              Thoothukudi Civic Issue Reporting & Automated Department Dispatch · Zones 1–4
            </p>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              Report Thoothukudi civic infrastructure issues and track every dispatch to resolution.
            </h1>
            <p className="mt-4 text-base md:text-lg text-slate-200 max-w-2xl leading-relaxed">
              ImpactVoice connects residents across Millerpuram, Bryant Nagar, Beach Road, SIPCOT, and all Thoothukudi wards directly with TWAD Board, TANGEDCO, Highways Department, Sanitation Department, and Thoothukudi Corporation.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('report-issue')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Submit Field Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('citizen-dashboard')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-100 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Open Resident Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin-dashboard')}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Municipal Dispatch Console →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Capabilities & Issue Categories */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Automatic Department Routing
            </p>
            <h2
              className="mt-1 text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Seven Thoothukudi civic categories routed automatically to the responsible authority
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Select any category below to launch a pre-configured field report routed directly to TWAD Board, TANGEDCO, Highways, Sanitation, or Thoothukudi Corporation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ISSUE_CATEGORIES.map((item, idx) => (
            <div
              key={item.category}
              onClick={() => {
                onSelectCategoryForReport(item.category);
                onNavigate('report-issue');
              }}
              className={`group p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500 dark:hover:border-sky-500 transition-colors cursor-pointer flex flex-col justify-between ${
                idx === 0 || idx === 3 ? 'md:col-span-2' : 'md:col-span-1'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-mono tabular-nums">
                    0{idx + 1}. {item.department}
                  </span>
                  <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">
                    Target SLA: {item.slaHours}h
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {item.category}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>
                  Report {item.category} → {item.department}
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Proof of Impact / Quantified Municipal Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-y border-slate-200 dark:border-slate-800 py-12">
        <div className="lg:col-span-5 space-y-4">
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
            Verified Municipal Ledger · Thoothukudi Smart City Operations
          </p>
          <h2
            className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Measurable reductions in Thoothukudi civic repair backlogs
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Every submission generates a permanent reference number, routes to the exact department, and maintains a live Firestore status timeline until resolved.
          </p>
          <div className="pt-2 space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>01. Real Thoothukudi locality pins with automatic department routing</span>
            </div>
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>02. Firebase Firestore cloud sync with offline-ready local backup</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>03. Transparent status tracking across Pending, In Progress, and Resolved</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Completed Field Repairs (Last 12 Months)
            </p>
            <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {resolvedCount.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              +38% faster department dispatch across Thoothukudi
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Median TWAD Water Leakage Isolation Time
            </p>
            <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              4.2 hrs
            </p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Direct routing to TWAD Board & Corporation engineering squads
            </p>
          </div>

          <div className="sm:col-span-2 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <blockquote className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              “With automated routing between Thoothukudi Corporation, TWAD Board, TANGEDCO, Highways, and Sanitation, citizen complaints from Millerpuram to Harbour Area reach the right field engineer immediately with clear priority tags.”
            </blockquote>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-900 dark:text-white font-semibold">
                  Thoothukudi Civic Operations Cell
                </strong>{' '}
                · Municipal Dispatch Coordination
              </span>
              <span className="font-mono tabular-nums">94.2% Resident Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Public Resolution Feed */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Recent Thoothukudi Dispatches
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click any report to inspect field photos, assigned department, and status timeline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('my-reports')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap cursor-pointer"
          >
            <span>View Full Public Ledger ({reports.length} active records)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentReports.map((report) => (
            <article
              key={report.id}
              onClick={() => onNavigate('report-details', report.id)}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-sky-500 dark:hover:border-sky-500 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <ResilientImage
                    src={report.imageUrl}
                    alt={report.title}
                    fallbackLabel={`${report.category} — ${report.location}`}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-mono tabular-nums">{report.referenceCode}</span>
                    <span aria-hidden="true">·</span>
                    <span>{report.category}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
                    {report.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {report.location} · {report.assignedDepartment}
                    </span>
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <StatusIndicator status={report.status} />
                <PriorityIndicator priority={report.priority} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
