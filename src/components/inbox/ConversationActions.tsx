import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, UserCheck } from 'lucide-react';
import { conversationsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import type { Conversation, Team, TeamMember } from '../../types';

type BusyAction = 'assign' | 'team' | 'claim' | 'status';

interface ConversationActionsProps {
  conversation: Conversation;
  /** Active owners, admins and agents the case can be assigned to. */
  assignees: TeamMember[];
  teams: Team[];
  /** Called after a successful change so the inbox can refetch. */
  onChanged: () => void;
}

const SELECT_CLASS =
  'rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 max-w-[10rem]';

const memberLabel = (member: TeamMember) => member.name || member.email;

/** Close / reopen, assign to agent, assign to team and claim for the open conversation. */
export const ConversationActions: React.FC<ConversationActionsProps> = ({
  conversation,
  assignees,
  teams,
  onChanged,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<BusyAction | null>(null);

  const canWork = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'agent';
  const isClosed = conversation.status === 'closed';
  const assignedAgentId = conversation.assignedAgentUserId ?? null;
  const assignedTeamId = conversation.assignedTeamId ?? null;

  const run = async (action: BusyAction, task: () => Promise<unknown>, success: string) => {
    setBusy(action);
    try {
      await task();
      showToast(success, 'success');
      onChanged();
    } catch (err: any) {
      showToast(err?.message || 'Action failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  // Viewers can see who holds the case but cannot change anything.
  if (!canWork) {
    return (
      <div className="px-3.5 sm:px-6 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
        Assigned to <strong>{conversation.assignedAgentName || 'nobody'}</strong>
        {conversation.assignedTeamName && <> · Team <strong>{conversation.assignedTeamName}</strong></>}
      </div>
    );
  }

  return (
    <div className="px-3.5 sm:px-6 py-2 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-2 shrink-0">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
        Agent
        <select
          className={SELECT_CLASS}
          value={assignedAgentId ?? ''}
          disabled={busy !== null}
          aria-label="Assign to agent"
          onChange={(e) =>
            run(
              'assign',
              () => conversationsApi.assignAgent(conversation.id, e.target.value || null),
              e.target.value ? 'Conversation assigned' : 'Conversation unassigned'
            )
          }
        >
          <option value="">Unassigned</option>
          {assignees.map((member) => (
            <option key={member.id} value={member.id}>
              {memberLabel(member)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
        Team
        <select
          className={SELECT_CLASS}
          value={assignedTeamId ?? ''}
          disabled={busy !== null}
          aria-label="Assign to team"
          onChange={(e) =>
            run(
              'team',
              () => conversationsApi.assignTeam(conversation.id, e.target.value || null),
              e.target.value ? 'Routed to team' : 'Team cleared'
            )
          }
        >
          <option value="">No team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      {!assignedAgentId && !isClosed && (
        <Button
          variant="outline"
          size="sm"
          isLoading={busy === 'claim'}
          disabled={busy !== null}
          onClick={() => run('claim', () => conversationsApi.claim(conversation.id), 'You took this case')}
          icon={<UserCheck className="w-3.5 h-3.5" />}
        >
          Claim
        </Button>
      )}

      <div className="ml-auto">
        {isClosed ? (
          <Button
            variant="outline"
            size="sm"
            isLoading={busy === 'status'}
            disabled={busy !== null}
            onClick={() =>
              run('status', () => conversationsApi.updateStatus(conversation.id, 'open'), 'Case reopened')
            }
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reopen
          </Button>
        ) : (
          <Button
            variant="success"
            size="sm"
            isLoading={busy === 'status'}
            disabled={busy !== null}
            onClick={() =>
              run('status', () => conversationsApi.updateStatus(conversation.id, 'closed'), 'Case closed')
            }
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Close case
          </Button>
        )}
      </div>
    </div>
  );
};
