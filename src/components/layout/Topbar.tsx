import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  CheckCheck,
  Trash2,
  Sparkles,
  MessageSquare,
  Users,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  User as UserIcon,
  Building2,
  Key,
  CreditCard,
  ShieldCheck,
  LogOut,
  Copy,
  Check,
  Settings,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../common/Badge';
import { formatRelativeTime, getUserInitials, cn } from '../../lib/utils';
import type { AppNotification } from '../../types';

export const Topbar: React.FC<{ onOpenSidebar: () => void }> = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const {
    notifications,
    unreadCount,
    soundEnabled,
    desktopEnabled,
    permission,
    wsStatus,
    isDropdownOpen,
    setIsDropdownOpen,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    toggleSound,
    toggleDesktop,
    requestPermission,
  } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedTenantId, setCopiedTenantId] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Close notifications and profile dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Notifications dropdown outside click
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }

      // Profile dropdown outside click
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setIsDropdownOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    setIsDropdownOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleCopyTenantId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTenantId(true);
    setTimeout(() => setCopiedTenantId(false), 2000);
    showToast('Tenant ID copied to clipboard', 'info');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.read;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-primary-600" />;
      case 'conversation':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'campaign':
        return <Megaphone className="w-4 h-4 text-emerald-600" />;
      case 'deal':
        return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-md w-full relative hidden sm:block">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search messages, contacts, conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-gray-100/80 border border-transparent hover:bg-gray-100 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all placeholder:text-gray-400"
          />
        </form>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 relative">
        {/* Realtime WebSocket connection status badge */}
        <div
          className={cn(
            'hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border',
            wsStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : wsStatus === 'reconnecting' || wsStatus === 'connecting'
              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          )}
          title={`Realtime WebSocket: ${wsStatus}`}
        >
          {wsStatus === 'connected' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Gateway</span>
            </>
          ) : wsStatus === 'reconnecting' || wsStatus === 'connecting' ? (
            <>
              <Wifi className="w-3 h-3 text-amber-500 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-rose-500" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Meta Tech Provider Active Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-50/60 border border-primary-100 text-xs text-primary-700 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-primary-500" />
          <span>Tech Provider Active</span>
        </div>

        {/* Notification Bell Button */}
        <div className="relative">
          <button
            ref={bellButtonRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'relative p-2 rounded-xl transition-all',
              isDropdownOpen
                ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-500/20'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 rounded-full bg-rose-400 animate-ping opacity-75" />
              </>
            )}
          </button>

          {/* Notification Dropdown Drawer / Popover */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header */}
              <div className="p-3.5 bg-gradient-to-r from-gray-50/80 to-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {/* Quick Preferences & Actions */}
                <div className="flex items-center gap-1">
                  {/* Sound Toggle */}
                  <button
                    onClick={toggleSound}
                    className={cn(
                      'p-1.5 rounded-lg text-xs transition-colors',
                      soundEnabled
                        ? 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    )}
                    title={soundEnabled ? 'Alert sounds: ON' : 'Alert sounds: OFF'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  {/* Desktop Push Notification Permission */}
                  <button
                    onClick={() => {
                      if (permission !== 'granted') {
                        requestPermission();
                      } else {
                        toggleDesktop();
                      }
                    }}
                    className={cn(
                      'p-1.5 rounded-lg text-xs transition-colors',
                      desktopEnabled && permission === 'granted'
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    )}
                    title={
                      permission !== 'granted'
                        ? 'Enable desktop notifications'
                        : desktopEnabled
                        ? 'Desktop notifications: ON'
                        : 'Desktop notifications: OFF'
                    }
                  >
                    {desktopEnabled && permission === 'granted' ? (
                      <BellRing className="w-3.5 h-3.5" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Mark All As Read */}
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 rounded-lg text-xs text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Permission Banner Prompt if not enabled */}
              {permission === 'default' && (
                <div className="p-2.5 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-[11px] text-indigo-900 font-medium">
                      Enable desktop alerts for incoming messages
                    </span>
                  </div>
                  <button
                    onClick={requestPermission}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary-600 text-white hover:bg-primary-700 shrink-0 transition-colors"
                  >
                    Enable
                  </button>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/50 px-3 py-1.5 gap-2">
                <button
                  onClick={() => setFilterTab('all')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
                    filterTab === 'all'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilterTab('unread')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
                    filterTab === 'unread'
                      ? 'bg-white text-primary-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {filteredNotifications.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                      <Bell className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-900">
                      {filterTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {filterTab === 'unread'
                        ? "You're all caught up with your alerts!"
                        : 'Real-time customer messages and updates will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        'p-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3 group relative',
                        !notif.read && 'bg-primary-50/30'
                      )}
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-1.5">
                          <p className={cn('text-xs font-semibold truncate', !notif.read ? 'text-gray-900 font-bold' : 'text-gray-700')}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {formatRelativeTime(notif.createdAt)}
                        </p>
                      </div>

                      {/* Delete item button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all absolute top-2 right-2"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <button
                    onClick={clearAll}
                    className="text-gray-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    Clear all
                  </button>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                    />
                    {wsStatus === 'connected' ? 'Live WebSocket Active' : wsStatus}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-200 hidden sm:block" />

        {/* User Profile Dropdown Trigger */}
        <div className="relative">
          <button
            ref={profileButtonRef}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            title="View Profile & Workspace"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white">
                {getUserInitials(user?.name, user?.email)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-900 leading-tight truncate max-w-[130px]">
                  {user?.name || user?.email?.split('@')[0]}
                </p>
                <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform duration-200", isProfileOpen && "rotate-180")} />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge
                  variant={
                    user?.role === 'owner'
                      ? 'purple'
                      : user?.role === 'admin'
                      ? 'primary'
                      : user?.role === 'agent'
                      ? 'success'
                      : 'secondary'
                  }
                  size="sm"
                  className="text-[9px] uppercase tracking-wider font-bold py-0 px-1"
                >
                  {user?.role || 'viewer'}
                </Badge>
                {user?.tenantPlan && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    • {user.tenantPlan}
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              ref={profileDropdownRef}
              className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header with Avatar & Identity */}
              <div className="p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-500 via-indigo-500 to-purple-500 flex items-center justify-center text-base font-bold text-white shadow-md ring-2 ring-white/20">
                      {getUserInitials(user?.name, user?.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {user?.name || 'Workspace User'}
                      </p>
                      <p className="text-xs text-gray-300 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white border border-white/10">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Role: {user?.role ? user.role.toUpperCase() : 'OWNER'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {user?.status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Workspace / Tenant Info Card */}
              <div className="p-3 bg-gray-50/80 border-b border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    Workspace
                  </span>
                  <span className="font-semibold text-gray-900 truncate max-w-[140px]">
                    {user?.tenantName || 'Omni-Platform Workspace'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                    Plan Tier
                  </span>
                  <Badge variant="purple" size="sm" className="capitalize text-[10px]">
                    {user?.tenantPlan || 'Starter Tier'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                  <span className="text-[11px] text-gray-400 font-mono">Tenant ID</span>
                  <button
                    onClick={() => handleCopyTenantId(user?.tenantId || '')}
                    className="flex items-center gap-1 text-[11px] font-mono text-gray-600 hover:text-primary-600 bg-white px-1.5 py-0.5 rounded border border-gray-200 hover:border-primary-300 transition-colors"
                    title="Click to copy Tenant ID"
                  >
                    {copiedTenantId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <span className="truncate max-w-[90px]">{user?.tenantId?.slice(0, 8)}...</span>
                        <Copy className="w-3 h-3 text-gray-400" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action items: Redirects directly to Settings tabs */}
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings?tab=profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50/60 rounded-xl transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span>Profile & Account Details</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings?tab=team');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50/60 rounded-xl transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Workspace Settings & RBAC</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings?tab=api-keys');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50/60 rounded-xl transition-colors text-left"
                >
                  <Key className="w-4 h-4 text-gray-400" />
                  <span>Developer API Keys</span>
                </button>
              </div>

              {/* Logout Footer */}
              <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </div>
                  <span className="text-[10px] text-gray-400">End session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
