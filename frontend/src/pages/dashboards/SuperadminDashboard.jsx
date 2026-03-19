import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import IdeaCardGrid from '../../components/IdeaCardGrid';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  Inbox, UserCheck, CheckCircle2, Building,
  RotateCcw, ExternalLink, Loader2, Hash
} from 'lucide-react';

// ─── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'review',
    label: 'Ideas to Review',
    icon: Inbox,
    description: 'Newly submitted ideas awaiting your action',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBg: 'bg-amber-600',
  },
  {
    id: 'assigned',
    label: 'Assigned to Org Admin',
    icon: UserCheck,
    description: 'Ideas currently being reviewed by an Org Admin',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBg: 'bg-blue-600',
  },
  {
    id: 'approved',
    label: 'Approved by Me',
    icon: CheckCircle2,
    description: 'Ideas directly approved and converted to projects',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    activeBg: 'bg-green-600',
  },
];

// ─── Assigned Ideas Row Table ────────────────────────────────────────────────
function AssignedIdeaRow({ idea, orgAdmins, onReassign }) {
  const [reassigning, setReassigning] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [saving, setSaving] = useState(false);
  const { notify } = useNotifications();

  const handleReassign = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    try {
      await api.assignIdea(idea.id, parseInt(selectedAdmin));
      notify({ type: 'success', title: 'Reassigned', message: 'Idea reassigned to new Org Admin.', event: '' });
      setReassigning(false);
      setSelectedAdmin('');
      onReassign?.();
    } catch (e) {
      notify({ type: 'error', title: 'Failed', message: 'Could not reassign idea.', event: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-black text-sm truncate">{idea.title}</p>
            <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-500">
              {idea.authorOrganization && (
                <span className="flex items-center gap-1">
                  <Building size={11} />{idea.authorOrganization}
                </span>
              )}
              <span>Submitted by <strong>{idea.authorName}</strong></span>
              <span>• {new Date(idea.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant="warning" className="text-xs">{idea.status}</Badge>
            <div className="text-xs text-right text-gray-600">
              <span className="font-medium">Assigned to:</span>{' '}
              <span className="font-bold text-brand-black">{idea.assignedToName}</span>
              {idea.assignedToOrg && idea.assignedToOrg !== '—' && (
                <span className="text-gray-400"> ({idea.assignedToOrg})</span>
              )}
            </div>
          </div>
        </div>

        {/* Reassign panel */}
        {reassigning ? (
          <div className="mt-3 flex gap-2 items-center border-t pt-3">
            <select
              className="flex-1 text-xs border border-gray-300 rounded-md p-1.5 focus:border-brand-blue focus:outline-none"
              value={selectedAdmin}
              onChange={e => setSelectedAdmin(e.target.value)}
            >
              <option value="">Select new Org Admin…</option>
              {orgAdmins.map(a => (
                <option key={a.id} value={a.id}>{a.name}{a.organization ? ` (${a.organization})` : ''}</option>
              ))}
            </select>
            <Button size="sm" onClick={handleReassign} disabled={!selectedAdmin || saving} className="text-xs shrink-0">
              {saving ? <Loader2 size={13} className="animate-spin" /> : 'Reassign'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setReassigning(false); setSelectedAdmin(''); }} className="text-xs shrink-0">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="mt-3 border-t pt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setReassigning(true)} className="text-xs gap-1.5">
              <RotateCcw size={12} />Reassign
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Approved Ideas Row ───────────────────────────────────────────────────────
function ApprovedIdeaRow({ idea, onViewProject }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              {idea.project && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 border border-green-200 rounded px-1.5 py-0.5">
                  <Hash size={9} />{idea.project.projectId}
                </span>
              )}
              <p className="font-semibold text-brand-black text-sm truncate">{idea.title}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
              {idea.authorOrganization && (
                <span className="flex items-center gap-1"><Building size={11} />{idea.authorOrganization}</span>
              )}
              <span>Submitted by <strong>{idea.authorName}</strong></span>
              <span>• {new Date(idea.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant="success" className="text-xs">Approved</Badge>
            {idea.project && (
              <Badge variant="outline" className="text-xs capitalize">{idea.project.status}</Badge>
            )}
          </div>
        </div>

        {idea.project && (
          <div className="mt-3 border-t pt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => onViewProject?.(idea.project.projectId)}
              className="text-xs gap-1.5 text-green-700 border-green-200 hover:bg-green-50">
              <ExternalLink size={12} />View Project
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
  const { notify } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('review');
  const [pendingIdeas, setPendingIdeas] = useState([]);
  const [assignedIdeas, setAssignedIdeas] = useState([]);
  const [approvedIdeas, setApprovedIdeas] = useState([]);
  const [orgAdmins, setOrgAdmins] = useState([]);
  const [selectedAdmins, setSelectedAdmins] = useState({});
  const [loading, setLoading] = useState({ review: true, assigned: true, approved: true });

  const fetchAll = useCallback(async () => {
    setLoading({ review: true, assigned: true, approved: true });

    // Fetch each independently so one failure doesn't silence the rest
    const safeGet = (promise, label) =>
      promise.catch(e => { console.error(`[Dashboard] ${label} failed:`, e); return []; });

    const [pending, assigned, approved, admins] = await Promise.all([
      safeGet(api.getPendingIdeas(), 'getPendingIdeas'),
      safeGet(api.getCentralAssigned(), 'getCentralAssigned'),
      safeGet(api.getCentralApproved(), 'getCentralApproved'),
      safeGet(api.getOrgAdmins(), 'getOrgAdmins'),
    ]);

    console.log('[Dashboard] pending:', pending.length, '| assigned:', assigned.length, '| approved:', approved.length);
    setPendingIdeas(Array.isArray(pending) ? pending : []);
    setAssignedIdeas(Array.isArray(assigned) ? assigned : []);
    setApprovedIdeas(Array.isArray(approved) ? approved : []);
    setOrgAdmins(Array.isArray(admins) ? admins : []);
    setLoading({ review: false, assigned: false, approved: false });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);


  const handleAssign = async (ideaId) => {
    const adminId = selectedAdmins[ideaId];
    if (!adminId) return alert('Please select an Org Admin to assign this idea to.');
    try {
      await api.assignIdea(ideaId, adminId);
      notify({ type: 'success', title: 'Idea Assigned', message: 'Idea sent to Org Admin for review.', event: 'idea_assigned' });
      setSelectedAdmins(prev => { const c = { ...prev }; delete c[ideaId]; return c; });
      fetchAll();
    } catch (e) {
      notify({ type: 'error', title: 'Assignment failed', message: 'Error assigning idea.', event: '' });
    }
  };

  const handleDirectAction = async (ideaId, status) => {
    try {
      await api.updateIdeaStatus(ideaId, status);
      const isApp = status === 'Approved';
      notify({
        type: isApp ? 'success' : 'info',
        title: isApp ? 'Idea Approved' : 'Idea Rejected',
        message: isApp ? 'Project auto-created.' : 'Idea rejected.',
        event: isApp ? 'idea_approved' : 'idea_rejected',
      });
      fetchAll();
    } catch (e) {
      alert('Error updating idea status');
    }
  };

  const counts = {
    review: pendingIdeas.length,
    assigned: assignedIdeas.length,
    approved: approvedIdeas.length,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">Central Team Dashboard</h1>
        <p className="text-gray-500 mt-1">Review, assign, and track ideas across the organization.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? `${tab.activeBg} text-white border-transparent shadow-md`
                  : `bg-white ${tab.color} ${tab.border} hover:${tab.bg}`
              }`}
            >
              <Icon size={15} />
              {tab.label}
              {count > 0 && (
                <span className={`ml-1 min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center font-bold ${
                  isActive ? 'bg-white/25 text-white' : `${tab.bg} ${tab.color}`
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab header description */}
      {(() => {
        const tab = TABS.find(t => t.id === activeTab);
        return (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${tab.bg} ${tab.border}`}>
            <tab.icon size={16} className={tab.color} />
            <p className={`text-sm font-medium ${tab.color}`}>{tab.description}</p>
          </div>
        );
      })()}

      {/* ── TAB 1: Ideas to Review ─────────────────────────────────────────── */}
      {activeTab === 'review' && (
        loading.review ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 size={20} className="animate-spin" /> Loading ideas…
          </div>
        ) : (
          <IdeaCardGrid
            ideas={pendingIdeas}
            viewType="superadmin"
            onAction={handleAssign}
            orgAdmins={orgAdmins}
            selectedAdmins={selectedAdmins}
            onAdminSelect={(ideaId, adminId) => setSelectedAdmins(prev => ({ ...prev, [ideaId]: adminId }))}
            onDirectAction={handleDirectAction}
          />
        )
      )}

      {/* ── TAB 2: Assigned to Org Admin ───────────────────────────────────── */}
      {activeTab === 'assigned' && (
        loading.assigned ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 size={20} className="animate-spin" /> Loading assigned ideas…
          </div>
        ) : assignedIdeas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 bg-white">
            <UserCheck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-brand-black">No ideas currently assigned</h3>
            <p className="text-sm mt-1">Ideas you assign to Org Admins will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {assignedIdeas.map(idea => (
              <AssignedIdeaRow
                key={idea.id}
                idea={idea}
                orgAdmins={orgAdmins}
                onReassign={fetchAll}
              />
            ))}
          </div>
        )
      )}

      {/* ── TAB 3: Approved by Me ──────────────────────────────────────────── */}
      {activeTab === 'approved' && (
        loading.approved ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 size={20} className="animate-spin" /> Loading approved ideas…
          </div>
        ) : approvedIdeas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 bg-white">
            <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-brand-black">No approved ideas yet</h3>
            <p className="text-sm mt-1">Ideas you approve directly will appear here with their project IDs.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {approvedIdeas.map(idea => (
              <ApprovedIdeaRow
                key={idea.id}
                idea={idea}
                onViewProject={() => navigate('/dashboard/projects')}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
