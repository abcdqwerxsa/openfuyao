/**
 * Returns the configured base path for the console.
 * Empty string when served at root "/", "/console" when served at subpath.
 * Injected by console-service static proxy based on X-Forwarded-Prefix header.
 */
export function getBasePath() {
  return window.__CONSOLE_BASE_PATH__ || '';
}

/**
 * Prefix a path with the base path.
 * e.g., with basePath="/console": withBasePath('/rest/auth/login') => '/console/rest/auth/login'
 */
export function withBasePath(path) {
  const base = getBasePath();
  if (!base) return path;
  return base + path;
}

/**
 * Returns pathname with basePath stripped, for positional parsing.
 * e.g., at URL /console/container_platform/overview with basePath="/console":
 *   returns "/container_platform/overview"
 */
export function getEffectivePathname() {
  const base = getBasePath();
  return window.location.pathname.slice(base.length) || '/';
}
