// Minimal type declarations for Google Identity Services (GIS)
// https://developers.google.com/identity/oauth2/web/reference/js-reference

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken(overrideConfig?: { prompt?: string }): void;
}

interface OAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message?: string }) => void;
  }): TokenClient;
  revoke(token: string, done?: () => void): void;
}

interface Google {
  accounts: {
    oauth2: OAuth2;
  };
}

declare const google: Google;
