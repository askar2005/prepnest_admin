import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim()) { setError('Name is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/admin/signup', form);
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      const details = err?.response?.data?.details;
      if (details && typeof details === 'object') {
        const messages = Object.values(details).flat().join('; ');
        setError(messages || err?.response?.data?.message || 'Signup failed');
      } else {
        setError(err?.response?.data?.message || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-[16px] border border-slate-200 bg-white p-8 shadow-soft">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Admin access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Create Admin</h1>
          <p className="mt-2 text-sm text-slate-500">Register a new admin account.</p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Full Name</span>
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Admin Name" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="admin@example.com" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <div className="relative">
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" className="pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
        <div className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
        </div>
      </form>
    </main>
  );
}
