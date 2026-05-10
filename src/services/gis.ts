const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

const SESSION_KEY = 'gis_access_token';

// Wait for the GIS script to load before initializing the token client
const waitForGis = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof google !== 'undefined') {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (typeof google !== 'undefined') {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });

export const requestAccessToken = async (clientId: string): Promise<string> => {
  await waitForGis();

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
        sessionStorage.setItem(SESSION_KEY, response.access_token);
        resolve(response.access_token);
      },
      error_callback: (err) => {
        reject(new Error(err.message ?? err.type));
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
};

export const getCachedToken = (): string | null => sessionStorage.getItem(SESSION_KEY);

export const revokeToken = (token: string): void => {
  sessionStorage.removeItem(SESSION_KEY);
  if (typeof google !== 'undefined') {
    google.accounts.oauth2.revoke(token);
  }
};
