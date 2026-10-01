/* Route prefetch: start downloading a page's code when the user shows intent
 * (hovers or focuses a nav link), so the click finds the chunk already loaded.
 *
 * Pages are declared with `lazyPage` instead of React.lazy. It memoises the
 * import() thunk and exposes it as `.preload`, so React's own render-time load
 * and a prefetch share the SAME promise and the page is fetched once however
 * it is reached. routes.tsx registers the router's route tree here, and
 * prefetchRoute() resolves an href with react-router's own matchRoutes — no
 * second copy of the path table to keep in sync. */

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { matchRoutes, type RouteObject } from 'react-router-dom';

type Preload = () => Promise<unknown>;

export type PrefetchableComponent<T extends ComponentType<any>> =
  LazyExoticComponent<T> & { preload: Preload };

/** React.lazy with a shared, memoised loader exposed as `.preload`.
 *  A failed load is forgotten, so a network blip during a hover never poisons
 *  the real navigation — it simply retries (React.lazy caches only the attempt
 *  it made itself, exactly as before). */
export function lazyPage<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): PrefetchableComponent<T> {
  let pending: Promise<{ default: T }> | undefined;
  const load = () =>
    (pending ??= factory().catch((err) => {
      pending = undefined;
      throw err;
    }));
  const component = lazy(load) as PrefetchableComponent<T>;
  component.preload = load;
  return component;
}

let registeredRoutes: RouteObject[] = [];

/** Called once by routes.tsx with the router's route tree. */
export function registerPrefetchRoutes(routes: RouteObject[]): void {
  registeredRoutes = routes;
}

/** Find the lazyPage component inside a route element such as
 *  `<Suspense fallback={…}><JournalPage /></Suspense>`. Redirects
 *  (`<Navigate …/>`) have none and are skipped. */
function findPreload(node: unknown, depth = 0): Preload | undefined {
  if (!node || typeof node !== 'object' || depth > 4) return undefined;
  const el = node as { type?: unknown; props?: { children?: unknown } };
  const preload = (el.type as { preload?: unknown } | undefined)?.preload;
  if (typeof preload === 'function') return preload as Preload;
  const kids = el.props?.children;
  if (Array.isArray(kids)) {
    for (const kid of kids) {
      const found = findPreload(kid, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  return findPreload(kids, depth + 1);
}

/** Warm every lazy chunk on the route branch that `href` resolves to (layout +
 *  page). Safe to call repeatedly — the loaders are memoised, so a chunk that
 *  is already loaded or loading costs nothing. Never throws. */
export function prefetchRoute(href: string): void {
  if (registeredRoutes.length === 0) return;
  const path = href.split(/[?#]/)[0];
  const matches = matchRoutes(registeredRoutes, path);
  if (!matches) return;
  for (const { route } of matches) {
    const preload = findPreload(route.element);
    // A failure is surfaced by the real navigation, which retries the import.
    if (preload) preload().catch(() => {});
  }
}
