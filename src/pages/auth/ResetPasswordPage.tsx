import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const otp = searchParams.get('otp') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await apiClient.post('/admin/reset-password', { email, otp, password });
      setSuccess(true);
    } catch (err: any) {
      const details = err?.response?.data?.details;
      if (details && typeof details === 'object') {
        const msgs = Object.values(details).flat().join('; ');
        setError(msgs || err?.response?.data?.message || 'Reset failed');
      } else {
        setError(err?.response?.data?.message || 'Reset failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full space-y-6 text-center rounded-[16px] border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Password Reset!</h1>
          <p className="text-sm text-slate-500">Your password has been updated successfully.</p>
          <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-6 text-sm font-medium text-white hover:bg-brand-600 transition">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-[16px] border border-slate-200 bg-white p-8 shadow-soft">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Reset password</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Choose a new password</h1>
          <p className="mt-2 text-sm text-slate-500">Must be at least 8 characters.</p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">New Password</span>
          <div className="relative">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" className="pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Confirm Password</span>
          <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Re-enter new password" />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </main>
  );
}
