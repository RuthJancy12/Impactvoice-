import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Info,
  Wrench,
} from 'lucide-react';
import { PriorityLevel, ReportStatus } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PriorityIndicator: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  const config: Record<
    PriorityLevel,
    { badgeClass: string; icon: React.ReactNode; label: string }
  > = {
    Critical: {
      badgeClass:
        'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/80 font-semibold',
      icon: <Flame className="w-3.5 h-3.5 shrink-0" />,
      label: 'Critical',
    },
    High: {
      badgeClass:
        'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 font-semibold',
      icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
      label: 'High',
    },
    Medium: {
      badgeClass:
        'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80 font-medium',
      icon: <ArrowUpCircle className="w-3.5 h-3.5 shrink-0" />,
      label: 'Medium',
    },
    Low: {
      badgeClass:
        'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
      icon: <Info className="w-3.5 h-3.5 shrink-0" />,
      label: 'Low',
    },
  };

  const current = config[priority] || config.Medium;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs whitespace-nowrap ${current.badgeClass}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};

export const StatusIndicator: React.FC<{ status: ReportStatus | string }> = ({ status }) => {
  const normalizedStatus: ReportStatus =
    status === 'Resolved'
      ? 'Resolved'
      : status === 'In Progress' || status === 'Scheduled'
      ? 'In Progress'
      : 'Pending';

  const config: Record<
    ReportStatus,
    { badgeClass: string; icon: React.ReactNode; label: string }
  > = {
    Pending: {
      badgeClass:
        'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 font-semibold',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
      label: 'Pending',
    },
    'In Progress': {
      badgeClass:
        'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/80 font-semibold',
      icon: <Wrench className="w-3.5 h-3.5 shrink-0" />,
      label: 'In Progress',
    },
    Resolved: {
      badgeClass:
        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 font-semibold',
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
      label: 'Resolved',
    },
  };

  const current = config[normalizedStatus];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs whitespace-nowrap ${current.badgeClass}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowModal(true);
          }
        }}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer'
            : 'inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap cursor-pointer'
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Install ImpactVoice for Offline Access
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              ImpactVoice is a Progressive Web App (PWA) with service worker caching and offline report queuing for Thoothukudi residents.
            </p>
            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-4">
              <p>
                <strong className="text-slate-900 dark:text-slate-200">Desktop Chrome / Edge:</strong> Click the install icon in your browser address bar or open ImpactVoice in a standalone tab.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-slate-200">iOS Safari:</strong> Tap the <strong>Share</strong> button in the toolbar and choose <strong>Add to Home Screen</strong>.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-sky-600 rounded-lg hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
