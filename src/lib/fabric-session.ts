const STORAGE_BASE_URL = "mcpfabric.api.base_url";
const STORAGE_ADMIN_KEY = "mcpfabric.api.admin_key";
const STORAGE_OPERATOR_KEY = "mcpfabric.api.operator_key";

export interface FabricSessionState {
  baseUrl: string;
  adminKey: string;
  operatorKey: string;
}

export function loadFabricSession(defaultBaseUrl: string): FabricSessionState {
  return {
    baseUrl: localStorage.getItem(STORAGE_BASE_URL) || defaultBaseUrl,
    adminKey: sessionStorage.getItem(STORAGE_ADMIN_KEY) || "",
    operatorKey: sessionStorage.getItem(STORAGE_OPERATOR_KEY) || "",
  };
}

export function persistBaseUrl(baseUrl: string) {
  localStorage.setItem(STORAGE_BASE_URL, baseUrl.trim());
}

export function persistAdminKey(key: string | null) {
  if (key && key.trim()) {
    sessionStorage.setItem(STORAGE_ADMIN_KEY, key.trim());
    return;
  }

  sessionStorage.removeItem(STORAGE_ADMIN_KEY);
}

export function persistOperatorKey(key: string | null) {
  if (key && key.trim()) {
    sessionStorage.setItem(STORAGE_OPERATOR_KEY, key.trim());
    return;
  }

  sessionStorage.removeItem(STORAGE_OPERATOR_KEY);
}
