export const GUEST_MODE_STORAGE_KEY = "neutralname:guest-test-mode";

export function isGuestModeEnabled({
  isDevelopment,
  search = "",
  sessionStorage,
  hasMaxSession = true,
}) {
  if (!isDevelopment) return false;

  if (new URLSearchParams(search).get("guest") === "1") return true;

  try {
    if (sessionStorage?.getItem(GUEST_MODE_STORAGE_KEY) === "1") return true;
  } catch {
    return !hasMaxSession;
  }

  return !hasMaxSession;
}

export function persistGuestMode(sessionStorage, enabled) {
  try {
    if (enabled) sessionStorage?.setItem(GUEST_MODE_STORAGE_KEY, "1");
    else sessionStorage?.removeItem(GUEST_MODE_STORAGE_KEY);
  } catch {
    return false;
  }
  return true;
}
