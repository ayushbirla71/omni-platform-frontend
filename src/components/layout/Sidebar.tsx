import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Radio,
  Workflow,
  Users,
  Megaphone,
  KanbanSquare,
  Search,
  Terminal,
  LogOut,
  Building2,
  ShieldCheck,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Badge } from '../common/Badge';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const baseNav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Team Inbox', href: '/inbox', icon: MessageSquare },
    { name: 'Channels', href: '/channels', icon: Radio },
    { name: 'Flow Builder', href: '/flows', icon: Workflow },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'Deals & CRM', href: '/deals', icon: KanbanSquare },
    { name: 'Global Search', href: '/search', icon: Search },
  ];

  const navigation =
    user?.role === 'owner' || user?.role === 'admin'
      ? [...baseNav, { name: 'System Logs', href: '/system-logs', icon: Terminal }]
      : baseNav;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 border-r border-slate-800 shadow-xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">
            Ω
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Omni Platform</h1>
            <p className="text-[11px] text-slate-400 font-medium">Multi-Tenant SaaS</p>
          </div>
        </div>

        {/* Tenant Info Card */}
        <div className="px-4 py-3 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="w-4 h-4 text-primary-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">
                Tenant: {user?.tenantId?.substring(0, 8)}...
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active</span>
              </div>
            </div>
          </div>
          <Badge variant="purple" size="sm" className="bg-purple-900/60 text-purple-300 border-purple-700/50">
            {user?.role}
          </Badge>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group',
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout footer */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <div className="p-2 rounded-xl bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-primary-300 uppercase">
                {user?.email ? user.email.substring(0, 2) : 'US'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-primary-400" />
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Legal Links */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/data-deletion" className="hover:text-slate-300 transition-colors">Data Deletion</Link>
          </div>
        </div>
      </aside>
    </>
  );
};
