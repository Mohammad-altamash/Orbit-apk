import { useState } from 'react';
import { signUp, signIn } from './auth';

export default function AuthScreen({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-black text-white">
      <div className="mb-10 flex flex-col items-center">
        <img src="/logo.png" alt="ORBIT" width="80" height="80" className="rounded-2xl" />
        <h1 className="text-2xl font-semibold mt-3 tracking-wide">ORBIT</h1>
        <p className="text-xs text-neutral-500 mt-1">Your world. Your people. Your entertainment.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-neutral-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400/40"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full bg-neutral-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400/40"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-400 to-purple-400 text-black rounded-xl py-3 font-medium disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="mt-6 text-sm text-neutral-400"
      >
        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
      </button>
    </div>
  );
}
