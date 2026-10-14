import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { teamsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useDialog } from '../../context/DialogContext';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Tabs';
import type { Team, TeamMember } from '../../types';

interface TeamsManagerProps {
  /** Workspace members; only active owners, admins and agents can join a team. */
  members: TeamMember[];
  canManage: boolean;
}

/** Create support teams (e.g. Support, Sales) and choose who belongs to each one. */
export const TeamsManager: React.FC<TeamsManagerProps> = ({ members, canManage }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [newTeamName, setNewTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editing, setEditing] = useState<Team | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const eligibleMembers = members.filter(
    (m) => m.status === 'active' && m.role !== 'viewer'
  );

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      setTeams(await teamsApi.list());
    } catch (err: any) {
      setLoadFailed(true);
      showToast(err?.message || 'Failed to load teams', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTeamName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      await teamsApi.create({ name });
      setNewTeamName('');
      showToast(`Team "${name}" created`, 'success');
      await loadTeams();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create team', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const openMembers = (team: Team) => {
    setEditing(team);
    setSelectedIds(team.memberIds);
  };

  const toggleMember = (userId: string) =>
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );

  const handleSaveMembers = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await teamsApi.setMembers(editing.id, selectedIds);
      showToast('Team members updated', 'success');
      setEditing(null);
      await loadTeams();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update members', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (team: Team) => {
    const ok = await confirm({
      title: 'Delete team',
      message: `Delete "${team.name}"? Conversations routed to it will simply have no team.`,
      confirmText: 'Delete team',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await teamsApi.remove(team.id);
      showToast('Team deleted', 'success');
      await loadTeams();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete team', 'error');
    }
  };

  const nameOf = (userId: string) => {
    const member = members.find((m) => m.id === userId);
    return member ? member.name || member.email : 'Unknown member';
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Support Teams</h2>
        <p className="text-xs text-gray-500">
          Group agents into teams such as Support or Sales, then route conversations to a team from the Team Inbox.
        </p>
      </div>

      {canManage && (
        <form onSubmit={handleCreate} className="flex items-end gap-2 max-w-md">
          <Input
            label="New team name"
            value={newTeamName}
            maxLength={60}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="e.g. Support"
          />
          <Button type="submit" isLoading={isCreating} disabled={!newTeamName.trim()} icon={<Plus className="w-4 h-4" />}>
            Add
          </Button>
        </form>
      )}

      <Card>
        {isLoading ? (
          <Spinner size="lg" />
        ) : loadFailed ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Could not load teams.{' '}
            <button type="button" className="underline" onClick={loadTeams}>
              Try again
            </button>
          </div>
        ) : teams.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No teams yet.{canManage ? ' Create your first team above.' : ''}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {teams.map((team) => (
              <li key={team.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    {team.name}
                    <span className="text-xs font-normal text-gray-500">
                      {team.memberIds.length} member{team.memberIds.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {team.memberIds.length ? team.memberIds.map(nameOf).join(', ') : 'No members yet'}
                  </p>
                </div>
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openMembers(team)}>
                      Members
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(team)}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      aria-label={`Delete team ${team.name}`}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Members of ${editing.name}` : ''}
        description="Only active owners, admins and agents can join a team."
      >
        <div className="space-y-3">
          {eligibleMembers.length === 0 ? (
            <p className="text-sm text-gray-500">No eligible members in this workspace yet.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
              {eligibleMembers.map((member) => (
                <li key={member.id}>
                  <label className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                    />
                    <span className="flex-1 truncate">{member.name || member.email}</span>
                    <span className="text-xs text-gray-500 capitalize">{member.role}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveMembers} isLoading={isSaving}>
              Save members
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
