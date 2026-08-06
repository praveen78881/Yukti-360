// ── GstConnectButton — the one OTP login/logout entry point for the GST cockpit ─
// A reactive status pill + Connect/Logout button, driven entirely by the shared
// <GstSessionProvider>. Drop it anywhere inside the provider (it lives in the GST
// command center). Connecting here opens ONE session that every GST module reuses.

import { useEffect, useState } from 'react';
import { useGstSession } from '@/components/gst/GstSessionProvider';
import { GstEnvBadge } from '@/components/gst/GstEnvBanner';

export function GstConnectButton({ className = '' }: { className?: string }) {
  const session = useGstSession();
  // Re-render every 30s so the "Xh Ym left" countdown ticks and an expiry flips
  // to "Session expired" without needing a session change to bump the provider.
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const [working, setWorking] = useState(false);
  const st = session.status();

  // Amber "expiring soon" when an active session has <30 minutes left.
  const expiringSoon = st.state === 'active' && st.exp != null && (st.exp - Date.now()) < 30 * 60 * 1000;

  const dot =
    st.state === 'active' ? (expiringSoon ? 'bg-amber-500' : 'bg-emerald-500')
    : st.state === 'expired' ? 'bg-red-500'
    : 'bg-gray-300';
  const pillText =
    st.state === 'active' ? (expiringSoon ? 'text-amber-700' : 'text-emerald-700')
    : st.state === 'expired' ? 'text-red-600'
    : 'text-gray-500';

  const onConnect = async () => {
    setWorking(true);
    try { await session.connect(); } finally { setWorking(false); }
  };
  const onLogout = async () => {
    setWorking(true);
    try { await session.logout(); } finally { setWorking(false); }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Environment indicator — sits with the session state */}
      <GstEnvBadge />
      {/* Status pill */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold shadow-sm">
        <span className={`h-2 w-2 rounded-full ${dot} ${st.state === 'active' ? 'animate-pulse' : ''}`} />
        <span className={pillText}>
          {st.state === 'active' ? `${st.label}${expiringSoon ? ' · expiring soon' : ''}`
            : st.state === 'expired' ? 'Session expired — reconnect'
            : 'Not connected'}
        </span>
      </span>

      {/* Action button */}
      {st.state === 'active' ? (
        <button
          type="button"
          onClick={onLogout}
          disabled={working}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          {working ? 'Working…' : 'Logout'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          disabled={working}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow disabled:opacity-60"
        >
          {working ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          )}
          {st.state === 'expired' ? 'Reconnect' : 'Connect to GST'}
        </button>
      )}
    </div>
  );
}
