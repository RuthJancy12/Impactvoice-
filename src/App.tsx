/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  LogOut,
  Menu,
  Moon,
  Plus,
  Sun,
  WifiOff,
  X,
} from 'lucide-react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  AppNotification,
  IssueCategory,
  IssueReport,
  PriorityLevel,
  ReportStatus,
  ScreenId,
  UserProfile,
} from './types';
import {
  ASSETS,
  getDepartmentForCategory,
  getOfficialForDepartment,
  INITIAL_NOTIFICATIONS,
  INITIAL_REPORTS,
  INITIAL_USER_PROFILE,
  THOOTHUKUDI_LOCATIONS,
} from './mockData';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { LandingScreen } from './components/LandingScreen';
import { AuthScreens } from './components/AuthScreens';
import { CitizenDashboard } from './components/CitizenDashboard';
import { ReportIssueScreen } from './components/ReportIssueScreen';
import { MyReportsScreen } from './components/MyReportsScreen';
import { ReportDetailsScreen } from './components/ReportDetailsScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AdminDashboard } from './components/AdminDashboard';

const STORAGE_KEYS = {
  REPORTS: 'impactvoice_tut_reports_v2',
  NOTIFICATIONS: 'impactvoice_tut_notifications_v2',
  USER: 'impactvoice_tut_user_v2',
  DARK_MODE: 'impactvoice_dark_v1',
};

function normalizeCategory(cat: string): IssueCategory {
  if (cat === 'Roads') return 'Road Damage';
  if (cat === 'Street Lights') return 'Street Light';
  const valid: IssueCategory[] = [
    'Water Leakage',
    'Road Damage',
    'Street Light',
    'Garbage',
    'Drainage',
    'Electricity',
    'Other',
  ];
  return valid.includes(cat as IssueCategory) ? (cat as IssueCategory) : 'Other';
}

function normalizeStatus(st: string): ReportStatus {
  if (st === 'Resolved') return 'Resolved';
  if (st === 'In Progress' || st === 'Scheduled') return 'In Progress';
  return 'Pending';
}

function formatFirestoreTimestamp(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString().slice(0, 16);
  }
  if (typeof val === 'string' && val.length > 0) {
    return val.slice(0, 16);
  }
  return new Date().toISOString().slice(0, 16);
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const [selectedReportId, setSelectedReportId] = useState<string>('rep-101');
  const [preselectedCategory, setPreselectedCategory] =
    useState<IssueCategory>('Water Leakage');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_USER_PROFILE,
          ...parsed,
          location: parsed.location || 'Bryant Nagar',
        };
      }
      return INITIAL_USER_PROFILE;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  });

  const [reports, setReports] = useState<IssueReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (saved) {
        const parsed: IssueReport[] = JSON.parse(saved);
        return parsed.map((r) => {
          const category = normalizeCategory(r.category);
          return {
            ...r,
            category,
            status: normalizeStatus(r.status),
            assignedDepartment: getDepartmentForCategory(category),
          };
        });
      }
      return INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const isOnline = useOnlineStatus(simulatedOffline);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Track Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthReady(true);

      if (fbUser) {
        const userPath = `users/${fbUser.uid}`;
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUser((prev) => ({
              ...prev,
              id: fbUser.uid,
              name: data.name || fbUser.displayName || prev.name,
              email: data.email || fbUser.email || prev.email,
              phone: data.phone || prev.phone,
              location: data.location || prev.location || 'Bryant Nagar',
              ward: data.ward || prev.ward,
              streetAddress: data.streetAddress || prev.streetAddress,
              isAuthenticated: true,
            }));
          } else {
            setUser((prev) => ({
              ...prev,
              id: fbUser.uid,
              name: fbUser.displayName || prev.name,
              email: fbUser.email || prev.email,
              isAuthenticated: true,
            }));
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, userPath);
        }
      }
    });
    return () => unsub();
  }, []);

  // Real-time Firestore listener for public reports when authenticated
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const reportsQuery = query(
      collection(db, 'reports'),
      where('visibility', '==', 'public')
    );

    const unsub = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const firestoreReports: IssueReport[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const category = normalizeCategory(d.category);
          const status = normalizeStatus(d.status);
          const createdStr = formatFirestoreTimestamp(d.createdAt);
          const updatedStr = formatFirestoreTimestamp(d.updatedAt);
          const locMatch =
            THOOTHUKUDI_LOCATIONS.find((l) => l.name === d.location) ||
            THOOTHUKUDI_LOCATIONS[0];

          const baseTimeline = [
            {
              id: `tl-init-${docSnap.id}`,
              status: 'Pending' as ReportStatus,
              timestamp: createdStr.replace('T', ' '),
              actor: `${d.reporterName || 'Resident'} (Reporter)`,
              note: `Report logged in ${d.location}. Automatically routed to ${getDepartmentForCategory(
                category
              )}.`,
            },
          ];

          if (status !== 'Pending' || d.lastStatusNote) {
            baseTimeline.push({
              id: `tl-upd-${docSnap.id}`,
              status,
              timestamp: updatedStr.replace('T', ' '),
              actor: d.assignedDepartment || getDepartmentForCategory(category),
              note:
                d.lastStatusNote ||
                `Status updated to ${status} (${d.assignedCrew || 'Assigned Unit'}).`,
            });
          }

          return {
            id: docSnap.id,
            referenceCode: d.referenceCode || `TUT-2026-${docSnap.id.slice(-4).toUpperCase()}`,
            title: d.title,
            description: d.description,
            category,
            priority: (d.priority as PriorityLevel) || 'Medium',
            status,
            location: d.location || 'Millerpuram',
            ward: d.ward || locMatch.ward,
            coordinates: {
              lat: locMatch.lat,
              lng: locMatch.lng,
              mapX: locMatch.mapX,
              mapY: locMatch.mapY,
            },
            createdAt: createdStr,
            updatedAt: updatedStr,
            observedAt: d.observedAt || createdStr,
            reporterId: d.userId,
            userId: d.userId,
            reporterName: d.reporterName || 'Thoothukudi Resident',
            imageUrl:
              category === 'Water Leakage' || category === 'Drainage'
                ? ASSETS.waterLeak
                : category === 'Road Damage'
                ? ASSETS.roadPothole
                : ASSETS.streetLight,
            assignedDepartment:
              d.assignedDepartment || getDepartmentForCategory(category),
            assignedCrew: d.assignedCrew || 'Unassigned',
            upvotes: typeof d.upvotes === 'number' ? d.upvotes : 1,
            isFirestoreSynced: true,
            timeline: baseTimeline,
            comments: [],
          };
        });

        setReports((prev) => {
          const fsIds = new Set(firestoreReports.map((r) => r.id));
          const localOnly = prev.filter((r) => !fsIds.has(r.id) && !r.isFirestoreSynced);
          const merged = [...firestoreReports, ...localOnly];
          return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'reports');
      }
    );

    return () => unsub();
  }, [authReady, firebaseUser]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode));
    } catch {
      // ignore storage quota errors
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch {
      // ignore storage quota errors
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch {
      // ignore storage quota errors
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch {
      // ignore storage quota errors
    }
  }, [user]);

  // Auto-sync queued offline reports when returning online if preference is enabled
  useEffect(() => {
    if (isOnline && user.preferences.offlineAutoSync) {
      const queued = reports.filter((r) => r.isOfflineQueued);
      if (queued.length > 0) {
        setReports((prev) =>
          prev.map((r) => (r.isOfflineQueued ? { ...r, isOfflineQueued: false } : r))
        );
        const newNotif: AppNotification = {
          id: `notif-sync-${Date.now()}`,
          type: 'sync',
          title: `Synced ${queued.length} offline report(s) to Municipal Dispatch`,
          message: `Your locally saved Thoothukudi field reports have been uploaded and assigned reference numbers.`,
          timestamp: 'Just now',
          read: false,
          reportId: queued[0].id,
        };
        setNotifications((prev) => [newNotif, ...prev]);
        showToast(`Online connection restored — ${queued.length} queued report(s) synced.`);
      }
    }
  }, [isOnline]);

  const handleNavigate = (screen: ScreenId, reportId?: string) => {
    if (reportId) {
      setSelectedReportId(reportId);
    }
    setCurrentScreen(screen);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (
    role: 'citizen' | 'admin',
    updatedProfile?: Partial<UserProfile>
  ) => {
    setUser((prev) => ({
      ...prev,
      ...updatedProfile,
      role,
      isAuthenticated: true,
    }));
    showToast(
      `Signed in as ${updatedProfile?.name || user.name} (${
        role === 'admin' ? 'Municipal Admin' : 'Resident'
      })`
    );
    handleNavigate(role === 'admin' ? 'admin-dashboard' : 'citizen-dashboard');
  };

  const handleLogout = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {
      // ignore signout error
    }
    setUser((prev) => ({
      ...prev,
      isAuthenticated: false,
    }));
    showToast('Logged out successfully.');
    handleNavigate('login');
  };

  const handleUpdateUser = async (updated: UserProfile) => {
    setUser(updated);
    if (auth.currentUser && isOnline) {
      const uid = auth.currentUser.uid;
      const userDocRef = doc(db, 'users', uid);
      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          await updateDoc(userDocRef, {
            name: updated.name.slice(0, 120),
            email: updated.email.slice(0, 200),
            phone: updated.phone.slice(0, 40),
            location: updated.location.slice(0, 120),
            ward: updated.ward.slice(0, 120),
            streetAddress: updated.streetAddress.slice(0, 200),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(userDocRef, {
            uid,
            name: updated.name.slice(0, 120),
            email: updated.email.slice(0, 200),
            phone: updated.phone.slice(0, 40),
            role: 'citizen',
            location: updated.location.slice(0, 120),
            ward: updated.ward.slice(0, 120),
            streetAddress: updated.streetAddress.slice(0, 200),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    }
    showToast('Profile information updated.');
  };

  const handleSubmitReport = async (
    newReportData: Omit<
      IssueReport,
      | 'id'
      | 'referenceCode'
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'upvotes'
      | 'timeline'
      | 'comments'
    >,
    options?: { stayOnScreen?: boolean }
  ) => {
    const nowIso = new Date().toISOString().slice(0, 16);
    const nextNum = 842 + reports.length;
    const refCode = `TUT-2026-0${nextNum}`;
    const newId = `rep-${Date.now()}`;
    const routedDepartment = getDepartmentForCategory(newReportData.category);
    const officialTitle = getOfficialForDepartment(routedDepartment);
    const activeUid = auth.currentUser?.uid || user.id;

    const created: IssueReport = {
      ...newReportData,
      id: newId,
      referenceCode: refCode,
      assignedDepartment: routedDepartment,
      reporterId: activeUid,
      userId: activeUid,
      createdAt: nowIso,
      updatedAt: nowIso,
      status: 'Pending',
      upvotes: 1,
      userUpvoted: true,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          status: 'Pending',
          timestamp: nowIso.replace('T', ' '),
          actor: `${user.name} (Resident)`,
          note: isOnline
            ? `Report logged for ${newReportData.location} and automatically routed to ${routedDepartment} (${officialTitle}).`
            : 'Saved to local device offline queue. Will upload automatically when online.',
        },
      ],
      comments: [],
    };

    setReports((prev) => [created, ...prev]);

    if (auth.currentUser && isOnline) {
      try {
        await setDoc(doc(db, 'reports', newId), {
          title: created.title.slice(0, 200),
          description: created.description.slice(0, 2000),
          category: created.category,
          location: created.location.slice(0, 200),
          priority: created.priority,
          status: 'Pending',
          assignedDepartment: routedDepartment.slice(0, 120),
          userId: auth.currentUser.uid,
          visibility: 'public',
          referenceCode: refCode.slice(0, 50),
          ward: created.ward.slice(0, 120),
          reporterName: created.reporterName.slice(0, 120),
          assignedCrew: (created.assignedCrew || 'Unassigned').slice(0, 120),
          observedAt: created.observedAt.slice(0, 50),
          upvotes: 1,
          lastStatusNote: `Routed to ${routedDepartment}`.slice(0, 500),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `reports/${newId}`);
      }
    }

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'official',
      title: `Official Dispatch to ${routedDepartment}: ${created.title}`,
      message: `Notified ${officialTitle} · Location: ${created.location} · Priority: ${created.priority}`,
      timestamp: 'Just now',
      read: false,
      reportId: newId,
      department: routedDepartment,
      officialTitle,
      location: created.location,
      priority: created.priority,
      category: created.category,
      description: created.description,
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(
      isOnline
        ? `Report submitted to ${routedDepartment}`
        : `Saved ${refCode} to Offline Queue.`
    );
    setSelectedReportId(newId);
    if (!options?.stayOnScreen) {
      handleNavigate('report-details', newId);
    }
    return newId;
  };

  const handleToggleUpvote = async (reportId: string) => {
    let nextCount = 1;
    let isFsSynced = false;

    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        const nextUpvoted = !r.userUpvoted;
        nextCount = nextUpvoted ? r.upvotes + 1 : Math.max(0, r.upvotes - 1);
        isFsSynced = Boolean(r.isFirestoreSynced);
        return {
          ...r,
          userUpvoted: nextUpvoted,
          upvotes: nextCount,
        };
      })
    );

    if (auth.currentUser && isOnline && isFsSynced) {
      try {
        await updateDoc(doc(db, 'reports', reportId), {
          upvotes: nextCount,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
      }
    }
  };

  const handleAddComment = (reportId: string, message: string) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        return {
          ...r,
          updatedAt: timestamp,
          comments: [
            ...r.comments,
            {
              id: `cm-${Date.now()}`,
              authorName: user.name,
              authorRole: user.role === 'admin' ? 'Municipal Dispatch' : 'Citizen',
              timestamp,
              message,
            },
          ],
        };
      })
    );
    showToast('Field comment posted to report record.');
  };

  const handleUpdateReportStatus = async (
    reportId: string,
    status: ReportStatus,
    crew: string,
    priority: PriorityLevel,
    note: string
  ) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const existingReport = reports.find((r) => r.id === reportId);
    const targetRef = existingReport?.referenceCode || reportId;
    const isFsSynced = Boolean(existingReport?.isFirestoreSynced);
    const prevStatus: ReportStatus = existingReport?.status || 'Pending';

    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        return {
          ...r,
          status,
          assignedCrew: crew,
          priority,
          updatedAt: timestamp,
          timeline: [
            ...r.timeline,
            {
              id: `tl-${Date.now()}`,
              status,
              timestamp,
              actor: user.role === 'admin' ? user.name : 'Department Dispatch Console',
              note,
            },
          ],
        };
      })
    );

    if (auth.currentUser && isOnline && isFsSynced && prevStatus !== 'Resolved') {
      try {
        await updateDoc(doc(db, 'reports', reportId), {
          status,
          assignedCrew: crew.slice(0, 120),
          priority,
          lastStatusNote: note.slice(0, 500),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
      }
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'status',
      title: `Status Update: ${targetRef} is now ${status}`,
      message: `${note} (Assigned Unit: ${crew})`,
      timestamp: 'Just now',
      read: false,
      reportId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`Updated ${targetRef} to ${status}.`);
  };

  const handleSyncOfflineQueue = () => {
    const count = reports.filter((r) => r.isOfflineQueued).length;
    setReports((prev) =>
      prev.map((r) => (r.isOfflineQueued ? { ...r, isOfflineQueued: false } : r))
    );
    showToast(`Synced ${count} offline report(s) to Municipal Dispatch.`);
  };

  const handleResetDemoData = () => {
    setReports(INITIAL_REPORTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setUser(INITIAL_USER_PROFILE);
    setSimulatedOffline(false);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    showToast('Thoothukudi dataset restored to initial state.');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeReport =
    reports.find((r) => r.id === selectedReportId) || reports[0];

  const ALL_SCREENS: { id: ScreenId; label: string }[] = [
    { id: 'landing', label: '1. Home' },
    { id: 'login', label: '2. Login' },
    { id: 'signup', label: '3. Sign Up' },
    { id: 'citizen-dashboard', label: '4. Dashboard' },
    { id: 'report-issue', label: '5. Report Issue' },
    { id: 'my-reports', label: '6. Reports' },
    { id: 'report-details', label: '7. Issue Details' },
    { id: 'notifications', label: `8. Notifications (${unreadCount})` },
    { id: 'profile', label: '9. Profile' },
    { id: 'admin-dashboard', label: '10. Admin Console' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Bar Contract: 3 Zones */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single Text Element Wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('landing');
            }}
            className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap"
          >
            ImpactVoice
          </a>

          {/* Zone 2: 5 Clean Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => handleNavigate('citizen-dashboard')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                currentScreen === 'citizen-dashboard'
                  ? 'border-sky-600 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('my-reports')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                currentScreen === 'my-reports' || currentScreen === 'report-details'
                  ? 'border-sky-600 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Reports
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('notifications')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                currentScreen === 'notifications'
                  ? 'border-sky-600 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin-dashboard')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                currentScreen === 'admin-dashboard'
                  ? 'border-sky-600 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Admin Console
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('profile')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                currentScreen === 'profile'
                  ? 'border-sky-600 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Profile
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('report-issue')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>

            {(firebaseUser || user.isAuthenticated) && (
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Open navigation menu"
              className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {ALL_SCREENS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                    currentScreen === item.id
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Sub-Header Screen Switcher Bar */}
      <div className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            {ALL_SCREENS.map((scr) => (
              <button
                key={scr.id}
                type="button"
                onClick={() => handleNavigate(scr.id)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  currentScreen === scr.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {scr.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSimulatedOffline((prev) => !prev)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer shrink-0 transition-colors ${
              !isOnline
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {!isOnline ? 'Offline Mode (Click to Go Online)' : 'Test Offline Mode'}
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentScreen === 'landing' && (
          <LandingScreen
            reports={reports}
            onNavigate={handleNavigate}
            onSelectCategoryForReport={(cat) => setPreselectedCategory(cat)}
          />
        )}

        {(currentScreen === 'login' || currentScreen === 'signup') && (
          <AuthScreens
            mode={currentScreen}
            onNavigate={handleNavigate}
            onSuccessAuth={handleAuthSuccess}
          />
        )}

        {currentScreen === 'citizen-dashboard' && (
          <CitizenDashboard
            user={user}
            reports={reports}
            notifications={notifications}
            isOnline={isOnline}
            onNavigate={handleNavigate}
            onSelectCategoryForReport={(cat) => setPreselectedCategory(cat)}
            onToggleUpvote={handleToggleUpvote}
            onSyncOfflineQueue={handleSyncOfflineQueue}
          />
        )}

        {currentScreen === 'report-issue' && (
          <ReportIssueScreen
            user={user}
            initialCategory={preselectedCategory}
            isOnline={isOnline}
            onSubmitReport={handleSubmitReport}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'my-reports' && (
          <MyReportsScreen
            user={user}
            reports={reports}
            onNavigate={handleNavigate}
            onToggleUpvote={handleToggleUpvote}
          />
        )}

        {currentScreen === 'report-details' && activeReport && (
          <ReportDetailsScreen
            report={activeReport}
            user={user}
            onNavigate={handleNavigate}
            onToggleUpvote={handleToggleUpvote}
            onAddComment={handleAddComment}
            onUpdateReportStatus={handleUpdateReportStatus}
          />
        )}

        {currentScreen === 'notifications' && (
          <NotificationsScreen
            notifications={notifications}
            reports={reports}
            onNavigate={handleNavigate}
            onMarkAsRead={(id) =>
              setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
              )
            }
            onMarkAllRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            onDeleteNotification={(id) =>
              setNotifications((prev) => prev.filter((n) => n.id !== id))
            }
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            user={user}
            reports={reports}
            darkMode={darkMode}
            isOnline={isOnline}
            simulatedOffline={simulatedOffline}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            onToggleSimulatedOffline={() => setSimulatedOffline((s) => !s)}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
            onResetDemoData={handleResetDemoData}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'admin-dashboard' && (
          <AdminDashboard
            reports={reports}
            onNavigate={handleNavigate}
            onUpdateReportStatus={handleUpdateReportStatus}
          />
        )}
      </main>

      {/* Non-intrusive Toast & Offline Indicator */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl bg-slate-900 dark:bg-sky-600 text-white px-4 py-3 text-xs font-medium shadow-lg">
          {toastMessage}
        </div>
      )}

      {!isOnline && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode — Local device cache & report queue active</span>
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 dark:text-white font-display">
              ImpactVoice
            </span>
            <span aria-hidden="true">·</span>
            <span>Thoothukudi Civic Issue Reporting & Municipal Department Dispatch</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('landing')}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('report-issue')}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Report Issue
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin-dashboard')}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Admin Console
            </button>
            {(firebaseUser || user.isAuthenticated) ? (
              <button
                type="button"
                onClick={handleLogout}
                className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigate('login')}
                className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
