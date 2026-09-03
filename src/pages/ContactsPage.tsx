import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  ChevronRight,
  Filter,
  Download,
  Upload,
  UserPlus,
  Tag as TagIcon,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { contactsApi, dealsApi, channelsApi } from '../api';
import type { Contact, Deal, Channel } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Tabs';
import { formatDateTime, cn } from '../lib/utils';

const PRESET_TAG_SUGGESTIONS = ['followup', 'up', 'mp', 'vip', 'lead', 'customer', 'hot', 'new'];

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  // Add Contact Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactExternalId, setNewContactExternalId] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactChannelId, setNewContactChannelId] = useState('');
  const [newContactTags, setNewContactTags] = useState<string[]>(['lead']);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importChannelId, setImportChannelId] = useState('');
  const [importTags, setImportTags] = useState<string[]>(['followup']);
  const [importTagInput, setImportTagInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    imported: number;
    updated: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contact Detail Drawer
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactDeals, setContactDeals] = useState<Deal[]>([]);
  const [editDetailTagInput, setEditDetailTagInput] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [contactsData, channelsData, tagsData] = await Promise.all([
        contactsApi.list(1000, 0),
        channelsApi.list(),
        contactsApi.getTags().catch(() => []),
      ]);
      setContacts(contactsData);
      setChannels(channelsData);
      setAvailableTags(tagsData);

      if (channelsData.length > 0) {
        if (!newContactChannelId) setNewContactChannelId(channelsData[0].id);
        if (!importChannelId) setImportChannelId(channelsData[0].id);
      }
    } catch (err) {
      showToast('Failed to load contacts data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactExternalId.trim()) {
      showToast('Phone number or External ID is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const contact = await contactsApi.create({
        name: newContactName.trim() || undefined,
        externalId: newContactExternalId.trim(),
        channelId: newContactChannelId || undefined,
        email: newContactEmail.trim() || undefined,
        tags: newContactTags,
      });

      setContacts((prev) => [contact, ...prev]);
      setIsAddModalOpen(false);
      setNewContactName('');
      setNewContactExternalId('');
      setNewContactEmail('');
      setNewContactTags(['lead']);
      showToast('Contact created successfully!', 'success');

      // Refresh tags
      contactsApi.getTags().then(setAvailableTags).catch(() => {});
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create contact', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      showToast('Please select a CSV or Excel file', 'error');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', importFile);
    if (importChannelId) formData.append('channelId', importChannelId);
    if (importTags.length > 0) formData.append('tags', importTags.join(','));

    try {
      const result = await contactsApi.importFile(formData);
      setImportResult(result);
      showToast(`Import completed: ${result.imported} new, ${result.updated} updated`, 'success');
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to import file', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await contactsApi.delete(contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      if (selectedContact?.id === contactId) setSelectedContact(null);
      showToast('Contact deleted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete contact', 'error');
    }
  };

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    try {
      const allDeals = await dealsApi.list();
      setContactDeals(allDeals.filter((d) => d.contactId === contact.id));
    } catch (err) {
      showToast('Failed to load contact deals', 'error');
    }
  };

  const handleAddTagToSelectedContact = async (tagToAdd: string) => {
    if (!selectedContact || !tagToAdd.trim()) return;
    const cleanTag = tagToAdd.trim().toLowerCase();
    const currentTags = selectedContact.attributes?.tags || [];
    if (currentTags.includes(cleanTag)) return;

    const newTags = [...currentTags, cleanTag];
    try {
      const updated = await contactsApi.update(selectedContact.id, { tags: newTags });
      if (updated) {
        setSelectedContact(updated);
        setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setEditDetailTagInput('');
        showToast(`Tag "${cleanTag}" added`, 'success');
        contactsApi.getTags().then(setAvailableTags).catch(() => {});
      }
    } catch (err) {
      showToast('Failed to update tags', 'error');
    }
  };

  const handleRemoveTagFromSelectedContact = async (tagToRemove: string) => {
    if (!selectedContact) return;
    const currentTags = selectedContact.attributes?.tags || [];
    const newTags = currentTags.filter((t) => t !== tagToRemove);

    try {
      const updated = await contactsApi.update(selectedContact.id, { tags: newTags });
      if (updated) {
        setSelectedContact(updated);
        setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showToast(`Tag "${tagToRemove}" removed`, 'info');
      }
    } catch (err) {
      showToast('Failed to update tags', 'error');
    }
  };

  const toggleSelectContact = (contactId: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(contactId)) {
      newSet.delete(contactId);
    } else {
      newSet.add(contactId);
    }
    setSelectedContacts(newSet);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'Name,Phone,Email,Tags\n' +
      'John Doe,+14155552671,john@example.com,"followup, up"\n' +
      'Jane Smith,+14155552672,jane@example.com,"mp, hot"\n' +
      'David Miller,+14155552673,david@example.com,"lead, followup"\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'contacts_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for tag badge color
  const getTagColorClass = (tag: string) => {
    const lower = tag.toLowerCase();
    if (lower === 'followup') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (lower === 'up') return 'bg-sky-100 text-sky-800 border-sky-200';
    if (lower === 'mp') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (lower === 'vip' || lower === 'hot') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (lower === 'lead') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const contactTags = c.attributes?.tags || [];
    const contactEmail = c.attributes?.email || c.email || '';
    const contactExtId = c.externalId || c.external_id || '';
    const contactName = c.name || '';
    const contactChannelId = c.channelId || c.channel_id || '';

    const matchesSearch =
      contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactExtId.includes(searchQuery) ||
      contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesChannel = channelFilter === 'all' || contactChannelId === channelFilter || c.channel === channelFilter;

    const matchesTag =
      selectedTagFilter === 'all' ||
      contactTags.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase());

    return matchesSearch && matchesChannel && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contacts & Audience Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Import Excel/CSV lists, manage segmentation tags (followup, up, mp), and broadcast targeted flows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            icon={<Upload className="w-4 h-4 text-primary-600" />}
          >
            Import CSV / Excel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Channel Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-500">Channel:</span>
            <button
              onClick={() => setChannelFilter('all')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
                channelFilter === 'all'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setChannelFilter(ch.id)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors capitalize',
                  channelFilter === ch.id
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {ch.displayName || ch.type}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Tag Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <TagIcon className="w-3 h-3 text-gray-400" /> Filter by Tag:
          </span>
          <button
            onClick={() => setSelectedTagFilter('all')}
            className={cn(
              'px-2.5 py-0.5 text-xs font-medium rounded-full transition-colors',
              selectedTagFilter === 'all'
                ? 'bg-gray-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All Tags
          </button>
          {Array.from(new Set([...PRESET_TAG_SUGGESTIONS.slice(0, 4), ...availableTags])).map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTagFilter(tag)}
              className={cn(
                'px-2.5 py-0.5 text-xs font-medium rounded-full border transition-all',
                selectedTagFilter === tag
                  ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                  : getTagColorClass(tag) + ' hover:opacity-80'
              )}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Select All Checkbox & Count */}
        {filteredContacts.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label className="font-semibold cursor-pointer" onClick={handleSelectAll}>
                Select All ({filteredContacts.length} matching contacts)
              </label>
            </div>

            {selectedContacts.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="md">
                  {selectedContacts.size} selected
                </Badge>
                <Link to="/campaigns/new">
                  <Button variant="primary" size="sm" icon={<MessageSquare className="w-3 h-3" />}>
                    Send Broadcast / Flow
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Contacts Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-12 h-12 mx-auto text-gray-300" />
            <h3 className="text-base font-bold text-gray-900">No contacts found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchQuery || channelFilter !== 'all' || selectedTagFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Upload a CSV/Excel file or add your first contact to start managing your audience'}
            </p>
            {!searchQuery && channelFilter === 'all' && (
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsImportModalOpen(true)}
                  icon={<Upload className="w-4 h-4" />}
                >
                  Import Excel / CSV
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Contact
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedContacts.size === filteredContacts.length}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    External ID / Phone
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredContacts.map((contact) => {
                  const tags = contact.attributes?.tags || [];
                  const email = contact.attributes?.email || contact.email;
                  const externalId = contact.externalId || contact.external_id || 'N/A';

                  return (
                    <tr
                      key={contact.id}
                      className={cn(
                        'transition-colors hover:bg-slate-50/50',
                        selectedContacts.has(contact.id) && 'bg-primary-50/30'
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => toggleSelectContact(contact.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                            {contact.name ? contact.name.substring(0, 2) : 'CT'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{contact.name || 'Unnamed Contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700 font-mono">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{externalId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {tags.length > 0 ? (
                            tags.map((t) => (
                              <span
                                key={t}
                                className={cn(
                                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs',
                                  getTagColorClass(t)
                                )}
                              >
                                #{t}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No tags</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {email ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-700">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{formatDateTime(contact.createdAt || contact.created_at || '')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSelectContact(contact)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                          >
                            Details
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CSV / EXCEL IMPORT MODAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Contacts from CSV or Excel"
        description="Upload a spreadsheet with contacts and automatically assign audience segmentation tags"
        maxWidth="lg"
      >
        <form onSubmit={handleImportSubmit} className="space-y-5">
          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all',
              importFile
                ? 'border-emerald-500 bg-emerald-50/40'
                : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50/20'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImportFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            {importFile ? (
              <div className="space-y-2">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-gray-900">{importFile.name}</p>
                <p className="text-xs text-gray-500">{(importFile.size / 1024).toFixed(1)} KB • Click to change file</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm font-bold text-gray-800">Choose CSV or Excel (.xlsx, .xls) file</p>
                <p className="text-xs text-gray-500">Supported columns: Name, Phone/Mobile, Email, Tags</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Channel Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Target Channel
              </label>
              <select
                value={importChannelId}
                onChange={(e) => setImportChannelId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
                required
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.externalId || c.type} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Template Download */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Sample Template
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadSampleCsv}
                icon={<Download className="w-4 h-4 text-gray-600" />}
                className="w-full justify-center"
              >
                Download Sample CSV
              </Button>
            </div>
          </div>

          {/* Tag Assignment on Import */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Assign Tags to Imported Contacts (e.g. followup, up, mp)
            </label>

            {/* Tag Pills */}
            <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-gray-50 border border-gray-200">
              {importTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-100 text-primary-800"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setImportTags(importTags.filter((t) => t !== tag))}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Type tag and press Enter..."
                value={importTagInput}
                onChange={(e) => setImportTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    if (importTagInput.trim()) {
                      const clean = importTagInput.trim().toLowerCase();
                      if (!importTags.includes(clean)) {
                        setImportTags([...importTags, clean]);
                      }
                      setImportTagInput('');
                    }
                  }
                }}
                className="flex-1 min-w-[140px] text-xs bg-transparent border-none outline-none focus:ring-0 p-1"
              />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Quick Add:</span>
              {PRESET_TAG_SUGGESTIONS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    if (!importTags.includes(preset)) {
                      setImportTags([...importTags, preset]);
                    }
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Import Results Banner */}
          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Import Finished!</span>
              </div>
              <p className="text-xs text-emerald-900">
                Processed <b>{importResult.total}</b> total rows. Created <b>{importResult.imported}</b> new contacts,
                updated <b>{importResult.updated}</b> existing contacts.
              </p>
              {importResult.errors.length > 0 && (
                <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 max-h-24 overflow-y-auto">
                  <p className="font-bold">Errors ({importResult.errors.length}):</p>
                  {importResult.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setIsImportModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isImporting}
              disabled={!importFile}
              icon={<Upload className="w-4 h-4" />}
            >
              Start Import
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD CONTACT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Contact"
        description="Create a single contact with tags"
      >
        <form onSubmit={handleAddContact} className="space-y-4">
          <Input
            label="Contact Name"
            placeholder="e.g. John Doe"
            value={newContactName}
            onChange={(e) => setNewContactName(e.target.value)}
          />

          <Input
            label="Phone Number / External ID"
            placeholder="e.g. +14155552671"
            value={newContactExternalId}
            onChange={(e) => setNewContactExternalId(e.target.value)}
            helperText="WhatsApp mobile number with country code"
            required
          />

          <Input
            label="Email Address (Optional)"
            placeholder="e.g. john@example.com"
            type="email"
            value={newContactEmail}
            onChange={(e) => setNewContactEmail(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Channel</label>
            <select
              value={newContactChannelId}
              onChange={(e) => setNewContactChannelId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName || c.type} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Tag assignment */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Tags</label>
            <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-gray-50 border border-gray-200">
              {newContactTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-primary-100 text-primary-800"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setNewContactTags(newContactTags.filter((t) => t !== tag))}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Type tag and press Enter..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    if (newTagInput.trim()) {
                      const clean = newTagInput.trim().toLowerCase();
                      if (!newContactTags.includes(clean)) {
                        setNewContactTags([...newContactTags, clean]);
                      }
                      setNewTagInput('');
                    }
                  }
                }}
                className="flex-1 min-w-[120px] text-xs bg-transparent border-none outline-none focus:ring-0 p-1"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {PRESET_TAG_SUGGESTIONS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    if (!newContactTags.includes(preset)) {
                      setNewContactTags([...newContactTags, preset]);
                    }
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Add Contact
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONTACT DETAIL DRAWER MODAL */}
      {selectedContact && (
        <Modal
          isOpen={!!selectedContact}
          onClose={() => setSelectedContact(null)}
          title={selectedContact.name || 'Contact Details'}
          description={`Phone / ID: ${selectedContact.externalId || selectedContact.external_id}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <p className="text-xs text-gray-900 font-medium">
                  {selectedContact.attributes?.email || selectedContact.email || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Created</label>
                <p className="text-xs text-gray-700">
                  {formatDateTime(selectedContact.createdAt || selectedContact.created_at || '')}
                </p>
              </div>
            </div>

            {/* Tags Management */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>Audience Tags</span>
                <span className="text-[9px] text-gray-400 font-normal">Click × to remove</span>
              </label>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(selectedContact.attributes?.tags || []).length > 0 ? (
                    (selectedContact.attributes?.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border shadow-2xs',
                          getTagColorClass(tag)
                        )}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTagFromSelectedContact(tag)}
                          className="hover:text-rose-600 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No tags assigned to this contact.</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60">
                  <input
                    type="text"
                    placeholder="Add tag (e.g. followup, up, mp)..."
                    value={editDetailTagInput}
                    onChange={(e) => setEditDetailTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagToSelectedContact(editDetailTagInput);
                      }
                    }}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAddTagToSelectedContact(editDetailTagInput)}
                  >
                    Add Tag
                  </Button>
                </div>

                <div className="flex items-center gap-1 flex-wrap pt-1">
                  {PRESET_TAG_SUGGESTIONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddTagToSelectedContact(preset)}
                      className="text-[10px] px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Associated Deals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Associated Deals ({contactDeals.length})
                </label>
                <Link to="/deals">
                  <Button variant="outline" size="sm" icon={<ChevronRight className="w-3 h-3" />}>
                    View All Deals
                  </Button>
                </Link>
              </div>

              {contactDeals.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No deals associated with this contact.</p>
              ) : (
                <div className="space-y-2">
                  {contactDeals.map((deal) => (
                    <div key={deal.id} className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{deal.title}</span>
                        <Badge variant="warning" size="sm">
                          {deal.stage}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-primary-700">
                        ${((Number(deal.value) || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-100 flex gap-2">
              <Link to="/inbox" className="flex-1">
                <Button variant="outline" size="sm" className="w-full" icon={<MessageSquare className="w-3.5 h-3.5" />}>
                  View Inbox
                </Button>
              </Link>
              <Link to="/campaigns/new" className="flex-1">
                <Button variant="primary" size="sm" className="w-full" icon={<Plus className="w-3.5 h-3.5" />}>
                  Start Campaign
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
