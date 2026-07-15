import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import IdeaCardGrid from '../../components/IdeaCardGrid';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  UserCheck, Loader2, Clock, CheckCircle2,
  AlertTriangle, Search, X, Hash, Building, ExternalLink
} from 'lucide-react';

const TABS = [
  {
    id: 'assigned',
    tourId: 'filter-action',
    label: 'Action Required',
    icon: UserCheck,
    description: 'Ideas delegated to you by the Central Team',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBg: 'bg-blue-600',
  },
  {
    id: 'underReview',
    tourId: 'filter-review',
    label: 'Under Review Queue',
    icon: Clock,
    description: 'Ideas you are actively reviewing',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBg: 'bg-amber-600',
  },
  {
    id: 'approved',
    tourId: 'filter-approved',
    label: 'Approved by Me',
    icon: CheckCircle2,
    description: 'Ideas you have finalized and converted to projects',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    activeBg: 'bg-green-600',
  },
  {
    id: 'rejected',
    tourId: 'filter-rejected',
    label: 'Declined',
    icon: AlertTriangle,
    description: 'Ideas you have decided not to pursue',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    activeBg: 'bg-red-600',
  },
];

function ProcessedIdeaRow({ idea, onViewProject }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              {idea.project && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5">
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
            {idea.status === 'Approved' ? (
              <Badge variant="success" className="text-xs flex items-center gap-1"><CheckCircle2 size={10} />Approved</Badge>
            ) : (
              <Badge variant="danger" className="text-xs flex items-center gap-1"><AlertTriangle size={10} />Declined</Badge>
            )}
            {idea.project && (
              <Badge variant="outline" className="text-xs capitalize">{idea.project.status}</Badge>
            )}
          </div>
        </div>

        {idea.project && (
          <div className="mt-3 border-t pt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => onViewProject?.(idea.project.projectId)}
              className="text-xs gap-1.5 text-violet-700 border-violet-200 hover:bg-violet-50">
              <ExternalLink size={12} />View Project
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrgAdminDashboard() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('assigned');
  const [assignedIdeas, setAssignedIdeas] = useState([]);
  const [underReviewIdeas, setUnderReviewIdeas] = useState([]);
  const [processedIdeas, setProcessedIdeas] = useState([]);
  const [loading, setLoading] = useState({ assigned: true, underReview: true, processed: true });
  const [tabSearch, setTabSearch] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading({ assigned: true, underReview: true, processed: true });

    const safeGet = (promise, label) => promise.catch(e => { console.error(`[OrgAdmin] ${label} failed:`, e); return []; });

    const [assigned, underReview, processed] = await Promise.all([
      safeGet(api.getAssignedIdeas(user.id), 'getAssignedIdeas'),
      safeGet(api.getOrgAdminUnderReview(user.id), 'getOrgAdminUnderReview'),
      safeGet(api.getOrgAdminProcessed(user.id), 'getOrgAdminProcessed'),
    ]);

    setAssignedIdeas(Array.isArray(assigned) ? assigned : []);
    setUnderReviewIdeas(Array.isArray(underReview) ? underReview : []);
    setProcessedIdeas(Array.isArray(processed) ? processed : []);
    setLoading({ assigned: false, underReview: false, processed: false });
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStatusUpdate = async (ideaId, newStatus, reason) => {
    try {
      await api.updateIdeaStatus(
        ideaId,
        newStatus,
        newStatus === 'Rejected' ? reason : undefined,
        newStatus === 'Approved' ? reason : undefined,
        newStatus === 'Approved' ? user?.id : undefined,
        newStatus === 'Approved' ? 'admin' : undefined
      );
      fetchAll();

      const isApproved = newStatus === 'Approved';
      notify({
        type: isApproved ? 'success' : 'info',
        title: isApproved ? 'Idea Approved' : 'Idea Declined',
        message: isApproved
          ? 'A project has been automatically created for this idea.'
          : 'The idea has been marked as declined.',
        event: isApproved ? 'idea_approved' : 'idea_rejected'
      });
    } catch (e) {
      console.error(e);
      notify({ type: 'error', title: 'Action failed', message: e.message || 'Error updating idea status.', event: '' });
    }
  };

  const approvedList = processedIdeas.filter(i => i.status === 'Approved');
  const rejectedList = processedIdeas.filter(i => i.status === 'Rejected');

  const counts = {
    assigned: assignedIdeas.length,
    underReview: underReviewIdeas.length,
    approved: approvedList.length,
    rejected: rejectedList.length,
  };

  const filterBySearch = (list) => {
    if (!tabSearch.trim()) return list;
    const q = tabSearch.toLowerCase();
    return list.filter(idea =>
      idea.title?.toLowerCase().includes(q) ||
      idea.authorName?.toLowerCase().includes(q) ||
      idea.authorOrganization?.toLowerCase().includes(q)
    );
  };

  const filteredApproved = filterBySearch(approvedList);
  const filteredRejected = filterBySearch(rejectedList);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">
          Org Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Review and finalize innovations assigned to you for {user?.organization}.
        </p>
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
              id={tab.tourId}
              onClick={() => { setActiveTab(tab.id); setTabSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${isActive
                  ? `${tab.activeBg} text-white border-transparent shadow-md`
                  : `bg-white ${tab.color} ${tab.border} hover:${tab.bg}`
                }`}
            >
              <Icon size={15} />
              {tab.label}
              {count > 0 && (
                <span className={`ml-1 min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center font-bold ${isActive ? 'bg-white/25 text-white' : `${tab.bg} ${tab.color}`
                  }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab description banner */}
      {(() => {
        const tab = TABS.find(t => t.id === activeTab);
        return (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${tab.bg} ${tab.border}`}>
            <tab.icon size={16} className={tab.color} />
            <p className={`text-sm font-medium ${tab.color}`}>{tab.description}</p>
          </div>
        );
      })()}

      {/* Content */}
      <div className="mt-4">
        {/* ── TAB: Action Required ───────────────────────────────────────────── */}
        {activeTab === 'assigned' && (
          loading.assigned ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-4 text-brand-blue/40" />
              <p className="text-sm">Loading assigned ideas...</p>
            </div>
          ) : assignedIdeas.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <UserCheck size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500">No ideas currently assigned to you for review.</p>
            </div>
          ) : (
            <IdeaCardGrid
              ideas={assignedIdeas}
              viewType="orgAdmin"
              onAction={fetchAll}
              onDirectAction={handleStatusUpdate}
            />
          )
        )}

        {/* ── TAB: Under Review Queue ─────────────────────────────────────── */}
        {activeTab === 'underReview' && (
          loading.underReview ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-4 text-brand-blue/40" />
              <p className="text-sm">Loading queue...</p>
            </div>
          ) : underReviewIdeas.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <Clock size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500">Your Under Review queue is empty.</p>
            </div>
          ) : (
            <IdeaCardGrid
              ideas={underReviewIdeas}
              viewType="orgAdmin"
              onAction={fetchAll}
              onDirectAction={handleStatusUpdate}
            />
          )
        )}

        {/* ── TAB: Approved ──────────────────────────────────────────────── */}
        {activeTab === 'approved' && (
          loading.processed ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-4 text-brand-blue/40" />
              <p className="text-sm">Loading approved ideas...</p>
            </div>
          ) : approvedList.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <CheckCircle2 size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500">You haven't approved any ideas yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={tabSearch}
                  onChange={e => setTabSearch(e.target.value)}
                  placeholder="Search approved ideas…"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue/40 transition-all"
                />
                {tabSearch && (
                  <button
                    type="button"
                    onClick={() => setTabSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {filteredApproved.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-400 bg-white">
                  <Search className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-sm font-semibold">No results match your search.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredApproved.map(idea => (
                    <ProcessedIdeaRow key={idea.id} idea={idea} onViewProject={() => navigate('/dashboard/projects')} />
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* ── TAB: Rejected ──────────────────────────────────────────────── */}
        {activeTab === 'rejected' && (
          loading.processed ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-4 text-brand-blue/40" />
              <p className="text-sm">Loading declined ideas...</p>
            </div>
          ) : rejectedList.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <AlertTriangle size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500">You haven't declined any ideas yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={tabSearch}
                  onChange={e => setTabSearch(e.target.value)}
                  placeholder="Search declined ideas…"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue/40 transition-all"
                />
                {tabSearch && (
                  <button
                    type="button"
                    onClick={() => setTabSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {filteredRejected.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-400 bg-white">
                  <Search className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-sm font-semibold">No results match your search.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredRejected.map(idea => (
                    <ProcessedIdeaRow key={idea.id} idea={idea} />
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
