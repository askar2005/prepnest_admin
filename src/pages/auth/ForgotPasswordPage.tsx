import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    setLoading(true);
    try {
      await apiClient.post('/admin/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      const details = err?.response?.data?.details;
      if (details && typeof details === 'object') {
        const msgs = Object.values(details).flat().join('; ');
        setError(msgs || err?.response?.data?.message || 'Request failed');
      } else {
        setError(err?.response?.data?.message || 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full space-y-6 text-center rounded-[16px] border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <Mail size={32} className="text-brand-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Check your email</h1>
          <p className="text-sm text-slate-500">If an account exists for <strong>{email}</strong>, we sent a password reset code.</p>
          <Button onClick={() => navigate(`/verify-reset-otp?email=${encodeURIComponent(email)}`)} className="w-full">
            Enter Reset Code
          </Button>
          <button onClick={() => setSent(false)} className="text-sm text-brand-600 hover:text-brand-700">
            Try a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-[16px] border border-slate-200 bg-white p-8 shadow-soft">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Reset password</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Forgot password?</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your email and we'll send you a reset code.</p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="admin@example.com" />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
          {loading ? 'Sending...' : 'Send Reset Code'}
        </Button>
        <div className="text-center text-sm text-slate-600">
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Back to login</Link>
        </div>
      </form>
    </main>
  );
}
