import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export const SignupPage: React.FC = () => {
  const [tenantName, setTenantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    tenantName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!tenantName.trim()) newErrors.tenantName = 'Company name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
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
      await signup(tenantName, email, password);
      showToast('Account created successfully! Welcome to Omni Platform', 'success');
      navigate('/');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Signup failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 p-12 items-center justify-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-8 max-w-lg">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-2xl mb-6">
              Ω
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Start Your Omnichannel Journey Today
            </h2>
            <p className="text-lg text-primary-100">
              Join hundreds of businesses using Omni Platform to connect with customers across WhatsApp, Telegram, and more.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Connect WhatsApp via Meta Embedded Signup in 60 seconds',
              'Build automated flows without any coding',
              'Run broadcast & drip campaigns effortlessly',
              'Manage deals with visual CRM pipeline',
              'Full-text search across all messages',
              'Multi-tenant SaaS with complete isolation',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <span className="text-sm text-primary-50">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/10">
            <p className="text-xs text-primary-200 italic">
              "Omni Platform reduced our customer response time by 70%. The flow builder is incredible!" <br />
              <span className="font-semibold text-white mt-1 block">— Sarah J., E-commerce Owner</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create Your Account</h1>
            <p className="text-sm text-gray-500 mt-2">Get started with Omni Platform in minutes</p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Company Name"
              type="text"
              placeholder="Acme Inc."
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              error={errors.tenantName}
              leftIcon={<Building2 className="w-4 h-4" />}
              helperText="This will be your unique tenant identifier"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              helperText="Minimum 8 characters"
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
            />

            <div className="text-xs text-gray-500 pt-2">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-semibold underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-semibold underline">
                Privacy Policy
              </Link>
              .
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Create Account
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Log in <ArrowRight className="w-3 h-3 inline" />
              </Link>
            </p>
          </div>

          {/* Legal Compliance Footer */}
          <div className="pt-4 text-center">
            <div className="flex items-center justify-center gap-3 text-[11px] text-gray-400">
              <Link to="/privacy" className="hover:text-primary-600 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-primary-600 transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/data-deletion" className="hover:text-primary-600 transition-colors">
                Data Deletion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
