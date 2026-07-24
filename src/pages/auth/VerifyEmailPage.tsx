import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { OtpInput } from '../../components/ui/OtpInput';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = useCallback(() => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Enter the complete 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/admin/verify-email', { email, otp });
      if (data.token) {
        window.localStorage.setItem('prepnest_token', data.token);
        window.localStorage.setItem('prepnest_user', JSON.stringify(data.admin));
      }
      setVerified(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      const details = err?.response?.data?.details;
      if (details && typeof details === 'object') {
        const msgs = Object.values(details).flat().join('; ');
        setError(msgs || err?.response?.data?.message || 'Verification failed');
      } else {
        setError(err?.response?.data?.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      await apiClient.post('/admin/resend-otp', { email });
      setCountdown(300);
      setCanResend(false);
      setOtp('');
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full space-y-6 text-center rounded-[16px] border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Email Verified!</h1>
          <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full space-y-6 rounded-[16px] border border-slate-200 bg-white p-8 shadow-soft">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Verify email</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Check your inbox</h1>
          <p className="mt-2 text-sm text-slate-500">We sent a 6-digit code to <strong className="text-slate-900">{email}</strong></p>
        </div>
        <div className="space-y-5">
          <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(''); }} disabled={loading} />
          {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
          <Button onClick={handleVerify} className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>
          <div className="text-center text-sm text-slate-500">
            {!canResend ? (
              <p>Resend code in <span className="font-mono text-slate-700">{formatTime()}</span></p>
            ) : (
              <button onClick={handleResend} disabled={resending} className="font-medium text-brand-600 hover:text-brand-700">
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>
        <div className="text-center text-sm text-slate-600">
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Back to login</Link>
        </div>
      </div>
    </main>
  );
}
