import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  FileText,
  Trash2,
  Lock,
  ArrowLeft,
  LogIn,
  ExternalLink,
  CheckCircle2,
  Globe,
  Mail,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../common/Button';

interface PublicLegalLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  lastUpdated?: string;
  badge?: string;
}

export const PublicLegalLayout: React.FC<PublicLegalLayoutProps> = ({
  children,
  title,
  subtitle,
  lastUpdated = 'September 3, 2026',
  badge = 'Compliance & Legal Center',
}) => {
  const location = useLocation();

  const navLinks = [
    {
      name: 'Privacy Policy',
      href: '/privacy',
      icon: Shield,
      description: 'How we collect, use, and protect your data',
    },
    {
      name: 'Terms of Service',
      href: '/terms',
      icon: FileText,
      description: 'Rules and guidelines for using Omni Platform',
    },
    {
      name: 'Data Deletion',
      href: '/data-deletion',
      icon: Trash2,
      description: 'Meta user data deletion instructions & request',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-600/20 group-hover:scale-105 transition-transform">
              Ω
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block">Omni Platform</span>
              <span className="text-[10px] text-slate-500 font-medium -mt-1 block">Legal & Trust Center</span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href === '/privacy' && location.pathname === '/privacy-policy') ||
                (item.href === '/terms' && location.pathname === '/terms-of-service') ||
                (item.href === '/data-deletion' && location.pathname === '/data-deletion-instructions');

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-white text-primary-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Link to="/login">
              <Button variant="outline" size="sm" icon={<LogIn className="w-3.5 h-3.5" />}>
                Log In
              </Button>
            </Link>
            <Link to="/signup" className="hidden sm:inline-flex">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-slate-50/90 px-2 py-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href === '/privacy' && location.pathname === '/privacy-policy') ||
              (item.href === '/terms' && location.pathname === '/terms-of-service') ||
              (item.href === '/data-deletion' && location.pathname === '/data-deletion-instructions');

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-colors',
                  isActive ? 'bg-primary-600 text-white' : 'text-slate-600'
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      {/* Hero Banner Header */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-400/30 text-primary-300 text-xs font-semibold">
            <Lock className="w-3 h-3 text-primary-400" />
            <span>{badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Effective Date: {lastUpdated}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Global Compliance (GDPR, CCPA & Meta WhatsApp Business Policy)
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-10 text-slate-700 leading-relaxed space-y-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Brand */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
                  Ω
                </div>
                <span className="text-sm font-bold text-slate-900">Omni Platform</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enterprise omnichannel communication platform supporting WhatsApp Cloud API, automated Flow Builder graphs, and audience broadcasts.
              </p>
            </div>

            {/* Column 2: Legal & Trust */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Compliance & Legal</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <Link to="/privacy" className="hover:text-primary-600 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary-600 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/data-deletion" className="hover:text-primary-600 transition-colors">
                    User Data Deletion Instructions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform Features */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Features</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <Link to="/login" className="hover:text-primary-600 transition-colors">
                    WhatsApp Cloud API Integration
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-primary-600 transition-colors">
                    Visual Flow Builder Automation
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-primary-600 transition-colors">
                    Broadcast & Contact Tagging
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-primary-600 transition-colors">
                    Omnichannel Team Inbox
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Support & Inquiries */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Privacy & DPO Contact</h4>
              <p className="text-xs text-slate-500">
                For privacy requests, GDPR inquiries, or Meta verification verification assistance:
              </p>
              <div className="flex items-center gap-1.5 text-xs text-primary-600 font-medium">
                <Mail className="w-3.5 h-3.5" />
                <a href="mailto:privacy@omni-platform.com" className="hover:underline">
                  privacy@omni-platform.com
                </a>
              </div>
            </div>
          </div>

          {/* Meta & WhatsApp Disclaimer */}
          <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 space-y-2">
            <p>
              <strong className="text-slate-600">Disclaimer & Third-Party Trademarks:</strong> Omni Platform is an independent SaaS solution. WhatsApp and the WhatsApp logo are registered trademarks of Meta Platforms, Inc. Omni Platform utilizes the official Meta Graph API and WhatsApp Cloud API in strict adherence to the Meta Business Platform Terms and WhatsApp Business Messaging Policies.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
              <p>© {new Date().getFullYear()} Omni Platform. All rights reserved.</p>
              <div className="flex items-center gap-4 text-slate-500">
                <Link to="/privacy" className="hover:text-slate-700">Privacy</Link>
                <span>•</span>
                <Link to="/terms" className="hover:text-slate-700">Terms</Link>
                <span>•</span>
                <Link to="/data-deletion" className="hover:text-slate-700">Data Deletion</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
