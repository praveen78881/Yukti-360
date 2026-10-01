/** Lets a page intercept the shell's Back button (in Header) before it navigates.
 *  A page registers an interceptor that returns true when it consumed the back
 *  press (e.g. closed an in-page drill-in/overlay) — the Header then stays put.
 *  Registration returns an unregister function for useEffect cleanup. */

type BackInterceptor = () => boolean;

let interceptor: BackInterceptor | null = null;

export function setBackInterceptor(fn: BackInterceptor): () => void {
  interceptor = fn;
  return () => { if (interceptor === fn) interceptor = null; };
}

/** Called by the Header's Back button. True → the page handled the back press; skip navigation. */
export function runBackInterceptor(): boolean {
  try { return interceptor ? interceptor() : false; } catch { return false; }
}
