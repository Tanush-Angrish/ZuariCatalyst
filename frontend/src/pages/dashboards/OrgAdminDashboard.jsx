import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LayoutDashboard, CheckCircle, XCircle } from 'lucide-react';
import IdeaCardGrid from '../../components/IdeaCardGrid';
import { useNotifications } from '../../context/NotificationContext';

export default function OrgAdminDashboard() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [assignedIdeas, setAssignedIdeas] = useState([]);

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const res = await fetch(`/api/ideas/assigned/${user.id}`);
        const data = await res.json();
        setAssignedIdeas(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAssigned();
  }, [user.id]);

  const handleStatusUpdate = async (ideaId, newStatus) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setAssignedIdeas(assignedIdeas.filter(idea => idea.id !== ideaId));
        const isApproved = newStatus === 'Approved';
        notify({
          type: isApproved ? 'success' : 'info',
          title: isApproved ? 'Idea Approved' : 'Idea Rejected',
          message: isApproved
            ? 'A project has been automatically created for this idea.'
            : 'The idea has been marked as rejected.',
          event: isApproved ? 'idea_approved' : 'idea_rejected'
        });
      }
    } catch (e) {
      console.error(e);
      notify({ type: 'error', title: 'Action failed', message: 'Error updating idea status.', event: '' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">{user.organization} Admin Dashboard</h1>
        <p className="text-gray-500">Manage innovations specifically assigned to you by the Central Team.</p>
      </div>

      <div className="mt-8">
        <IdeaCardGrid
          ideas={assignedIdeas}
          viewType="orgAdmin"
          onAction={handleStatusUpdate}
        />
      </div>
    </div>
  );
}
