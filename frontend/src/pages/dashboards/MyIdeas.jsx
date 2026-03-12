import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { FileText } from 'lucide-react';
import DynamicIdeaTable from '../../components/DynamicIdeaTable';

export default function MyIdeas() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    const fetchMyIdeas = async () => {
      try {
        const res = await fetch(`/api/ideas/my-ideas/${user.id}`);
        const data = await res.json();
        setIdeas(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMyIdeas();
  }, [user.id]);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'destructive';
      case 'Assigned to Org Admin': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black flex items-center gap-2">
          <FileText className="h-8 w-8 text-gray-400" /> My Submitted Ideas
        </h1>
        <p className="text-gray-500 mt-2">Track the current review status of your previously submitted proposals.</p>
      </div>

      <div className="mt-8">
        <DynamicIdeaTable ideas={ideas} viewType="myIdeas" />
      </div>
    </div>
  );
}
