import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2, Wifi } from 'lucide-react';
import { sandboxClient } from '@/lib/gst/sandbox/client';

type State = 'checking' | 'connected' | 'error';

/**
 * Live status of the Sandbox GST API connection. Calls the server `status`
 * action (which authenticates with the server-side key/secret — no taxpayer
 * data touched) and reflects TEST vs LIVE from the resolved host. This is the
 * "is the live software actually connected" signal on the GST cockpit.
 */
export function GstConnectionStatus() {
  const [state, setState] = useState<State>('checking');
  const [host, setHost] = useState('');
  const [error, setError] = useState('');

  const check = useCallback(async () => {
    setState('checking');
    setError('');
    const r = await sandboxClient.status();
    if (r.ok && r.data?.authenticated) {
      setState('connected');
      setHost(r.data.host || '');
    } else {
      setState('error');
      setHost(r.data?.host || '');
      setError(r.error || 'Not authenticated — check SANDBOX_API_KEY / SANDBOX_API_SECRET.');
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const isTest = host.includes('test');
  const envBadge = host
    ? (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isTest ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
        {isTest ? 'Test' : 'Live'}
      </span>
    )
    : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          state === 'connected' ? 'bg-emerald-50 text-emerald-600'
            : state === 'error' ? 'bg-red-50 text-red-500'
            : 'bg-blue-50 text-blue-500'
        }`}>
          <Wifi className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">Sandbox GST API</p>
            {envBadge}
            {state === 'checking' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" /> checking…
              </span>
            )}
            {state === 'connected' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connected
              </span>
            )}
            {state === 'error' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" /> Not connected
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-gray-400" title={error || host}>
            {state === 'error' ? error : host ? `Host: ${host}` : 'Resolving host…'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={check}
        disabled={state === 'checking'}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${state === 'checking' ? 'animate-spin' : ''}`} />
        Test connection
      </button>
    </div>
  );
}
