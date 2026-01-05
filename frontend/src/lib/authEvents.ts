export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

/**
 * Emit a global unauthorized event.
 * This is used to avoid hard navigations (full page reloads) when a request returns 401.
 */
export function emitUnauthorized() {
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}

export function onUnauthorized(handler: () => void) {
  const listener = () => handler();
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener as EventListener);
  return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener as EventListener);
}

