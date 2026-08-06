// Environment banner for every GST surface. On LIVE: an unmissable red
// "⚠ PRODUCTION — REAL GSTN · {GSTIN}" bar. On TEST: a subtle neutral badge.
// Environment comes from the server (useGstEnv), never a hardcoded flag.
//
//   <GstEnvBanner />                     page banner — self-gates to /gst routes
//   <GstEnvBanner placement="modal" />   inside a filing/download modal (always paints)
//   <GstEnvBadge />                       compact pill for the connection-light area

import { useLocation } from 'react-router-dom';
import { useCompany } from '@/hooks/useCompany';
import { useGstEnv } from '@/lib/gst/useGstEnv';

export function GstEnvBanner({ placement = 'page', gstin: gstinProp }: { placement?: 'page' | 'modal'; gstin?: string }) {
  const env = useGstEnv();
  const location = useLocation();
  const { company } = useCompany();
  const gstin = gstinProp ?? company?.gst_details?.gstin ?? '';

  // Page banner paints only on GST routes; a modal banner always paints (it sits above
  // the page, which the modal overlay hides).
  if (placement === 'page' && !location.pathname.includes('/gst')) return null;
  if (!env) return null; // one-time probe still resolving — no flash

  if (env.mode === 'live') {
    return (
      <div className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white shadow-sm">
        <span aria-hidden>⚠</span>
        <span>PRODUCTION — REAL GSTN</span>
        {gstin ? <span className="font-mono text-[11px] normal-case tracking-normal opacity-90">· {gstin}</span> : null}
      </div>
    );
  }
  // TEST — subtle neutral badge (not alarming)
  return (
    <div className="mb-3">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        TEST environment
      </span>
    </div>
  );
}

/** Quiet environment indicator for the connection-light area — muted text, no shout.
 *  The CA knows the environment; the UI states it plainly without alarm. */
export function GstEnvBadge() {
  const env = useGstEnv();
  if (!env) return null;
  const live = env.mode === 'live';
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400"
      title={live ? 'Live — real GSTN' : 'Sandbox test environment'}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-gray-500' : 'bg-gray-300'}`} />
      {live ? 'Live' : 'Test'}
    </span>
  );
}
