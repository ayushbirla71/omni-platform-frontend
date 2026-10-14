import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, MailCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

const RESEND_COOLDOWN_SECONDS = 60;

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { showToast } = useToast();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const validate = (): boolean => {
    let newError: string | undefined;
    if (!email.trim()) newError = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newError = 'Invalid email format';
    setError(newError);
    return !newError;
  };

  const sendLink = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setIsSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset link';
      if (/deactivated/i.test(message)) {
        setIsSent(false);
        setError(message);
      } else {
        showToast(message, 'error');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await sendLink();
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    if (await sendLink()) showToast('Reset link sent again', 'success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-2xl shadow-xl shadow-primary-600/20 mb-4">
            Ω
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isSent ? 'Check your inbox' : 'Forgot Password?'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {isSent
              ? "If an account exists for this email, we've sent a password reset link."
              : "Enter your account email and we'll send you a link to reset your password."}
          </p>
        </div>

        {isSent ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary-50 border border-primary-100">
              <MailCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  We sent it to <span className="font-semibold text-gray-900">{email.trim()}</span>.
                </p>
                <p>The link expires in 30 minutes. Check your spam folder if you don't see it.</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleResend}
              isLoading={isLoading}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'}
            </Button>

            <button
              type="button"
              onClick={() => setIsSent(false)}
              className="w-full text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              autoFocus
            />

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading} icon={<Send className="w-4 h-4" />}>
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="text-center pt-4 border-t border-gray-100">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold">
            <ArrowLeft className="w-3 h-3" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
