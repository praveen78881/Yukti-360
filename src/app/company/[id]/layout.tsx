import { useState, useRef, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { GstSessionProvider } from '@/components/gst/GstSessionProvider';
import { CarpPanel } from '@/components/carp/CarpPanel';

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 320;
/** Open nav panel width — wide enough for a 30px icon tile, the longest group
    name ("Financial Statements") and its chevron on one line, matching the
    reference sidebar. Closed, the nav is gone entirely — no icon rail — and
    only the bookmark tab is left on the edge. */
const SIDEBAR_DEFAULT = 272;
/** Mobile drawer width — the full panel, sliding in over a veil. */
const DRAWER_WIDTH = 272;
const DESKTOP_QUERY = '(min-width: 1024px)';
/** Remembers open vs. closed per browser — a convenience only. */
const NAV_COLLAPSED_KEY = 'yukti_nav_collapsed';
const LAYOUT_EASE = 'cubic-bezier(0.3, 0.9, 0.3, 1)';

export default function CompanyLayout() {
  const { pathname } = useLocation();
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  );
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try { return localStorage.getItem(NAV_COLLAPSED_KEY) === '1'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [resizing, setResizing] = useState(false);
  const [alezaOpen, setAlezaOpen] = useState(false);
  const [alezaWidth, setAlezaWidth] = useState(360);
  const sidebarResizing = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(NAV_COLLAPSED_KEY, navCollapsed ? '1' : '0'); } catch { /* storage blocked */ }
  }, [navCollapsed]);
  // The mobile drawer gets out of the way as soon as you've picked a page.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const startSidebarResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      sidebarResizing.current = true;
      setResizing(true);
      const startX = e.clientX;
      const startW = sidebarWidth;

      const onMove = (ev: MouseEvent) => {
        if (!sidebarResizing.current) return;
        const newW = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startW + (ev.clientX - startX)));
        setSidebarWidth(newW);
      };
      const onUp = () => {
        sidebarResizing.current = false;
        setResizing(false);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [sidebarWidth],
  );

  const navOpen = isDesktop ? !navCollapsed : mobileOpen;
  const navWidth = isDesktop ? (navCollapsed ? 0 : sidebarWidth) : DRAWER_WIDTH;
  const motion = resizing ? 'none' : `width 280ms ${LAYOUT_EASE}, transform 280ms ${LAYOUT_EASE}, left 280ms ${LAYOUT_EASE}`;

  return (
    <CompanyProvider>
      <GstSessionProvider>
      <div className="h-screen flex flex-col app-surface overflow-hidden">
        <Header
          onMenuToggle={() => setMobileOpen((o) => !o)}
          onAlezaToggle={() => setAlezaOpen((o) => !o)}
          alezaOpen={alezaOpen}
        />
        <div className="relative flex flex-1 min-h-0 min-w-0">
          {/* Mobile veil */}
          {!isDesktop && mobileOpen && (
            <div
              className="fixed inset-0 top-14 bg-[rgba(10,31,62,0.42)] backdrop-blur-[3px] z-40"
              onClick={() => setMobileOpen(false)}
            />
          )}

          {/* Navigation — the 224px panel on desktop (0 when closed), a drawer on
              mobile. Width animates (layout motion, 280ms) and pushes the page
              rather than covering it; resizing drags live with no easing. */}
          <div
            className={isDesktop
              ? 'relative h-full flex flex-col shrink-0 z-20'
              : `fixed left-0 top-14 bottom-0 z-50 flex flex-col ${mobileOpen ? '' : 'pointer-events-none'}`}
            style={{
              width: navWidth,
              overflow: 'hidden',
              transform: !isDesktop && !mobileOpen ? `translateX(-${DRAWER_WIDTH + 12}px)` : undefined,
              transition: motion,
            }}
            inert={!navOpen}
          >
            {/* Fixed inner width, so the panel's content slides rather than squashing */}
            <div className="h-full shrink-0" style={{ width: isDesktop ? sidebarWidth : DRAWER_WIDTH }}>
              <Sidebar />
            </div>
            {/* Resize handle — only on the open desktop panel */}
            {isDesktop && navOpen && (
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-[var(--navy)]/30 transition-colors"
                onMouseDown={startSidebarResize}
              />
            )}
          </div>

          {/* The bookmark — the ONE control for the nav on desktop. It rides the
              panel's edge: arrow points left to close; once closed only this tab
              is left, arrow pointing right, and a click brings the panel back. */}
          {isDesktop && (
            <button
              type="button"
              onClick={() => setNavCollapsed((c) => !c)}
              className="nav-bookmark"
              style={{ left: navWidth, transition: resizing ? 'none' : `left 280ms ${LAYOUT_EASE}, width 160ms ease, background-color 160ms ease, box-shadow 160ms ease` }}
              title={navOpen ? 'Close navigation' : 'Open navigation'}
              aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={navOpen}
            >
              <ChevronLeft
                className="h-4 w-4"
                strokeWidth={1.9}
                style={{ transform: navOpen ? 'none' : 'rotate(180deg)', transition: `transform 280ms ${LAYOUT_EASE}` }}
              />
            </button>
          )}

          {/* Main content */}
          {/* Back now lives in the Header, so pages start at the very top. */}
          <main className="flex-1 min-h-0 overflow-auto pt-[18px] px-5 pb-5 min-w-0">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>

          {/* Aleza Panel */}
          <CarpPanel
            open={alezaOpen}
            onClose={() => setAlezaOpen(false)}
            width={alezaWidth}
            onWidthChange={setAlezaWidth}
          />
        </div>
      </div>
      </GstSessionProvider>
    </CompanyProvider>
  );
}
