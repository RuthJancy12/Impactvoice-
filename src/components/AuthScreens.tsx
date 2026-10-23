import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  User,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { ScreenId, UserProfile } from '../types';
import { THOOTHUKUDI_LOCATIONS } from '../mockData';

interface AuthScreensProps {
  mode: 'login' | 'signup';
  onNavigate: (screen: ScreenId) => void;
  onSuccessAuth: (role: 'citizen' | 'admin', updatedProfile?: Partial<UserProfile>) => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({
  mode,
  onNavigate,
  onSuccessAuth,
}) => {
  const [email, setEmail] = useState('karthik.s@thoothukudi-citizens.in');
  const [password, setPassword] = useState('Thoothukudi#2026');
  const [fullName, setFullName] = useState('Karthik Shunmugam');
  const [phone, setPhone] = useState('+91 94431 28910');
  const [location, setLocation] = useState<string>('Bryant Nagar');
  const [streetAddress, setStreetAddress] = useState('42, 5th Street, Bryant Nagar, Thoothukudi');
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'admin'>('citizen');
  const [errorMsg, setErrorMsg] = useState('');
  const [providerHelpVisible, setProviderHelpVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLocObj =
    THOOTHUKUDI_LOCATIONS.find((l) => l.name === location) || THOOTHUKUDI_LOCATIONS[1];

  const syncUserProfileToFirestore = async (
    uid: string,
    profileData: {
      name: string;
      email: string;
      phone: string;
      location: string;
      ward: string;
      streetAddress: string;
    }
  ) => {
    const userDocRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(userDocRef, {
          uid,
          name: profileData.name.slice(0, 120),
          email: profileData.email.slice(0, 200),
          phone: profileData.phone.slice(0, 40),
          role: 'citizen',
          location: profileData.location.slice(0, 120),
          ward: profileData.ward.slice(0, 120),
          streetAddress: profileData.streetAddress.slice(0, 200),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setProviderHelpVisible(false);
    setIsSubmitting(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const resolvedName = fbUser.displayName || fullName || 'Thoothukudi Resident';
      const resolvedEmail = fbUser.email || email;

      await syncUserProfileToFirestore(fbUser.uid, {
        name: resolvedName,
        email: resolvedEmail,
        phone,
        location,
        ward: selectedLocObj.ward,
        streetAddress,
      });

      onSuccessAuth(selectedRole, {
        id: fbUser.uid,
        name: resolvedName,
        email: resolvedEmail,
        phone,
        location,
        ward: selectedLocObj.ward,
        streetAddress,
        role: selectedRole,
        isAuthenticated: true,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google Sign-In could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setProviderHelpVisible(false);

    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.trim().length < 6) {
      setErrorMsg('Please enter a password with at least 6 characters.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uid = '';
      let resolvedName = fullName.trim() || 'Thoothukudi Resident';
      const cleanEmail = email.trim();

      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        uid = cred.user.uid;
        await updateProfile(cred.user, { displayName: resolvedName });
        await syncUserProfileToFirestore(uid, {
          name: resolvedName,
          email: cleanEmail,
          phone,
          location,
          ward: selectedLocObj.ward,
          streetAddress,
        });
      } else {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        uid = cred.user.uid;
        resolvedName = cred.user.displayName || fullName;

        try {
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists()) {
            const d = userSnap.data();
            onSuccessAuth(selectedRole, {
              id: uid,
              name: d.name || resolvedName,
              email: d.email || cleanEmail,
              phone: d.phone || phone,
              location: d.location || location,
              ward: d.ward || selectedLocObj.ward,
              streetAddress: d.streetAddress || streetAddress,
              role: selectedRole,
              isAuthenticated: true,
            });
            setIsSubmitting(false);
            return;
          } else {
            await syncUserProfileToFirestore(uid, {
              name: resolvedName,
              email: cleanEmail,
              phone,
              location,
              ward: selectedLocObj.ward,
              streetAddress,
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        }
      }

      onSuccessAuth(selectedRole, {
        id: uid,
        name: resolvedName,
        email: cleanEmail,
        phone,
        location,
        ward: selectedLocObj.ward,
        streetAddress,
        role: selectedRole,
        isAuthenticated: true,
      });
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setProviderHelpVisible(true);
        setErrorMsg(
          'Email/Password Sign-In provider is not yet enabled in your Firebase Console. You can enable it in Firebase Console or use Google Sign-In / Instant Demo Access below.'
        );
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please switch to Sign In.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password. If you are new, please create an account first.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (role: 'citizen' | 'admin') => {
    if (role === 'citizen') {
      onSuccessAuth('citizen', {
        name: 'Karthik Shunmugam',
        email: 'karthik.s@thoothukudi-citizens.in',
        role: 'citizen',
        location: 'Bryant Nagar',
        ward: 'Zone 3 — South Central',
        streetAddress: '42, 5th Street, Bryant Nagar, Thoothukudi',
        isAuthenticated: true,
      });
    } else {
      onSuccessAuth('admin', {
        name: 'S. Murugan (Municipal Commissioner Office)',
        email: 'dispatch@thoothukudicorp.gov.in',
        role: 'admin',
        location: 'Beach Road',
        ward: 'All Thoothukudi Corporation Zones (1–4)',
        organization: 'Thoothukudi City Municipal Corporation',
        isAuthenticated: true,
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
            {mode === 'login'
              ? 'Thoothukudi Civic Portal · Firebase Authentication'
              : 'New Thoothukudi Resident Registration'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {mode === 'login'
              ? 'Sign in to ImpactVoice'
              : 'Create your Thoothukudi resident account'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {mode === 'login'
              ? 'Sign in with Email/Password or Google to file civic reports, track TWAD/TANGEDCO/Corporation dispatches, and manage your profile.'
              : 'Register with your Thoothukudi locality to report civic issues and receive real-time department resolution updates.'}
          </p>
        </div>

        {/* Google Auth + Instant Presentation Access */}
        <div className="my-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white hover:border-sky-500 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue with Google (Firebase Auth)</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </button>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
              Instant Presentation Access (1-Click Sign-In):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('citizen')}
                className="flex items-center justify-between px-3.5 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-sky-500 transition-colors cursor-pointer"
              >
                <span>Citizen: Karthik S.</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="flex items-center justify-between px-3.5 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-sky-500 transition-colors cursor-pointer"
              >
                <span>Admin: Thoothukudi Corp</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 space-y-2">
            <p className="font-medium">{errorMsg}</p>
            {providerHelpVisible && (
              <div className="pt-2 border-t border-red-200 dark:border-red-800/70 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>How to enable Email/Password in Firebase Console:</span>
                </p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Open the Firebase Console for project <strong>fit-spirit-rvxch</strong>.</li>
                  <li>Go to <strong>Build → Authentication → Sign-in method</strong>.</li>
                  <li>Click <strong>Email/Password</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong>.</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setSelectedRole('citizen')}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedRole === 'citizen'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Resident / Citizen
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`py-2 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Organization / Admin
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Karthik Shunmugam"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number (for SMS Updates)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 94431 28910"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Thoothukudi Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  >
                    {THOOTHUKUDI_LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Home Street Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="42, 5th Street, Bryant Nagar, Thoothukudi"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="resident@thoothukudi.in"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 disabled:opacity-60 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Authenticating with Firebase...'
                : mode === 'login'
                ? `Sign In as ${selectedRole === 'admin' ? 'Municipal Admin' : 'Resident'}`
                : 'Complete Resident Registration'}
            </span>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>
            {mode === 'login'
              ? "Don't have a resident account?"
              : 'Already registered with ImpactVoice?'}
          </span>
          <button
            type="button"
            onClick={() => onNavigate(mode === 'login' ? 'signup' : 'login')}
            className="font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
          >
            {mode === 'login' ? 'Create Account →' : 'Sign In Instead →'}
          </button>
        </div>
      </div>
    </div>
  );
};
