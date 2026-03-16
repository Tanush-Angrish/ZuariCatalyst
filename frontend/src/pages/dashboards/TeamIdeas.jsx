import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Users } from 'lucide-react';
import IdeaCardGrid from '../../components/IdeaCardGrid';

export default function TeamIdeas() {
  const { user } = useAuth();
  const [teamIdeas, setTeamIdeas] = useState([]);

  useEffect(() => {
    const fetchTeamIdeas = async () => {
      try {
        const res = await fetch(`/api/ideas/team/${user.organization}`);
        const data = await res.json();
        setTeamIdeas(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTeamIdeas();
  }, [user.organization]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">Team Ideas ({user.organization})</h1>
        <p className="text-gray-500">Read-only view of all ideas submitted by employees in your organization.</p>
      </div>

      <div className="mt-8">
        <IdeaCardGrid ideas={teamIdeas} viewType="team" />
      </div>
    </div>
  );
}
