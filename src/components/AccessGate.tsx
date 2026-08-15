import { useState, type FormEvent, type ReactNode } from 'react';

const GATE_KEY = 'ca_studio_gate';
const GATE_USER = 'mr.sagar@castudio.org';
const GATE_PASS = '34GBh$#yuodh';

export default function AccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem(GATE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim() === GATE_USER && password === GATE_PASS) {
      try {
        localStorage.setItem(GATE_KEY, '1');
      } catch {
        // storage unavailable — still unlock for this session
      }
      setUnlocked(true);
    } else {
      setError('Invalid username or password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-5"
      >
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">CA Studio</h1>
          <p className="text-sm text-gray-500">Sign in to continue</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="gate-username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            id="gate-username"
            type="text"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={e => {
              setUsername(e.target.value);
              setError('');
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="gate-password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="gate-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              setError('');
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-md bg-gray-900 text-white text-sm font-medium py-2.5 hover:bg-gray-800 transition-colors"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
