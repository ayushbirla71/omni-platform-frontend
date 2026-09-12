import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Key,
  CreditCard,
  Shield,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  UserPlus,
  Lock,
  Download,
  AlertCircle,
  FileText,
  Activity,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  User as UserIcon,
  Mail,
  Building2,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import {
  teamApi,
  apiKeysApi,
  billingApi,
  auditLogsApi,
  complianceApi,
} from '../api';
import type {
  TeamMember,
  UserRole,
  UserStatus,
  ApiKey,
  CreatedApiKeyResult,
  WorkspaceUsageSummary,
  AuditLogEntry,
  PlanConfig,
} from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Tabs, Spinner } from '../components/common/Tabs';
import { formatRelativeTime, getUserInitials } from '../lib/utils';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabQuery = searchParams.get('tab') as 'profile' | 'team' | 'api-keys' | 'billing' | 'compliance' | null;
  const validTabs = ['profile', 'team', 'api-keys', 'billing', 'compliance'];

  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'api-keys' | 'billing' | 'compliance'>(
    tabQuery && validTabs.includes(tabQuery) ? tabQuery : 'profile'
  );

  useEffect(() => {
    if (tabQuery && validTabs.includes(tabQuery) && tabQuery !== activeTab) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  // ==================== PROFILE / ACCOUNT STATE ====================
  const [profileName, setProfileName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [copiedTenantId, setCopiedTenantId] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  useEffect(() => {
    if (user?.name !== undefined) {
      setProfileName(user.name || '');
    }
  }, [user?.name]);

  // ==================== TEAM STATE ====================
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('agent');
  const [invitePassword, setInvitePassword] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // ==================== API KEYS STATE ====================
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(false);
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyExpiryDays, setKeyExpiryDays] = useState<number>(90);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [createdKeyResult, setCreatedKeyResult] = useState<CreatedApiKeyResult | null>(null);
  const [copiedKeySecret, setCopiedKeySecret] = useState(false);

  // ==================== BILLING STATE ====================
  const [usageSummary, setUsageSummary] = useState<WorkspaceUsageSummary | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PlanConfig | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // ==================== AUDIT & COMPLIANCE STATE ====================
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditResourceTypeFilter, setAuditResourceTypeFilter] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);

  // GDPR Tool State
  const [gdprContactId, setGdprContactId] = useState('');
  const [isExportingGdpr, setIsExportingGdpr] = useState(false);
  const [isPurgingGdpr, setIsPurgingGdpr] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

  // ==================== LOADERS ====================
  const loadTeam = useCallback(async () => {
    try {
      setIsTeamLoading(true);
      const res = await teamApi.list();
      setTeamMembers(res || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load team members', 'error');
    } finally {
      setIsTeamLoading(false);
    }
  }, [showToast]);

  const loadApiKeys = useCallback(async () => {
    try {
      setIsKeysLoading(true);
      const res = await apiKeysApi.list();
      setApiKeys(res || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load API keys', 'error');
    } finally {
      setIsKeysLoading(false);
    }
  }, [showToast]);

  const loadBilling = useCallback(async () => {
    try {
      setIsBillingLoading(true);
      const res = await billingApi.getUsage();
      setUsageSummary(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load usage summary', 'error');
    } finally {
      setIsBillingLoading(false);
    }
  }, [showToast]);

  const loadAuditLogs = useCallback(async () => {
    try {
      setIsAuditLoading(true);
      const res = await auditLogsApi.list({
        action: auditActionFilter || undefined,
        resourceType: auditResourceTypeFilter || undefined,
        limit: 50,
      });
      setAuditLogs(res?.logs || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setIsAuditLoading(false);
    }
  }, [auditActionFilter, auditResourceTypeFilter, showToast]);

  useEffect(() => {
    if (activeTab === 'team') loadTeam();
    if (activeTab === 'api-keys') loadApiKeys();
    if (activeTab === 'billing') loadBilling();
    if (activeTab === 'compliance') loadAuditLogs();
  }, [activeTab, loadTeam, loadApiKeys, loadBilling, loadAuditLogs]);

  // ==================== PROFILE / ACCOUNT ACTIONS ====================
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await updateProfile({ name: profileName });
      showToast('Profile name updated successfully', 'success');
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile name', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match', 'error');
      return;
    }

    try {
      setIsSavingPassword(true);
      await updateProfile({ currentPassword, newPassword });
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCopyId = (text: string, type: 'tenant' | 'user') => {
    navigator.clipboard.writeText(text);
    if (type === 'tenant') {
      setCopiedTenantId(true);
      setTimeout(() => setCopiedTenantId(false), 2000);
      showToast('Tenant ID copied to clipboard', 'info');
    } else {
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
      showToast('User ID copied to clipboard', 'info');
    }
  };

  // ==================== TEAM ACTIONS ====================
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      setIsInviting(true);
      await teamApi.invite({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        role: inviteRole,
        password: invitePassword.trim() || undefined,
      });
      showToast(`Invited ${inviteEmail} as ${inviteRole}`, 'success');
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      setInviteRole('agent');
      loadTeam();
    } catch (err: any) {
      showToast(err.message || 'Failed to invite team member', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      await teamApi.updateRole(memberId, newRole);
      showToast('Updated member role', 'success');
      loadTeam();
    } catch (err: any) {
      showToast(err.message || 'Failed to update member role', 'error');
    }
  };

  const handleStatusToggle = async (member: TeamMember) => {
    const newStatus: UserStatus = member.status === 'active' ? 'deactivated' : 'active';
    try {
      await teamApi.updateStatus(member.id, newStatus);
      showToast(`Member marked as ${newStatus}`, 'success');
      loadTeam();
    } catch (err: any) {
      showToast(err.message || 'Failed to update member status', 'error');
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    const ok = await confirm({
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${member.name || member.email} from the workspace? They will lose access to all chats, contacts, and workspace tools.`,
      confirmText: 'Remove Member',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await teamApi.remove(member.id);
      showToast('Removed team member', 'success');
      loadTeam();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  // ==================== API KEY ACTIONS ====================
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      showToast('API Key name is required', 'error');
      return;
    }

    try {
      setIsCreatingKey(true);
      const res = await apiKeysApi.create({
        name: keyName.trim(),
        scopes: ['*'],
        expiresInDays: keyExpiryDays > 0 ? keyExpiryDays : undefined,
      });
      setCreatedKeyResult(res);
      setIsCreateKeyModalOpen(false);
      setKeyName('');
      loadApiKeys();
    } catch (err: any) {
      showToast(err.message || 'Failed to create API key', 'error');
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string, name: string) => {
    const ok = await confirm({
      title: 'Revoke API Key',
      message: `Are you sure you want to permanently revoke API key "${name}"? Any active integrations using this key will immediately fail.`,
      confirmText: 'Revoke Key',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await apiKeysApi.revoke(keyId);
      showToast('API key revoked', 'success');
      loadApiKeys();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke API key', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeySecret(true);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedKeySecret(false), 2500);
  };

  // ==================== BILLING ACTIONS ====================
  const handlePlanSelect = (plan: PlanConfig) => {
    setSelectedPlanForUpgrade(plan);
    setIsPlanModalOpen(true);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlanForUpgrade) return;
    try {
      setIsUpdatingPlan(true);
      await billingApi.updatePlan(selectedPlanForUpgrade.id);
      showToast(`Workspace upgraded to ${selectedPlanForUpgrade.name}!`, 'success');
      setIsPlanModalOpen(false);
      loadBilling();
    } catch (err: any) {
      showToast(err.message || 'Failed to update plan', 'error');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // ==================== GDPR ACTIONS ====================
  const handleExportGdpr = async () => {
    if (!gdprContactId.trim()) {
      showToast('Please enter a valid Contact ID for GDPR export', 'error');
      return;
    }
    try {
      setIsExportingGdpr(true);
      const bundle = await complianceApi.exportContact(gdprContactId.trim());

      // Download as JSON file
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-export-${gdprContactId.trim()}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('GDPR Data bundle downloaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export contact data', 'error');
    } finally {
      setIsExportingGdpr(false);
    }
  };

  const handlePurgeGdpr = async () => {
    if (!gdprContactId.trim()) {
      showToast('Please enter a valid Contact ID for erasure', 'error');
      return;
    }
    try {
      setIsPurgingGdpr(true);
      const res = await complianceApi.purgeContact(gdprContactId.trim());
      showToast(res.message || 'Contact data permanently erased', 'success');
      setIsPurgeModalOpen(false);
      setGdprContactId('');
      loadAuditLogs();
    } catch (err: any) {
      showToast(err.message || 'Failed to purge contact data', 'error');
    } finally {
      setIsPurgingGdpr(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-primary-600" />
            Workspace Settings & Scale
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your organization, team role permissions, developer API tokens, live quotas, and GDPR data compliance.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'profile', label: 'My Profile & Account', icon: <UserIcon className="w-4 h-4" /> },
          { id: 'team', label: 'Team & RBAC', icon: <Users className="w-4 h-4" /> },
          { id: 'api-keys', label: 'Developer API Keys', icon: <Key className="w-4 h-4" /> },
          { id: 'billing', label: 'Usage & Plans', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'compliance', label: 'Audit Trail & Compliance', icon: <Shield className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId as any);
          setSearchParams({ tab: tabId });
        }}
      />

      {/* ========================================================
          TAB 0: MY PROFILE & ACCOUNT SETTINGS
          ======================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Identity & Workspace Overview Banner */}
          <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-850 to-gray-900 text-white rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-500 via-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-white/10 shrink-0">
                  {getUserInitials(user?.name, user?.email)}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-white">
                      {user?.name || 'Workspace User'}
                    </h2>
                    <Badge
                      variant={
                        user?.role === 'owner'
                          ? 'purple'
                          : user?.role === 'admin'
                          ? 'primary'
                          : 'success'
                      }
                      size="sm"
                      className="uppercase text-[10px] font-bold tracking-wider py-0.5"
                    >
                      {user?.role || 'owner'}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Session
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {user?.email}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    Last Active: {user?.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Currently active'}
                  </p>
                </div>
              </div>

              {/* Workspace Badge & Tier Card */}
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5 min-w-[200px]">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary-400" />
                  <span>Workspace Organization</span>
                </div>
                <p className="text-sm font-bold text-white truncate">
                  {user?.tenantName || 'Omni-Platform Workspace'}
                </p>
                <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-[10px] text-gray-300">
                  <CreditCard className="w-3 h-3 text-purple-400" />
                  <span>Plan:</span>
                  <span className="font-semibold text-purple-300 capitalize">{user?.tenantPlan || 'Starter Tier'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile & Security Management Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form 1: Display Name */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-primary-600" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your public display name shown in conversations, flow activity, and team logs.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateName} className="p-6 pt-0 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Your login email is managed by your workspace administrator.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingProfile || profileName === (user?.name || '')}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isSavingProfile ? 'Saving Changes...' : 'Save Profile Name'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Form 2: Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary-600" />
                  Password & Security
                </CardTitle>
                <CardDescription className="text-xs">
                  Change your account login password to maintain strong account protection.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleChangePassword} className="p-6 pt-0 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isSavingPassword || !currentPassword || !newPassword}
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isSavingPassword ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Workspace UUID & Resource Pointers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-600" />
                Workspace Identifiers & API Integration Metadata
              </CardTitle>
              <CardDescription className="text-xs">
                Use these unique identifier UUIDs when configuring webhooks, API requests, and third-party integrations.
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                      Workspace Tenant ID
                    </span>
                    <span className="font-mono text-xs font-semibold text-gray-800 mt-1 block">
                      {user?.tenantId || 'Unavailable'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyId(user?.tenantId || '', 'tenant')}
                    className="flex items-center gap-1.5 shrink-0"
                  >
                    {copiedTenantId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedTenantId ? 'Copied' : 'Copy'}
                  </Button>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                      Active User Member ID
                    </span>
                    <span className="font-mono text-xs font-semibold text-gray-800 mt-1 block">
                      {user?.id || 'Unavailable'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyId(user?.id || '', 'user')}
                    className="flex items-center gap-1.5 shrink-0"
                  >
                    {copiedUserId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUserId ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================
          TAB 1: TEAM & ACCESS CONTROL (RBAC)
          ======================================================== */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Workspace Members</h2>
              <p className="text-xs text-gray-500">
                Grant role-based access control (RBAC) across channels, inbox, workflows, and workspace administration.
              </p>
            </div>
            <Button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
          </div>

          {/* RBAC Legend Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-purple-900 flex items-center gap-1.5">
                <Badge variant="purple" className="text-[10px]">Owner</Badge>
                Workspace Owner
              </div>
              <p className="text-purple-700 leading-relaxed">
                Full administrative authority: billing upgrades, API keys, member management, and workspace deletion.
              </p>
            </div>
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <Badge variant="primary" className="text-[10px]">Admin</Badge>
                Administrator
              </div>
              <p className="text-blue-700 leading-relaxed">
                Manages team invites, channels, integrations, knowledge bases, and flows. Cannot modify billing tiers.
              </p>
            </div>
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Badge variant="success" className="text-[10px]">Agent</Badge>
                Support / Sales Agent
              </div>
              <p className="text-emerald-700 leading-relaxed">
                Operational access to Team Inbox, live chat conversations, CRM contacts, deals, and product orders.
              </p>
            </div>
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">Viewer</Badge>
                Read-Only Viewer
              </div>
              <p className="text-gray-600 leading-relaxed">
                Read-only visibility for reporting dashboards, search results, and analytics metrics. Cannot send messages.
              </p>
            </div>
          </div>

          {/* Team Table */}
          <Card>
            {isTeamLoading ? (
              <Spinner size="lg" />
            ) : teamMembers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No team members found. Invite your first colleague above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Member</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Last Login</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teamMembers.map((m) => {
                      const isCurrentUser = m.id === user?.id;
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4 font-medium text-gray-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
                              {(m.name || m.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span>{m.name || 'Unnamed Member'}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-medium">You</span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">ID: {m.id.slice(0, 8)}...</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-gray-600 font-mono">{m.email}</td>
                          <td className="px-5 py-4">
                            <select
                              value={m.role}
                              disabled={isCurrentUser && m.role === 'owner'}
                              onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                              className="text-xs font-semibold rounded-lg border-gray-200 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1 px-2"
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="agent">Agent</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={m.status === 'active' ? 'success' : 'secondary'}>
                              {m.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-gray-500">
                            {m.last_login_at || m.lastLoginAt
                              ? new Date(m.last_login_at || m.lastLoginAt!).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            {!isCurrentUser && (
                              <>
                                <button
                                  onClick={() => handleStatusToggle(m)}
                                  className="text-[11px] font-medium text-gray-600 hover:text-gray-900 underline"
                                >
                                  {m.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(m)}
                                  className="text-[11px] font-medium text-rose-600 hover:text-rose-800 underline ml-2"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================
          TAB 2: DEVELOPER API KEYS
          ======================================================== */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Developer API Keys</h2>
              <p className="text-xs text-gray-500">
                Authenticate server-to-server webhook deliveries, outbound messaging endpoints, and CRM integrations.
              </p>
            </div>
            <Button onClick={() => setIsCreateKeyModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Generate API Key
            </Button>
          </div>

          {/* Quick Integration Guide */}
          <div className="bg-gray-900 text-gray-100 rounded-xl p-5 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-gray-400 font-sans font-semibold text-xs border-b border-gray-800 pb-2">
              <span className="flex items-center gap-2 text-white">
                <Zap className="w-4 h-4 text-amber-400" />
                Integration Header Authentication
              </span>
              <span>Authorization: Bearer omni_live_...</span>
            </div>
            <p className="text-gray-400 font-sans">
              Pass your generated secret key in the <code className="text-amber-300">Authorization</code> HTTP header for all programmatic requests:
            </p>
            <pre className="bg-gray-950 p-3 rounded-lg overflow-x-auto text-emerald-400 border border-gray-800">
              curl -X GET https://omni-platform.ad96.in/api/contacts \<br />
              &nbsp;&nbsp;-H &quot;Authorization: Bearer omni_live_9c84e1b82f03...&quot;
            </pre>
          </div>

          {/* API Keys Table */}
          <Card>
            {isKeysLoading ? (
              <Spinner size="lg" />
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No developer API keys active. Create your first token above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Name</th>
                      <th className="px-5 py-3.5">Token Prefix</th>
                      <th className="px-5 py-3.5">Scopes</th>
                      <th className="px-5 py-3.5">Created</th>
                      <th className="px-5 py-3.5">Last Used</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-gray-900">{k.name}</td>
                        <td className="px-5 py-4 font-mono text-gray-600 bg-gray-50/50 rounded px-2 py-1 inline-block my-2">
                          {k.key_prefix || k.keyPrefix || 'omni_live_***'}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="purple" className="text-[10px]">
                            {k.scopes?.join(', ') || 'All (*) Scopes'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {k.created_at || k.createdAt ? new Date(k.created_at || k.createdAt!).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {k.last_used_at || k.lastUsedAt ? new Date(k.last_used_at || k.lastUsedAt!).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRevokeApiKey(k.id, k.name)}
                            className="text-xs"
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================
          TAB 3: USAGE & BILLING PLANS
          ======================================================== */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {isBillingLoading ? (
            <Spinner size="lg" />
          ) : usageSummary ? (
            <>
              {/* Current Usage Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Channels Quota */}
                <Card className="p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                    <span>Connected Channels</span>
                    <span className="font-bold text-gray-900">
                      {usageSummary.metrics.channels.used} / {usageSummary.metrics.channels.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        usageSummary.metrics.channels.percentage > 85 ? 'bg-rose-500' : 'bg-primary-600'
                      }`}
                      style={{ width: `${usageSummary.metrics.channels.percentage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-gray-400 text-right">
                    {usageSummary.metrics.channels.percentage}% capacity utilized
                  </div>
                </Card>

                {/* Contacts Quota */}
                <Card className="p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                    <span>Verified Contacts</span>
                    <span className="font-bold text-gray-900">
                      {usageSummary.metrics.contacts.used.toLocaleString()} / {usageSummary.metrics.contacts.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        usageSummary.metrics.contacts.percentage > 85 ? 'bg-rose-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${usageSummary.metrics.contacts.percentage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-gray-400 text-right">
                    {usageSummary.metrics.contacts.percentage}% capacity utilized
                  </div>
                </Card>

                {/* Monthly Messages */}
                <Card className="p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                    <span>Monthly Messages</span>
                    <span className="font-bold text-gray-900">
                      {usageSummary.metrics.monthlyMessages.used.toLocaleString()} / {usageSummary.metrics.monthlyMessages.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        usageSummary.metrics.monthlyMessages.percentage > 85 ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${usageSummary.metrics.monthlyMessages.percentage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-gray-400 text-right">
                    Resets on {new Date(usageSummary.billingCycleEnd).toLocaleDateString()}
                  </div>
                </Card>

                {/* AI Copilot & RAG Queries */}
                <Card className="p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                    <span>AI Copilot & RAG Queries</span>
                    <span className="font-bold text-gray-900">
                      {usageSummary.metrics.monthlyAiQueries.used.toLocaleString()} / {usageSummary.metrics.monthlyAiQueries.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        usageSummary.metrics.monthlyAiQueries.percentage > 85 ? 'bg-rose-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${usageSummary.metrics.monthlyAiQueries.percentage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-gray-400 text-right">
                    {usageSummary.metrics.monthlyAiQueries.percentage}% capacity utilized
                  </div>
                </Card>
              </div>

              {/* Plan Tiers Grid */}
              <div className="pt-4 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Subscription Plans & Quota Tiers</h3>
                  <p className="text-xs text-gray-500">
                    Switch between plan tiers instantly to scale messaging bandwidth, AI intelligence, and connected channels.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {usageSummary.availablePlans.map((plan) => {
                    const isCurrent = usageSummary.planId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 ${
                          isCurrent
                            ? 'bg-primary-50/40 border-primary-500 ring-2 ring-primary-500 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-gray-900 text-base">{plan.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                            </div>
                            {isCurrent && (
                              <Badge variant="primary" className="text-[10px]">
                                Active
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-gray-900">${plan.priceMonthly}</span>
                            <span className="text-xs text-gray-500">/ month</span>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                            <div className="flex items-center gap-2 text-gray-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span><strong>{plan.maxChannels}</strong> Connected Channels</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span><strong>{plan.maxContacts.toLocaleString()}</strong> Contacts</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span><strong>{plan.maxMonthlyMessages.toLocaleString()}</strong> Messages / mo</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span><strong>{plan.maxMonthlyAiQueries.toLocaleString()}</strong> AI Queries / mo</span>
                            </div>
                            {plan.features.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-gray-600">
                                <Sparkles className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-6">
                          {isCurrent ? (
                            <Button disabled variant="secondary" className="w-full text-xs font-semibold">
                              Current Plan
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              onClick={() => handlePlanSelect(plan)}
                              className="w-full text-xs font-semibold"
                            >
                              Switch to {plan.name}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">Unable to load billing data.</div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 4: AUDIT TRAIL & GDPR COMPLIANCE
          ======================================================== */}
      {activeTab === 'compliance' && (
        <div className="space-y-8">
          {/* GDPR & Data Privacy Tool */}
          <Card className="p-6 border-indigo-100 bg-indigo-50/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    GDPR Article 15 & Article 17 Data Subject Compliance
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Execute verified Data Subject Access Requests (DSAR) and permanent Right-to-be-Forgotten data erasures across PostgreSQL and MongoDB databases.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-center pt-2">
                  <input
                    type="text"
                    placeholder="Enter Contact ID (e.g. UUID)"
                    value={gdprContactId}
                    onChange={(e) => setGdprContactId(e.target.value)}
                    className="w-full md:w-96 text-xs px-3.5 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 font-mono"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleExportGdpr}
                    disabled={isExportingGdpr || !gdprContactId.trim()}
                    className="flex items-center gap-2 text-xs font-medium text-indigo-900 border-indigo-200 hover:bg-indigo-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isExportingGdpr ? 'Exporting...' : 'Art. 15 Export Data (JSON)'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setIsPurgeModalOpen(true)}
                    disabled={isPurgingGdpr || !gdprContactId.trim()}
                    className="flex items-center gap-2 text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Art. 17 Permanent Erasure
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Audit Log Trail */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gray-700" />
                  Immutable Security Audit Trail
                </h3>
                <p className="text-xs text-gray-500">
                  Comprehensive tamper-evident log capturing authentication changes, role adjustments, API token creations, and compliance actions.
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="text-xs rounded-lg border-gray-200 bg-white shadow-xs px-3 py-1.5"
                >
                  <option value="">All Actions</option>
                  <option value="user.invite">user.invite</option>
                  <option value="user.role_change">user.role_change</option>
                  <option value="user.status_change">user.status_change</option>
                  <option value="user.remove">user.remove</option>
                  <option value="apikey.create">apikey.create</option>
                  <option value="apikey.revoke">apikey.revoke</option>
                  <option value="plan.upgrade">plan.upgrade</option>
                  <option value="compliance.export">compliance.export</option>
                  <option value="compliance.delete">compliance.delete</option>
                </select>

                <Button variant="secondary" size="sm" onClick={loadAuditLogs} className="flex items-center gap-1.5 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              </div>
            </div>

            <Card>
              {isAuditLoading ? (
                <Spinner size="lg" />
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No security audit records logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Timestamp</th>
                        <th className="px-5 py-3.5">Action</th>
                        <th className="px-5 py-3.5">Resource</th>
                        <th className="px-5 py-3.5">Actor</th>
                        <th className="px-5 py-3.5">IP Address</th>
                        <th className="px-5 py-3.5 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5 text-gray-500 font-mono">
                            {new Date(log.created_at || log.createdAt!).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={
                                log.action.includes('delete') || log.action.includes('revoke') || log.action.includes('remove')
                                  ? 'danger'
                                  : log.action.includes('upgrade') || log.action.includes('create')
                                  ? 'success'
                                  : 'primary'
                              }
                              className="font-mono text-[10px]"
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-gray-700">
                            {log.resource_type || log.resourceType}
                            {(log.resource_id || log.resourceId) && (
                              <span className="text-gray-400 font-mono text-[10px] ml-1">
                                ({log.resource_id || log.resourceId})
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-gray-600">
                            {log.user_email || log.userEmail || log.user_id || log.userId || 'System / API'}
                          </td>
                          <td className="px-5 py-3.5 text-gray-400 font-mono">{log.ip_address || log.ipAddress || '—'}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedAuditLog(log)}
                              className="text-primary-600 hover:text-primary-800 font-semibold underline text-xs"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================
          MODALS
          ======================================================== */}

      {/* Modal 1: Invite Team Member */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInviteMember} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Alex Smith"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="alex@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Workspace Role *</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 font-medium"
            >
              <option value="admin">Administrator (Settings, Channels, Team)</option>
              <option value="agent">Support / Sales Agent (Live Chat & CRM)</option>
              <option value="viewer">Viewer (Read-Only Dashboards)</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Temporary Password (Optional)</label>
            <input
              type="text"
              placeholder="Leave blank for auto-generated password"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono"
            />
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Create API Key */}
      <Modal
        isOpen={isCreateKeyModalOpen}
        onClose={() => setIsCreateKeyModalOpen(false)}
        title="Generate Developer API Key"
      >
        <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">API Key Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Production Webhook Server, Zapier Sync"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Token Expiration</label>
            <select
              value={keyExpiryDays}
              onChange={(e) => setKeyExpiryDays(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
              <option value={365}>1 Year</option>
              <option value={0}>Never Expire</option>
            </select>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              The secret key will only be shown once upon generation. Be sure to copy and store it securely.
            </span>
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateKeyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingKey}>
              {isCreatingKey ? 'Generating...' : 'Generate Key'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Secret Key Reveal Modal */}
      {createdKeyResult && (
        <Modal
          isOpen={true}
          onClose={() => setCreatedKeyResult(null)}
          title="Save Your Secret API Key"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold">API Key Generated Successfully!</p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Make sure to copy your API key now as you will not be able to view it again.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Secret API Key Token</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdKeyResult.secretKey}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-xs text-gray-900 select-all"
                />
                <Button
                  onClick={() => copyToClipboard(createdKeyResult.secretKey)}
                  className="flex items-center gap-1 text-xs shrink-0"
                >
                  {copiedKeySecret ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copiedKeySecret ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button variant="primary" onClick={() => setCreatedKeyResult(null)}>
                I Have Saved My Secret Key
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 4: Plan Upgrade Confirmation */}
      {selectedPlanForUpgrade && (
        <Modal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          title={`Confirm Subscription Switch: ${selectedPlanForUpgrade.name}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-gray-600">
              You are about to switch your workspace subscription tier to{' '}
              <strong className="text-gray-900">{selectedPlanForUpgrade.name}</strong> (${selectedPlanForUpgrade.priceMonthly}/mo).
            </p>

            <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 border border-gray-200">
              <div className="font-semibold text-gray-900">New Workspace Quotas:</div>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Up to <strong>{selectedPlanForUpgrade.maxChannels}</strong> Connected Channels</li>
                <li>Up to <strong>{selectedPlanForUpgrade.maxContacts.toLocaleString()}</strong> Contacts</li>
                <li>Up to <strong>{selectedPlanForUpgrade.maxMonthlyMessages.toLocaleString()}</strong> Messages/month</li>
                <li>Up to <strong>{selectedPlanForUpgrade.maxMonthlyAiQueries.toLocaleString()}</strong> AI Copilot Queries/month</li>
              </ul>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsPlanModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPlanChange}
                disabled={isUpdatingPlan}
              >
                {isUpdatingPlan ? 'Switching...' : `Confirm Switch to ${selectedPlanForUpgrade.name}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 5: GDPR Art. 17 Erasure Confirmation */}
      <Modal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        title="Confirm GDPR Permanent Erasure"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Permanent Irreversible Data Deletion</p>
              <p className="text-rose-700 text-[11px] mt-0.5">
                This will cascade permanent deletion across all PostgreSQL contact profiles, deals, orders, conversations, and all MongoDB message histories for Contact ID: <code className="font-mono font-bold">{gdprContactId}</code>.
              </p>
            </div>
          </div>

          <p className="text-gray-600">
            This action fulfills the legal requirement for GDPR Article 17 / CCPA Right to Erasure. An immutable audit record will be logged.
          </p>

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsPurgeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handlePurgeGdpr}
              disabled={isPurgingGdpr}
            >
              {isPurgingGdpr ? 'Erasing...' : 'Permanently Delete All Personal Data'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 6: Audit Log Inspector */}
      {selectedAuditLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAuditLog(null)}
          title={`Audit Record: ${selectedAuditLog.action}`}
        >
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>
                <span className="font-semibold text-gray-900">Actor:</span>{' '}
                {selectedAuditLog.user_email || selectedAuditLog.userEmail || selectedAuditLog.user_id || selectedAuditLog.userId || 'System'}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Timestamp:</span>{' '}
                {new Date(selectedAuditLog.created_at || selectedAuditLog.createdAt!).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Resource:</span>{' '}
                {selectedAuditLog.resource_type || selectedAuditLog.resourceType}
              </div>
              <div>
                <span className="font-semibold text-gray-900">IP Address:</span>{' '}
                {selectedAuditLog.ip_address || selectedAuditLog.ipAddress || '—'}
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-900 block mb-1">Payload Details:</span>
              <pre className="bg-gray-950 text-emerald-400 p-3 rounded-lg overflow-x-auto text-[11px] font-mono border border-gray-800">
                {JSON.stringify(selectedAuditLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedAuditLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
