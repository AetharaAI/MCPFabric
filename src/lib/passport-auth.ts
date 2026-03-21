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
  return {
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
}

export async function fetchPassportDiscovery(): Promise<PassportDiscoveryDocument> {
  const { discoveryUrl } = getPassportConfig();
  const response = await fetch(discoveryUrl);
  if (!response.ok) {
    throw new Error(`Failed to load Passport discovery (${response.status})`);
  }
  return response.json() as Promise<PassportDiscoveryDocument>;
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
    return null;
  }

  try {
    return JSON.parse(raw) as CallbackState;
  } catch {
    sessionStorage.removeItem(CALLBACK_KEY);
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
    return null;
  }

  try {
    const session = JSON.parse(raw) as PassportSession;
    if (!session.expiresAt || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function savePassportSession(session: PassportSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearPassportSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(CALLBACK_KEY);
}

export async function beginPassportLogin(returnTo = window.location.pathname + window.location.search) {
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

  const url = new URL(discovery.authorization_endpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  window.location.assign(url.toString());
}

export async function completePassportLogin(
  callbackUrl: string,
): Promise<{ session: PassportSession; returnTo: string }> {
  const discovery = await fetchPassportDiscovery();
  const config = getPassportConfig();
  const url = new URL(callbackUrl);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    throw new Error(url.searchParams.get("error_description") || error);
  }
  if (!code || !state) {
    throw new Error("Missing code/state from Passport callback");
  }

  const callbackState = readStoredCallback();
  if (!callbackState || callbackState.state !== state) {
    throw new Error("Invalid or expired OAuth state");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: callbackState.verifier,
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

  return {
    session,
    returnTo: callbackState.returnTo || "/",
  };
}

export async function beginPassportLogout(session: PassportSession | null) {
  const discovery = await fetchPassportDiscovery();
  const config = getPassportConfig();
  clearPassportSession();

  if (!discovery.end_session_endpoint) {
    window.location.assign(config.postLogoutRedirectUri);
    return;
  }

  const url = new URL(discovery.end_session_endpoint);
  url.searchParams.set("post_logout_redirect_uri", config.postLogoutRedirectUri);
  url.searchParams.set("client_id", config.clientId);
  if (session?.idToken) {
    url.searchParams.set("id_token_hint", session.idToken);
  }

  window.location.assign(url.toString());
}
