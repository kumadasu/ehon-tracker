import { useState, useEffect } from 'react';
import { requestAccessToken, getCachedToken, revokeToken } from '../services/gis';
import { findOrCreateFile } from '../services/driveStorage';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export interface AuthState {
  accessToken: string | null;
  driveFileId: string | null;
  loading: boolean;
  enabled: boolean; // false when VITE_GOOGLE_CLIENT_ID is not configured
}

export const useAuth = (): AuthState & {
  signIn: () => Promise<void>;
  signOut: () => void;
} => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => Boolean(CLIENT_ID && getCachedToken()));

  // Restore session from sessionStorage on mount
  useEffect(() => {
    if (!CLIENT_ID) return;
    const cached = getCachedToken();
    if (!cached) return;

    findOrCreateFile(cached)
      .then((fileId) => {
        setAccessToken(cached);
        setDriveFileId(fileId);
      })
      .catch(() => {
        // Cached token likely expired; clear it silently
        sessionStorage.clear();
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async () => {
    if (!CLIENT_ID) return;
    setLoading(true);
    try {
      const token = await requestAccessToken(CLIENT_ID);
      const fileId = await findOrCreateFile(token);
      setAccessToken(token);
      setDriveFileId(fileId);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    if (accessToken) revokeToken(accessToken);
    setAccessToken(null);
    setDriveFileId(null);
  };

  return {
    accessToken,
    driveFileId,
    loading,
    enabled: Boolean(CLIENT_ID),
    signIn,
    signOut,
  };
};
