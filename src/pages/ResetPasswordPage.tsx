import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Tabs';

type PageState = 'checking' | 'valid' | 'invalid' | 'success';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [pageState, setPageState] = useState<PageState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      return;
    }
    let cancelled = false;
    authApi
      .validateResetToken(token)
      .then(() => !cancelled && setPageState('valid'))
      .catch(() => !cancelled && setPageState('invalid'));
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (pageState !== 'success') return;
    const timer = setTimeout(() => navigate('/login', { replace: true }), 2500);
    return () => clearTimeout(timer);
  }, [pageState, navigate]);

  // Same rules as the Signup page
  const validate = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      showToast('Password reset successfully. Please log in with your new password.', 'success');
      setPageState('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      // A token that expired or was used while the form was open
      if (/invalid or has expired/i.test(message)) setPageState('invalid');
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const headings: Record<PageState, { title: string; subtitle: string }> = {
    checking: { title: 'Reset Password', subtitle: 'Checking your reset link…' },
    valid: { title: 'Set a New Password', subtitle: 'Choose a new password for your account.' },
    invalid: { title: 'Link Expired', subtitle: 'This reset link is invalid, expired or has already been used.' },
    success: { title: 'Password Updated', subtitle: 'Redirecting you to log in…' },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-2xl shadow-xl shadow-primary-600/20 mb-4">
            Ω
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{headings[pageState].title}</h1>
          <p className="text-sm text-gray-500 mt-2">{headings[pageState].subtitle}</p>
        </div>

        {pageState === 'checking' && (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        )}

        {pageState === 'valid' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              helperText="Minimum 8 characters"
              autoComplete="new-password"
              autoFocus
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
            />

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading} icon={<KeyRound className="w-4 h-4" />}>
              Reset Password
            </Button>
          </form>
        )}

        {pageState === 'invalid' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p>Reset links expire after 30 minutes and work only once. Request a new link to continue.</p>
            </div>
            <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => navigate('/forgot-password', { replace: true })}>
              Request new link
            </Button>
          </div>
        )}

        {pageState === 'success' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p>Your password has been changed and you've been logged out on other devices.</p>
            </div>
            <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => navigate('/login', { replace: true })}>
              Go to login
            </Button>
          </div>
        )}

        {pageState !== 'success' && (
          <div className="text-center pt-4 border-t border-gray-100">
            <Link to="/login" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold">
              <ArrowLeft className="w-3 h-3" /> Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
