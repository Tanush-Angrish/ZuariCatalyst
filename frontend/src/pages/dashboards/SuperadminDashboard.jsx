import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LayoutList, UserCheck } from 'lucide-react';
import DynamicIdeaTable from '../../components/DynamicIdeaTable';

export default function SuperadminDashboard() {
  const [ideas, setIdeas] = useState([]);
  const [orgAdmins, setOrgAdmins] = useState([]);
  const [selectedAdmins, setSelectedAdmins] = useState({}); // ideaId -> adminId

  const fetchPendingIdeas = async () => {
    try {
      const res = await fetch('/api/ideas/pending');
      const data = await res.json();
      setIdeas(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrgAdmins = async () => {
    try {
      const res = await fetch('/api/ideas/orgadmins');
      const data = await res.json();
      setOrgAdmins(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPendingIdeas();
    fetchOrgAdmins();
  }, []);

  const handleAssign = async (ideaId) => {
    const adminId = selectedAdmins[ideaId];
    if (!adminId) return alert('Please select an Org Admin to assign this idea to.');

    try {
      const res = await fetch(`/api/ideas/${ideaId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: adminId })
      });

      if (res.ok) {
        // Remove from list
        setIdeas(ideas.filter(idea => idea.id !== ideaId));
        setSelectedAdmins(prev => {
          const copy = { ...prev };
          delete copy[ideaId];
          return copy;
        });
      }
    } catch (e) {
      console.error(e);
      alert('Error assigning idea');
    }
  };

  const handleDirectAction = async (ideaId, status) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }) // 'Approved' or 'Rejected'
      });

      if (res.ok) {
        setIdeas(ideas.filter(idea => idea.id !== ideaId));
      }
    } catch (e) {
      console.error(e);
      alert('Error updating idea status');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">Idea Review Queue</h1>
        <p className="text-gray-500">Assign pending ideas to Organization Administrators for review.</p>
      </div>

      <div className="mt-8">
        <DynamicIdeaTable
          ideas={ideas}
          viewType="superadmin"
          onAction={handleAssign}
          orgAdmins={orgAdmins}
          selectedAdmins={selectedAdmins}
          onAdminSelect={(ideaId, adminId) => setSelectedAdmins({ ...selectedAdmins, [ideaId]: adminId })}
          onDirectAction={handleDirectAction}
        />
      </div>
    </div>
  );
}
