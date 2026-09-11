import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  X,
  Sparkles,
  MessageSquare,
  Users,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../common/Badge';
import { formatRelativeTime, cn } from '../../lib/utils';
import type { AppNotification } from '../../types';

export const Topbar: React.FC<{ onOpenSidebar: () => void }> = ({ onOpenSidebar }) => {
  const { user } = useAuth();
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen, setIsDropdownOpen]);

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
                        ? 'text-primary-600 hover:bg-primary-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    )}
                    title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  {/* Desktop Notification Toggle */}
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
                        ? 'text-primary-600 hover:bg-primary-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    )}
                    title={
                      permission !== 'granted'
                        ? 'Request desktop notification permission'
                        : desktopEnabled
                        ? 'Disable desktop notifications'
                        : 'Enable desktop notifications'
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
                      className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Close */}
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-1"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Desktop Permission Enable Banner (shown if browser supports and not granted) */}
              {permission !== 'granted' && typeof window !== 'undefined' && 'Notification' in window && (
                <div className="bg-primary-50/70 border-b border-primary-100 p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-primary-900">
                    <BellRing className="w-4 h-4 text-primary-600 shrink-0" />
                    <span className="text-[11px] leading-tight">Enable browser alerts for incoming messages</span>
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

        {/* User Profile */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {user?.email ? user.email.substring(0, 1).toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-900 leading-tight truncate max-w-[120px]">
              {user?.email}
            </p>
            <Badge variant="secondary" size="sm" className="mt-0.5">
              {user?.role}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
};
