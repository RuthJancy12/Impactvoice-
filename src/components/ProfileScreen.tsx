import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  LogOut,
  Mail,
  MapPin,
  Moon,
  RefreshCw,
  Save,
  Shield,
  Sun,
  User as UserIcon,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { IssueReport, ScreenId, UserProfile } from '../types';
import { THOOTHUKUDI_LOCATIONS } from '../mockData';
import { ResilientImage } from './ResilientImage';
import { PWAInstallButton } from './StatusIndicators';

interface ProfileScreenProps {
  user: UserProfile;
  reports: IssueReport[];
  darkMode: boolean;
  isOnline: boolean;
  simulatedOffline: boolean;
  onToggleDarkMode: () => void;
  onToggleSimulatedOffline: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
  onResetDemoData: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  reports,
  darkMode,
  isOnline,
  simulatedOffline,
  onToggleDarkMode,
  onToggleSimulatedOffline,
  onUpdateUser,
  onLogout,
  onResetDemoData,
  onNavigate,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [location, setLocation] = useState(user.location || 'Bryant Nagar');
  const [ward, setWard] = useState(user.ward);
  const [streetAddress, setStreetAddress] = useState(user.streetAddress);
  const [role, setRole] = useState<'citizen' | 'admin'>(user.role);
  const [prefs, setPrefs] = useState(user.preferences);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setLocation(user.location || 'Bryant Nagar');
    setWard(user.ward);
    setStreetAddress(user.streetAddress);
    setRole(user.role);
    setPrefs(user.preferences);
  }, [user]);

  const handleLocationChange = (locName: string) => {
    setLocation(locName);
    const match = THOOTHUKUDI_LOCATIONS.find((l) => l.name === locName);
    if (match) {
      setWard(match.ward);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: name.trim().slice(0, 120) || user.name,
      email: email.trim().slice(0, 200) || user.email,
      phone: phone.trim().slice(0, 40),
      location: location.trim().slice(0, 120),
      ward: ward.trim().slice(0, 120),
      streetAddress: streetAddress.trim().slice(0, 200),
      role,
      preferences: prefs,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const offlineQueueCount = reports.filter((r) => r.isOfflineQueued).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100">
            <ResilientImage
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-sky-600 dark:text-sky-400">
                {user.role === 'admin' ? 'Municipal Administrator' : 'Verified Resident'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{user.location || 'Bryant Nagar'}, Thoothukudi</span>
              <span aria-hidden="true">·</span>
              <span>Joined {user.joinedDate}</span>
            </div>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {user.name}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {user.email} · {user.ward}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Switch Account
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Summary Cards for Name, Email, Role, Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-sky-600" />
            <span>Name</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
            {user.name}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-sky-600" />
            <span>Email</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
            {user.email}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span>Role</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white capitalize">
            {user.role === 'admin' ? 'Admin (Municipal Dispatch)' : 'Citizen / Resident'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>Thoothukudi Location</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
            {user.location || 'Bryant Nagar'}
          </p>
        </div>
      </div>

      {savedBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Profile settings and Thoothukudi location preferences saved.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Personal & Location Information Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Resident & Organization Profile Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'citizen' | 'admin')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="citizen">Citizen / Resident</option>
                <option value="admin">Organization / Municipal Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                maxLength={200}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                SMS Dispatch Phone
              </label>
              <input
                type="tel"
                maxLength={40}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Thoothukudi Location
              </label>
              <select
                value={
                  THOOTHUKUDI_LOCATIONS.some((l) => l.name === location)
                    ? location
                    : THOOTHUKUDI_LOCATIONS[0].name
                }
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                {THOOTHUKUDI_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Street Address
              </label>
              <input
                type="text"
                maxLength={200}
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Communication & Alert Preferences
            </h3>

            {(
              [
                {
                  key: 'smsAlerts',
                  label: 'SMS Text Alerts when a department crew is dispatched to my street',
                },
                {
                  key: 'emailDigest',
                  label: 'Weekly Thoothukudi Public Works Resolution Summary email',
                },
                {
                  key: 'pushNotifications',
                  label: 'Browser & PWA Push Notifications for status changes',
                },
                {
                  key: 'offlineAutoSync',
                  label: 'Automatically upload queued offline reports when Wi-Fi/Cellular returns',
                },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer py-1"
              >
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </label>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile & Preferences</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/80 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout of Account</span>
            </button>
          </div>
        </form>

        {/* Right 5 Cols: Dark Mode, Offline Storage & Presentation Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Appearance / Dark Mode Card */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Appearance & Night Visibility
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  High-contrast dark mode reduces glare when reporting street light or evening road hazards.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="w-full flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-sky-500 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-slate-900 dark:text-white">
                {darkMode ? (
                  <>
                    <Moon className="w-4 h-4 text-sky-400" />
                    <span>Dark Mode Active</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode Active</span>
                  </>
                )}
              </span>
              <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
                Switch to {darkMode ? 'Light' : 'Dark'} →
              </span>
            </button>
          </div>

          {/* Offline Capabilities & Sync Simulator */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Firestore Cloud & Offline Cache
              </h2>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              ImpactVoice syncs reports to Firebase Firestore while maintaining a local offline cache via Service Worker and LocalStorage.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400">Total Reports</p>
                <p className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {reports.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400">Pending Upload</p>
                <p className="mt-1 text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {offlineQueueCount}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleSimulatedOffline}
              className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-colors cursor-pointer ${
                simulatedOffline
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white hover:border-sky-500'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                {!isOnline ? (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Offline Mode Active</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Online & Synced</span>
                  </>
                )}
              </span>
              <span className="text-xs font-medium underline">
                {simulatedOffline ? 'Reconnect Online' : 'Simulate Offline Mode'}
              </span>
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Restore default Thoothukudi dataset
              </span>
              <button
                type="button"
                onClick={onResetDemoData}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
