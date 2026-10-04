'use client';

/* ─────────────────────────────────────────────────────────────────────────────
   E-Filing confirmation — shown right after the ITR "Export return" button
   downloads the return JSON. Asks whether to proceed to the Income Tax e-Filing
   portal; on Yes it opens the official login page in a new tab, where the user
   signs in (PAN + password) and uploads the JSON they just exported.

   No Chrome extension or stored credentials: a government login cannot and
   should not be automated, so the portal simply opens and the user takes over.
   ──────────────────────────────────────────────────────────────────────────── */
import { useEffect, useState } from 'react';
import { ShieldCheck, ExternalLink, X, Check } from 'lucide-react';

/** Official Income Tax e-Filing login portal. */
export const EFILING_URL = 'https://eportal.incometax.gov.in/iec/foservices/#/login';

const CSS = `
.ef-overlay{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:20px;
  background:rgba(10,31,62,.42);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
  animation:ef-fade 180ms ease both}
.ef-card{width:min(460px,100%);background:#fff;border:1px solid var(--sand);border-radius:16px;overflow:hidden;
  box-shadow:0 30px 70px -28px rgba(10,31,62,.6);animation:ef-pop 220ms cubic-bezier(.2,.8,.3,1) both}
.ef-head{display:flex;align-items:center;gap:12px;padding:18px 20px 14px}
.ef-ico{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;
  background:var(--navy-soft);color:var(--navy);flex-shrink:0}
.ef-title{font-size:16px;font-weight:800;color:var(--ink);line-height:1.2}
.ef-sub{margin-top:2px;font-size:12px;color:var(--ink-3)}
.ef-x{margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;
  color:var(--ink-3);transition:background-color 150ms ease,color 150ms ease}
.ef-x:hover{background:var(--navy-soft);color:var(--navy)}
.ef-body{padding:2px 20px 4px}
.ef-q{font-size:13.5px;color:var(--ink-2);line-height:1.5;margin-bottom:14px}
.ef-opts{display:flex;flex-direction:column;gap:9px}
.ef-opt{display:flex;align-items:center;gap:11px;width:100%;padding:11px 13px;border-radius:12px;cursor:pointer;
  border:1.5px solid var(--sand);background:var(--cream-2);text-align:left;
  transition:border-color 150ms ease,background-color 150ms ease}
.ef-opt:hover{border-color:var(--sand-2)}
.ef-opt[data-on="true"]{border-color:var(--navy);background:var(--navy-soft)}
.ef-box{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;flex-shrink:0;
  border:1.5px solid var(--sand-2);background:#fff;color:#fff;transition:background-color 150ms ease,border-color 150ms ease}
.ef-opt[data-on="true"] .ef-box{background:var(--navy);border-color:var(--navy)}
.ef-box svg{width:13px;height:13px;opacity:0;transition:opacity 120ms ease}
.ef-opt[data-on="true"] .ef-box svg{opacity:1}
.ef-opt-label{font-size:13.5px;font-weight:600;color:var(--ink)}
.ef-opt-desc{font-size:11.5px;color:var(--ink-3);margin-top:1px}
.ef-note{display:flex;gap:9px;margin-top:14px;padding:11px 12px;border-radius:11px;background:var(--cream-2);border:1px solid var(--sand)}
.ef-note b{color:var(--ink-2);font-weight:700}
.ef-note p{font-size:11.5px;line-height:1.5;color:var(--ink-3)}
.ef-foot{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 20px 18px}
.ef-btn{height:40px;padding:0 18px;border-radius:11px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:8px;transition:background-color 150ms ease,color 150ms ease,border-color 150ms ease,transform 150ms ease}
.ef-btn-ghost{color:var(--ink-2);border:1.5px solid var(--sand);background:#fff}
.ef-btn-ghost:hover{border-color:var(--sand-2);color:var(--ink)}
.ef-btn-primary{color:#fff;background:var(--navy);box-shadow:0 10px 24px -12px rgba(23,69,127,.6)}
.ef-btn-primary:hover:not(:disabled){background:var(--navy-2);transform:translateY(-1px)}
.ef-btn-primary:disabled{background:var(--sand);color:var(--ink-3);box-shadow:none;cursor:not-allowed}
@keyframes ef-fade{from{opacity:0}to{opacity:1}}
@keyframes ef-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.ef-overlay,.ef-card{animation:none!important}}
`;

interface Props {
  open: boolean;
  onClose: () => void;
  /** The return name for the copy, e.g. "ITR-6". */
  formLabel?: string;
}

export function EFilingModal({ open, onClose, formLabel }: Props) {
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);

  // reset the choice each time the dialog opens
  useEffect(() => { if (open) setChoice(null); }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const proceed = () => {
    if (choice === 'yes') {
      // user gesture → the new tab is not popup-blocked
      window.open(EFILING_URL, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  return (
    <div className="ef-overlay" onClick={onClose} role="presentation">
      <style>{CSS}</style>
      <div
        className="ef-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ef-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ef-head">
          <span className="ef-ico"><ShieldCheck className="h-5 w-5" strokeWidth={1.8} /></span>
          <div>
            <div className="ef-title" id="ef-title">Proceed with e-Filing?</div>
            <div className="ef-sub">{formLabel ? `${formLabel} · ` : ''}Income Tax Department portal</div>
          </div>
          <button type="button" className="ef-x" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="ef-body">
          <p className="ef-q">
            Would you like to continue to the official Income Tax e-Filing portal to upload your
            return now?
          </p>

          <div className="ef-opts">
            <button type="button" className="ef-opt" data-on={choice === 'yes'} onClick={() => setChoice('yes')} aria-pressed={choice === 'yes'}>
              <span className="ef-box"><Check strokeWidth={3} /></span>
              <span>
                <span className="ef-opt-label">Yes, open the e-Filing portal</span>
                <span className="ef-opt-desc">Opens incometax.gov.in in a new tab</span>
              </span>
            </button>
            <button type="button" className="ef-opt" data-on={choice === 'no'} onClick={() => setChoice('no')} aria-pressed={choice === 'no'}>
              <span className="ef-box"><Check strokeWidth={3} /></span>
              <span>
                <span className="ef-opt-label">No, not now</span>
                <span className="ef-opt-desc">Stay here — the file is already downloaded</span>
              </span>
            </button>
          </div>

          {choice === 'yes' && (
            <div className="ef-note">
              <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--navy)' }} strokeWidth={1.8} />
              <p>
                <b>Next, on the portal:</b> log in with your PAN &amp; password, then go to
                <b> e-File → Income Tax Returns → Upload</b> and select the <b>.json</b> you just exported.
                For your security, Yukti never stores or enters your portal credentials.
              </p>
            </div>
          )}
        </div>

        <div className="ef-foot">
          <button type="button" className="ef-btn ef-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="ef-btn ef-btn-primary" onClick={proceed} disabled={choice === null}>
            {choice === 'no' ? 'Done' : <>Proceed <ExternalLink className="h-4 w-4" strokeWidth={2} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EFilingModal;
