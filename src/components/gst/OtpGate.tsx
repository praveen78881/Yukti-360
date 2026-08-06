/** Inline OTP entry, shown while a taxpayer session is being established. */
export function OtpGate({
  otp, setOtp, onVerify, onCancel,
}: {
  otp: string;
  setOtp: (v: string) => void;
  onVerify: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-white p-5 text-center">
      <p className="text-sm font-semibold text-gray-900">Enter the OTP</p>
      <p className="mt-1 text-xs text-gray-500">Sent to the taxpayer's registered mobile/email.</p>
      <div className="mt-3 flex gap-2">
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onVerify(); }}
          placeholder="6-digit OTP"
          maxLength={8}
          inputMode="numeric"
          autoFocus
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center font-mono text-lg tracking-widest focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={onVerify}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Verify
        </button>
      </div>
      <button type="button" onClick={onCancel} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
        Cancel
      </button>
    </div>
  );
}
