export const AUTH_COOKIE_NAME = "inventory_session";
export const AUTH_COOKIE_VALUE = "local";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export function isValidAuthCookie(value: string | undefined) {
  return value === AUTH_COOKIE_VALUE;
}

export function shouldSetSecureAuthCookie() {
  return process.env.NODE_ENV === "production";
}
