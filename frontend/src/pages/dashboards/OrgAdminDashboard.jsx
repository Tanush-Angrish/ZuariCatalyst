import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LayoutDashboard, CheckCircle2, XCircle, Users, Loader2, UserCheck } from 'lucide-react';
import IdeaCardGrid from '../../components/IdeaCardGrid';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';

export default function OrgAdminDashboard() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [assignedIdeas, setAssignedIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssigned = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await api.getAssignedIdeas(user.id);
      setAssignedIdeas(data);
    } catch (e) {
      console.error('[OrgAdmin] Error fetching assigned:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAssigned();
  }, [fetchAssigned]);

  const handleStatusUpdate = async (ideaId, newStatus, rejectionReason) => {
    try {
      await api.updateIdeaStatus(ideaId, newStatus, rejectionReason);
      fetchAssigned();

      const isApproved = newStatus === 'Approved';
      notify({
        type: isApproved ? 'success' : 'info',
        title: isApproved ? 'Idea Approved' : 'Idea Rejected',
        message: isApproved
          ? 'A project has been automatically created for this idea.'
          : 'The idea has been marked as rejected.',
        event: isApproved ? 'idea_approved' : 'idea_rejected'
      });
    } catch (e) {
      console.error(e);
      notify({ type: 'error', title: 'Action failed', message: 'Error updating idea status.', event: '' });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">
          Ideas Assigned to Me
        </h1>
        <p className="text-gray-500 mt-1">
          Review and finalize innovations assigned to you for {user?.organization}.
        </p>
      </div>

      {/* Info Box */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/50">
        <UserCheck size={16} className="text-brand-blue" />
        <p className="text-sm font-medium text-brand-blue">
          These ideas have been delegated to you by the Central Team for final review.
        </p>
      </div>

      {/* Content */}
      <div className="mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin mb-4 text-brand-blue/40" />
            <p className="text-sm">Loading ideas...</p>
          </div>
        ) : (
          assignedIdeas.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <UserCheck size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500">No ideas currently assigned to you for review.</p>
            </div>
          ) : (
            <IdeaCardGrid
              ideas={assignedIdeas}
              viewType="orgAdmin"
              onAction={handleStatusUpdate}
            />
          )
        )}
      </div>
    </div>
  );
}
