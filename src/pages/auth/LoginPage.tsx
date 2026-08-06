import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  // Refs are the source of truth at submit time: browser autofill can update the
  // DOM without firing React onChange, leaving state stale — reading the live DOM
  // value defeats that race (a common cause of intermittent 401s).
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const sessionExpired = window.sessionStorage.getItem('prepnest_session_expired');
  if (sessionExpired) window.sessionStorage.removeItem('prepnest_session_expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) {
      return;
    }
    const liveEmail = (emailRef.current?.value ?? form.email).trim();
    const livePassword = passwordRef.current?.value ?? form.password;
    setError('');
    if (!liveEmail) { setError('Email is required'); return; }
    if (!livePassword) { setError('Password is required'); return; }
    setLoading(true);
    submittingRef.current = true;
    try {
      const { data } = await apiClient.post('/admin/login', { email: liveEmail, password: livePassword });
      window.localStorage.setItem('prepnest_token', data.token);
      window.localStorage.setItem('prepnest_user', JSON.stringify(data.admin));
      navigate('/');
    } catch (err: any) {
      const status = err?.response?.status;
      const details = err?.response?.data?.details;
      const serverMsg = err?.response?.data?.message;
      let msg = serverMsg || 'Login failed';
      if (details && typeof details === 'object') {
        const msgs = Object.values(details).flat().join('; ');
        if (msgs) msg = msgs;
      }
      if (status === 403 && serverMsg?.includes('verify your email')) {
        navigate(`/verify-email?email=${encodeURIComponent(liveEmail)}`);
        return;
      }
      if (status === 401) {
        msg = 'Invalid email or password. Double-check for a typo or trailing space.';
      }
      setError(msg);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-[16px] border border-slate-200 bg-white p-8 shadow-soft">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Admin access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">PrepNest Admin</h1>
        </div>
        {sessionExpired ? (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle size={16} className="shrink-0" />
            Session expired. Please login again.
          </div>
        ) : null}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <Input ref={emailRef} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="admin@example.com" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <div className="relative">
            <Input ref={passwordRef} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type={showPassword ? 'text' : 'password'} placeholder="Enter password" className="pr-10" autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">Forgot password?</Link>
          <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700">Create account</Link>
        </div>
      </form>
    </main>
  );
}
