import { clearAuthTrace, logAuthTrace } from "@/lib/auth-trace";

export interface PassportDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  end_session_endpoint?: string;
  revocation_endpoint?: string;
}

export interface PassportUser {
  sub: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  [key: string]: unknown;
}

export interface PassportSession {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt: number;
  scope?: string;
  user: PassportUser;
}

interface CallbackState {
  state: string;
  verifier: string;
  returnTo: string;
}

const SESSION_KEY = "mcpfabric.passport.session";
const CALLBACK_KEY = "mcpfabric.passport.callback";

declare const __PASSPORT_DISCOVERY_URL__: string | undefined;
declare const __PASSPORT_CLIENT_ID__: string | undefined;
declare const __PASSPORT_REDIRECT_URI__: string | undefined;
declare const __PASSPORT_POST_LOGOUT_REDIRECT_URI__: string | undefined;
declare const __APP_BASE_URL__: string | undefined;
declare const __PASSPORT_SCOPE__: string | undefined;

function requireConfig(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Missing Passport config: ${name}`);
  }
  return normalized;
}

export function getPassportConfig() {
  const config = {
    discoveryUrl: requireConfig(__PASSPORT_DISCOVERY_URL__, "PASSPORT_DISCOVERY_URL"),
    clientId: requireConfig(__PASSPORT_CLIENT_ID__, "PASSPORT_CLIENT_ID"),
    redirectUri: requireConfig(__PASSPORT_REDIRECT_URI__, "PASSPORT_REDIRECT_URI"),
    postLogoutRedirectUri: requireConfig(
      __PASSPORT_POST_LOGOUT_REDIRECT_URI__,
      "PASSPORT_POST_LOGOUT_REDIRECT_URI",
    ),
    appBaseUrl: requireConfig(__APP_BASE_URL__, "APP_BASE_URL"),
    scope: (__PASSPORT_SCOPE__ || "openid profile email").trim(),
  };
  logAuthTrace("config", "Resolved Passport configuration", {
    discoveryUrl: config.discoveryUrl,
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    postLogoutRedirectUri: config.postLogoutRedirectUri,
    appBaseUrl: config.appBaseUrl,
    scope: config.scope,
  });
  return config;
}

export async function fetchPassportDiscovery(): Promise<PassportDiscoveryDocument> {
  const { discoveryUrl } = getPassportConfig();
  logAuthTrace("discovery", "Fetching discovery document", { discoveryUrl });
  const response = await fetch(discoveryUrl);
  if (!response.ok) {
    logAuthTrace("discovery", "Discovery fetch failed", { discoveryUrl, status: response.status });
    throw new Error(`Failed to load Passport discovery (${response.status})`);
  }
  const document = (await response.json()) as PassportDiscoveryDocument;
  logAuthTrace("discovery", "Discovery fetch succeeded", {
    issuer: document.issuer,
    authorization_endpoint: document.authorization_endpoint,
    token_endpoint: document.token_endpoint,
    end_session_endpoint: document.end_session_endpoint,
  });
  return document;
}

function encodeBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url<T>(input: string): T {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  const text = atob(normalized);
  return JSON.parse(text) as T;
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

function randomString(length = 64): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes).slice(0, length);
}

function readStoredCallback(): CallbackState | null {
  const raw = sessionStorage.getItem(CALLBACK_KEY);
  if (!raw) {
    logAuthTrace("callback-state", "No stored callback state found");
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CallbackState;
    logAuthTrace("callback-state", "Loaded stored callback state", {
      hasState: Boolean(parsed.state),
      hasVerifier: Boolean(parsed.verifier),
      returnTo: parsed.returnTo,
    });
    return parsed;
  } catch {
    sessionStorage.removeItem(CALLBACK_KEY);
    logAuthTrace("callback-state", "Stored callback state was invalid JSON and was cleared");
    return null;
  }
}

function parseJwtUser(idToken?: string): PassportUser {
  if (!idToken) {
    throw new Error("Missing id_token from Passport callback");
  }

  const parts = idToken.split(".");
  if (parts.length < 2) {
    throw new Error("Invalid id_token format");
  }

  return decodeBase64Url<PassportUser>(parts[1]);
}

export function loadPassportSession(): PassportSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    logAuthTrace("session", "No existing Passport session found");
    return null;
  }

  try {
    const session = JSON.parse(raw) as PassportSession;
    if (!session.expiresAt || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      logAuthTrace("session", "Stored Passport session was expired and cleared", {
        expiresAt: session.expiresAt,
      });
      return null;
    }
    logAuthTrace("session", "Loaded existing Passport session", {
      subject: session.user.sub,
      preferred_username: session.user.preferred_username,
      expiresAt: session.expiresAt,
    });
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    logAuthTrace("session", "Stored Passport session was invalid JSON and was cleared");
    return null;
  }
}

export function savePassportSession(session: PassportSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  logAuthTrace("session", "Saved Passport session", {
    subject: session.user.sub,
    preferred_username: session.user.preferred_username,
    expiresAt: session.expiresAt,
    scope: session.scope,
  });
}

export function clearPassportSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(CALLBACK_KEY);
  logAuthTrace("session", "Cleared Passport session and callback state");
}

export async function beginPassportLogin(returnTo = window.location.pathname + window.location.search) {
  clearAuthTrace();
  logAuthTrace("login", "Beginning Passport login", {
    returnTo,
    callbackPath: window.location.pathname,
  });
  const discovery = await fetchPassportDiscovery();
  const config = getPassportConfig();
  const state = randomString(32);
  const verifier = randomString(64);
  const challenge = encodeBase64Url(await sha256(verifier));

  sessionStorage.setItem(
    CALLBACK_KEY,
    JSON.stringify({
      state,
      verifier,
      returnTo,
    } satisfies CallbackState),
  );
  logAuthTrace("login", "Stored PKCE callback state", {
    stateLength: state.length,
    verifierLength: verifier.length,
    challengeLength: challenge.length,
    returnTo,
  });

  const url = new URL(discovery.authorization_endpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  logAuthTrace("login", "Redirecting browser to Passport authorize endpoint", {
    authorizationEndpoint: discovery.authorization_endpoint,
    searchParams: Object.fromEntries(url.searchParams.entries()),
  });

  window.location.assign(url.toString());
}

export async function completePassportLogin(
  callbackUrl: string,
): Promise<{ session: PassportSession; returnTo: string }> {
  logAuthTrace("callback", "Starting callback completion", {
    callbackUrl,
  });
  const discovery = await fetchPassportDiscovery();
  const config = getPassportConfig();
  const url = new URL(callbackUrl);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  logAuthTrace("callback", "Parsed callback query parameters", {
    hasCode: Boolean(code),
    hasState: Boolean(state),
    error,
    errorDescription,
  });

  if (error) {
    logAuthTrace("callback", "Passport returned callback error", {
      error,
      errorDescription,
    });
    throw new Error(errorDescription || error);
  }
  if (!code || !state) {
    logAuthTrace("callback", "Missing required callback parameters", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
    });
    throw new Error("Missing code/state from Passport callback");
  }

  const callbackState = readStoredCallback();
  if (!callbackState || callbackState.state !== state) {
    logAuthTrace("callback", "OAuth state validation failed", {
      storedStatePresent: Boolean(callbackState?.state),
      callbackStateMatch: callbackState?.state === state,
    });
    throw new Error("Invalid or expired OAuth state");
  }

  logAuthTrace("callback", "OAuth state validation succeeded", {
    returnTo: callbackState.returnTo,
  });

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: callbackState.verifier,
  });

  logAuthTrace("token", "Starting token exchange", {
    tokenEndpoint: discovery.token_endpoint,
    redirectUri: config.redirectUri,
    grant_type: "authorization_code",
    clientId: config.clientId,
  });

  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    logAuthTrace("token", "Token exchange failed", {
      status: tokenResponse.status,
      body: text,
    });
    throw new Error(`Passport token exchange failed (${tokenResponse.status}): ${text}`);
  }

  const tokenPayload = (await tokenResponse.json()) as {
    access_token: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
  };

  logAuthTrace("token", "Token exchange succeeded", {
    tokenType: tokenPayload.token_type,
    expiresIn: tokenPayload.expires_in,
    hasAccessToken: Boolean(tokenPayload.access_token),
    hasRefreshToken: Boolean(tokenPayload.refresh_token),
    hasIdToken: Boolean(tokenPayload.id_token),
    scope: tokenPayload.scope,
  });

  const session: PassportSession = {
    accessToken: tokenPayload.access_token,
    idToken: tokenPayload.id_token,
    refreshToken: tokenPayload.refresh_token,
    tokenType: tokenPayload.token_type || "Bearer",
    expiresAt: Date.now() + (tokenPayload.expires_in || 3600) * 1000,
    scope: tokenPayload.scope,
    user: parseJwtUser(tokenPayload.id_token),
  };

  savePassportSession(session);
  sessionStorage.removeItem(CALLBACK_KEY);
  logAuthTrace("callback", "Callback completed and session stored", {
    returnTo: callbackState.returnTo || "/",
    subject: session.user.sub,
  });

  return {
    session,
    returnTo: callbackState.returnTo || "/",
  };
}

export async function beginPassportLogout(session: PassportSession | null) {
  const discovery = await fetchPassportDiscovery();
  const config = getPassportConfig();
  logAuthTrace("logout", "Beginning Passport logout", {
    hasSession: Boolean(session),
    endSessionEndpoint: discovery.end_session_endpoint,
  });
  clearPassportSession();

  if (!discovery.end_session_endpoint) {
    logAuthTrace("logout", "Passport discovery had no logout endpoint; redirecting to app root");
    window.location.assign(config.postLogoutRedirectUri);
    return;
  }

  const url = new URL(discovery.end_session_endpoint);
  url.searchParams.set("post_logout_redirect_uri", config.postLogoutRedirectUri);
  url.searchParams.set("client_id", config.clientId);
  if (session?.idToken) {
    url.searchParams.set("id_token_hint", session.idToken);
  }

  logAuthTrace("logout", "Redirecting browser to Passport logout endpoint", {
    logoutEndpoint: discovery.end_session_endpoint,
    postLogoutRedirectUri: config.postLogoutRedirectUri,
    hasIdTokenHint: Boolean(session?.idToken),
  });

  window.location.assign(url.toString());
}
