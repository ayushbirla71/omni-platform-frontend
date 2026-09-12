import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
  DollarSign,
  User,
  Calendar,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit2,
  Target,
} from 'lucide-react';
import { dealsApi, contactsApi } from '../api';
import type { Deal, PipelineSummary, Contact } from '../types';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Tabs';
import { formatDateTime, cn } from '../lib/utils';

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const;
type Stage = (typeof STAGES)[number];

const STAGE_COLORS: Record<Stage, string> = {
  Lead: 'bg-gray-100 border-gray-300',
  Qualified: 'bg-blue-50 border-blue-300',
  Proposal: 'bg-purple-50 border-purple-300',
  Negotiation: 'bg-amber-50 border-amber-300',
  Won: 'bg-emerald-50 border-emerald-300',
  Lost: 'bg-rose-50 border-rose-300',
};

export const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Deal Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealValue, setNewDealValue] = useState('10000');
  const [newDealStage, setNewDealStage] = useState<Stage>('Lead');
  const [newDealContactId, setNewDealContactId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Deal Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editDealTitle, setEditDealTitle] = useState('');
  const [editDealValue, setEditDealValue] = useState('');
  const [editDealStage, setEditDealStage] = useState<Stage>('Lead');

  const { showToast } = useToast();
  const { confirm } = useDialog();

  const loadDeals = async () => {
    setIsLoading(true);
    try {
      const [dealsData, summaryData, contactsData] = await Promise.all([
        dealsApi.list(),
        dealsApi.getPipelineSummary(),
        contactsApi.list(1000, 0),
      ]);
      setDeals(dealsData);
      setPipelineSummary(summaryData);
      setContacts(contactsData);
    } catch (err) {
      showToast('Failed to load deals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim() || !newDealContactId) return;

    setIsSubmitting(true);
    try {
      const deal = await dealsApi.create({
        contactId: newDealContactId,
        title: newDealTitle.trim(),
        stage: newDealStage,
        value: Number(newDealValue) || 0,
      });
      setDeals((prev) => [...prev, deal]);
      setIsAddModalOpen(false);
      setNewDealTitle('');
      setNewDealValue('10000');
      setNewDealStage('Lead');
      setNewDealContactId('');
      showToast('Deal created successfully!', 'success');
      loadDeals(); // Refresh summary
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create deal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal || !editDealTitle.trim()) return;

    try {
      const updated = await dealsApi.update(editingDeal.id, {
        title: editDealTitle.trim(),
        value: Number(editDealValue) || 0,
        stage: editDealStage,
      });
      setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setIsEditModalOpen(false);
      setEditingDeal(null);
      showToast('Deal updated successfully!', 'success');
      loadDeals(); // Refresh summary
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update deal', 'error');
    }
  };

  const handleMoveDeal = async (dealId: string, newStage: Stage) => {
    try {
      const updated = await dealsApi.updateStage(dealId, newStage);
      setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      showToast(`Deal moved to ${newStage}`, 'success');
      loadDeals(); // Refresh summary
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to move deal', 'error');
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    const ok = await confirm({
      title: 'Delete Deal',
      message: 'Are you sure you want to delete this deal? It will be removed from your sales pipeline.',
      confirmText: 'Delete Deal',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await dealsApi.delete(dealId);
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
      showToast('Deal deleted', 'success');
      loadDeals(); // Refresh summary
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete deal', 'error');
    }
  };

  const openEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditDealTitle(deal.title);
    setEditDealValue(String(deal.value));
    setEditDealStage(deal.stage as Stage);
    setIsEditModalOpen(true);
  };

  // Filter deals by search
  const filteredDeals = deals.filter((d) => {
    const contact = contacts.find((c) => c.id === d.contactId);
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact?.name && contact.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Group deals by stage
  const dealsByStage: Record<Stage, Deal[]> = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = filteredDeals.filter((d) => d.stage === stage);
      return acc;
    },
    {} as Record<Stage, Deal[]>
  );

  // Calculate total pipeline value
  const totalPipelineValue = pipelineSummary.reduce((sum, s) => sum + (Number(s.totalValue) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">CRM Pipeline</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage deals across stages and track revenue opportunities
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Deal
        </Button>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-white/70" />
          </div>
          <p className="text-2xl font-bold">${(totalPipelineValue / 100).toLocaleString('en-US')}</p>
          <p className="text-xs text-primary-100 mt-0.5">Total Pipeline Value</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Deals</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {pipelineSummary.find((s) => s.stage === 'Won')?.count || 0}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Won Deals</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${((pipelineSummary.find((s) => s.stage === 'Won')?.totalValue || 0) / 100).toLocaleString('en-US')}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Won Value</p>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deals by title or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:outline-none"
          />
        </div>
      </Card>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => {
              const stageSummary = pipelineSummary.find((s) => s.stage === stage);
              const stageDeals = dealsByStage[stage] || [];
              const stageValue = stageSummary?.totalValue || 0;

              return (
                <div key={stage} className="w-80 shrink-0 space-y-3">
                  {/* Column Header */}
                  <div className={cn('p-4 rounded-2xl border-2', STAGE_COLORS[stage])}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-900">{stage}</h3>
                      <Badge variant="outline" size="sm">
                        {stageDeals.length}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">
                      ${(stageValue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Deal Cards */}
                  <div className="space-y-3 min-h-[200px]">
                    {stageDeals.length === 0 ? (
                      <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 text-center text-xs text-gray-400">
                        No deals in {stage}
                      </div>
                    ) : (
                      stageDeals.map((deal) => {
                        const contact = contacts.find((c) => c.id === deal.contactId);
                        return (
                          <Card
                            key={deal.id}
                            className="p-4 hover:shadow-md transition-all duration-150 space-y-3 group"
                          >
                            {/* Deal Header */}
                            <div className="flex items-start justify-between">
                              <h4 className="text-xs font-bold text-gray-900 leading-snug flex-1">{deal.title}</h4>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                  onClick={() => openEditModal(deal)}
                                  className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                                  title="Edit Deal"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDeal(deal.id)}
                                  className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Delete Deal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Deal Value */}
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm font-bold text-emerald-700">
                                ${((Number(deal.value) || 0) / 100).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>

                            {/* Contact Info */}
                            {contact && (
                              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold uppercase">
                                  {contact.name ? contact.name.substring(0, 2) : 'CT'}
                                </div>
                                <span className="text-[11px] text-gray-600 truncate">{contact.name || 'Unknown'}</span>
                              </div>
                            )}

                            {/* Stage Selector */}
                            <div className="pt-2 border-t border-gray-100">
                              <select
                                value={deal.stage}
                                onChange={(e) => handleMoveDeal(deal.id, e.target.value as Stage)}
                                className="w-full text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors"
                              >
                                {STAGES.map((s) => (
                                  <option key={s} value={s}>
                                    Move to {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDateTime(deal.createdAt)}</span>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Deal"
        description="Add a new opportunity to your pipeline"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <Input
            label="Deal Title"
            placeholder="e.g. Enterprise License - Acme Corp"
            value={newDealTitle}
            onChange={(e) => setNewDealTitle(e.target.value)}
            required
          />

          <Input
            label="Deal Value (in Cents)"
            type="number"
            placeholder="10000 = $100.00"
            value={newDealValue}
            onChange={(e) => setNewDealValue(e.target.value)}
            helperText="Stored in cents. 10000 = $100.00"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Associated Contact
            </label>
            <select
              value={newDealContactId}
              onChange={(e) => setNewDealContactId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
              required
            >
              <option value="">-- Select Contact --</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.externalId}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Initial Stage</label>
            <select
              value={newDealStage}
              onChange={(e) => setNewDealStage(e.target.value as Stage)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Deal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Deal Modal */}
      {editingDeal && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Deal"
          description={`Update details for: ${editingDeal.title}`}
        >
          <form onSubmit={handleUpdateDeal} className="space-y-4">
            <Input
              label="Deal Title"
              placeholder="e.g. Enterprise License"
              value={editDealTitle}
              onChange={(e) => setEditDealTitle(e.target.value)}
              required
            />

            <Input
              label="Deal Value (in Cents)"
              type="number"
              placeholder="10000 = $100.00"
              value={editDealValue}
              onChange={(e) => setEditDealValue(e.target.value)}
              helperText="Stored in cents. 10000 = $100.00"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Stage</label>
              <select
                value={editDealStage}
                onChange={(e) => setEditDealStage(e.target.value as Stage)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
