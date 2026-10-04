import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Briefcase, Check, X, ArrowRight, ArrowLeft, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { syncOnSignIn } from '@/lib/sync/cloudSync';
import {
  markSignedIn, checkPassword, isValidEmail,
  hasLocalAccount, saveLocalCredential, verifyLocalCredential, clearLocalCredential,
} from '@/lib/authGate';
import { BrandLogo } from '@/components/layout/BrandLogo';

// Access mode is chosen here and persisted; the sidebar reads it (no selector there).
const ACCESS_MODE_KEY = 'ca_access_mode';
type AccessMode = 'professional' | 'business';

const PROFESSIONAL_FEATURES = [
  'Journal, Cash Book & Ledger Accounts',
  'Trial Balance & Schedule III financials',
  'Profit & Loss, Balance Sheet & Notes',
  'Cash Flow & Funds Flow statements',
  'GST — GSTR-1, GSTR-3B, ITC, E-way Bill',
  'Income Tax, TDS & TCS registers',
  'Advance Tax & Deferred Tax',
  'Depreciation & Fixed Assets',
  'Audit, CARO & Directors’ Report',
  'Bank Reconciliation & Bank Import',
  'Tally import (JSON)',
  'Ratio Analysis & special accounts',
];

const BUSINESS_FEATURES = [
  'Sales & Purchase Registers',
  'Sales & Purchase Returns',
  'Bills Receivable & Bills Payable',
  'GST filing & summaries',
  'Bank Accounts',
  'Bank Statement Importer',
  'Cash Flow Statement',
];

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'sign' | 'profile'>('sign');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  // Advance to the profile step exactly once, after a session exists. Idempotent
  // so the auth-state listener and the email/password handler can't double-fire.
  const advancedRef = useRef(false);
  const enterProfile = useCallback(async () => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    try { await syncOnSignIn(); } catch { /* best-effort cloud merge */ }
    setStep('profile');
  }, []);

  // Detect a sign-in that completes via a browser redirect — Google OAuth returns
  // to /auth and exchanges the URL `?code=` for a session ASYNCHRONOUSLY. A
  // one-shot getSession() on mount races that exchange and misses it, stranding
  // the user back on the auth page; listening to onAuthStateChange catches the
  // session the moment the exchange finishes.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => { if (data.session) enterProfile(); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) enterProfile();
    });
    return () => sub.subscription.unsubscribe();
  }, [enterProfile]);

  // Email + password sign-in / sign-up. The password is one the user creates
  // here (not their email account's password) and must meet the rules below.
  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && !name.trim()) return toast.error('Please enter your full name.');
    if (!email.trim()) return toast.error('Please enter your email.');
    if (!isValidEmail(email)) return toast.error('Please enter a valid email address.');
    if (!password) return toast.error('Please enter your password.');
    if (mode === 'signup') {
      if (!checkPassword(password).ok) {
        return toast.error('Password needs 8+ characters with an uppercase letter, a number and a special character.');
      }
      if (!confirm) return toast.error('Please confirm your password.');
      if (password !== confirm) return toast.error('Passwords do not match.');
    }

    const em = email.trim();

    // Real email auth when Supabase is configured; otherwise a local account.
    if (isSupabaseConfigured && supabase) {
      setBusy(true);
      try {
        const creds = { email: em, password };
        const { data, error } =
          mode === 'signup'
            ? await supabase.auth.signUp({ ...creds, options: { emailRedirectTo: `${window.location.origin}/auth` } })
            : await supabase.auth.signInWithPassword(creds);
        if (error) { toast.error(error.message); return; }
        // If email confirmation is ON, sign-up returns no session until the link
        // is clicked — don't fake entry; send them back to sign in.
        if (mode === 'signup' && !data.session) {
          toast.success('Account created — check your email to confirm, then sign in.');
          setMode('login');
          return;
        }
        toast.success(mode === 'login' ? 'Signed in' : 'Account created');
        await enterProfile();
      } finally {
        setBusy(false);
      }
      return;
    }

    // Offline: the account is created and checked on this device.
    setBusy(true);
    try {
      if (mode === 'signup') {
        await saveLocalCredential(em, password);
        toast.success('Account created');
        await enterProfile();
      } else {
        if (!hasLocalAccount()) {
          toast.error('No account found on this device — please sign up first.');
          setMode('signup');
          return;
        }
        if (!(await verifyLocalCredential(em, password))) {
          toast.error('Incorrect email or password.');
          return;
        }
        toast.success('Signed in');
        await enterProfile();
      }
    } finally {
      setBusy(false);
    }
  };

  // Offline password reset: clear the stored account and start a fresh sign-up.
  const handleForgot = () => {
    if (isSupabaseConfigured) {
      toast.info('Use "Continue with Google", or reset from the link sent to your email.');
      return;
    }
    clearLocalCredential();
    setMode('signup');
    setPassword('');
    setConfirm('');
    toast.info('Create a new password to continue.');
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      setBusy(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) { toast.error(error.message); setBusy(false); }
      // success → browser redirects to Google; useEffect picks up the session on return
    } else {
      toast.success('Signed in with Google');
      setStep('profile');
    }
  };

  const selectProfile = (m: AccessMode) => {
    try { localStorage.setItem(ACCESS_MODE_KEY, m); } catch { /* ignore */ }
    markSignedIn(); // the login gate's offline marker (RequireAuth checks it)
    toast.success(`Continuing as ${m === 'professional' ? 'Professional' : 'Business'}`);
    navigate('/companies');
  };

  // ── Step 2: choose profile ─────────────────────────────────────────────────
  if (step === 'profile') {
    return (
      <div className="min-h-screen app-surface flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Choose your workspace</h2>
              <p className="text-sm text-gray-500 mt-0.5">Select the profile that fits you — it tailors the menu to what you need.</p>
            </div>
            <button onClick={() => setStep('sign')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors shrink-0">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <ProfileCard icon={<Building2 className="h-5 w-5" />} title="Professional"
              subtitle="For Chartered Accountants & accountants" features={PROFESSIONAL_FEATURES}
              onSelect={() => selectProfile('professional')} />
            <ProfileCard icon={<Briefcase className="h-5 w-5" />} title="Businessman"
              subtitle="For business owners & traders" features={BUSINESS_FEATURES}
              onSelect={() => selectProfile('business')} />
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: sign in / sign up (split card) ─────────────────────────────────
  const inp = "w-full h-11 pl-11 pr-4 text-sm bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400 transition-colors";
  const pc = checkPassword(password);

  return (
    <div className="min-h-screen app-surface flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl bg-white overflow-hidden border border-gray-100 shadow-[0_28px_60px_-22px_rgba(8,40,48,0.28)]">

        {/* ── Left: WELCOME panel (same deep-teal hero as the in-app dashboard) ── */}
        <div className="hero relative hidden md:flex flex-col justify-center px-10 py-16 text-white overflow-hidden !rounded-none">
          {/* soft rings */}
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -top-12 -right-10 h-48 w-48 rounded-full border border-white/10" />
          {/* rising-graph motif — echoes the dashboard header */}
          <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-20" viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points="0,82 60,66 120,72 180,48 240,56 300,36 360,44 420,24 480,32 540,14 600,22"
              fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="relative">
            <span className="mb-6 inline-flex items-center rounded-[14px] bg-white px-4 py-2.5 shadow-[0_8px_24px_-12px_rgba(7,22,44,0.6)]">
              <BrandLogo height={34} />
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-none">WELCOME</h2>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] hero-muted">All in one place</p>
            <ul className="mt-3.5 space-y-2.5">
              {['Auditing', 'Accounting', 'GST', 'ITR filing', 'TDS & TCS'].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[15px] font-semibold text-white">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="px-8 py-12 sm:px-10 sm:py-14">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>

          <form onSubmit={handleSignSubmit} className="mt-6 space-y-3.5">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input className={inp} type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input className={`${inp} pr-16`} type={showPwd ? 'text' : 'password'} value={password}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
              <button type="button" onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700">
                {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {showPwd ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            {mode === 'signup' && password.length > 0 && (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 px-1 pt-0.5">
                <PwdRule ok={pc.length}>8+ characters</PwdRule>
                <PwdRule ok={pc.upper}>Uppercase letter</PwdRule>
                <PwdRule ok={pc.number}>Number</PwdRule>
                <PwdRule ok={pc.special}>Special character</PwdRule>
              </ul>
            )}
            {mode === 'signup' && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className={inp} type={showPwd ? 'text' : 'password'} value={confirm} autoComplete="new-password"
                  onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" required />
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Remember me
                </label>
                <button type="button" onClick={handleForgot}
                  className="font-bold text-blue-600 hover:text-blue-700">Forgot Password?</button>
              </div>
            )}

            <button type="submit" disabled={busy}
              className="btn-pill-primary w-full h-11 mt-1 disabled:opacity-60">
              {mode === 'login' ? 'Sign in' : 'Create account'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Or divider */}
          <div className="flex items-center gap-3 my-4">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Or</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google */}
          <button type="button" onClick={signInWithGoogle} disabled={busy}
            className="w-full h-11 inline-flex items-center justify-center gap-2.5 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60">
            <GoogleIcon /> Continue with Google
          </button>

          {/* toggle */}
          <p className="text-center text-xs text-gray-500 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="font-bold text-blue-600 hover:text-blue-700">
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/** One password requirement, ticked green when met. */
function PwdRule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 text-[11px] font-medium ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      {ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
      {children}
    </li>
  );
}

function ProfileCard({
  icon, title, subtitle, features, onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  features: string[];
  onSelect: () => void;
}) {
  return (
    <div className="stat-card !p-0 flex flex-col h-[460px] overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-gray-100">
        <span className="icon-badge"><span className="text-white">{icon}</span></span>
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold tracking-tight text-gray-900 leading-tight">{title}</h3>
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">What you get</p>
        <ul className="space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Check className="h-3 w-3" />
              </span>
              <span className="leading-snug">{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-gray-100">
        <button onClick={onSelect} className="btn-pill-primary w-full">
          Select
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
