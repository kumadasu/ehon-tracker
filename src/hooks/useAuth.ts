import { useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, isConfigured } from '../services/firebase';

// Calendar scope requested at sign-in to allow creating return-date events
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export interface AuthState {
  user: User | null;
  calendarToken: string | null;
  loading: boolean;
  firebaseEnabled: boolean;
}

export const useAuth = (): AuthState & { signIn: () => Promise<void>; signOut: () => Promise<void> } => {
  const [user, setUser] = useState<User | null>(null);
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsub;
  }, []);

  const signIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.addScope(CALENDAR_SCOPE);
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    setCalendarToken(credential?.accessToken ?? null);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setCalendarToken(null);
  };

  return {
    user,
    calendarToken,
    loading,
    firebaseEnabled: isConfigured,
    signIn,
    signOut,
  };
};
