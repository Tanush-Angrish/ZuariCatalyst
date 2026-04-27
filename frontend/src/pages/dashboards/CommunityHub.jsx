import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import IdeaCardGrid from '../../components/IdeaCardGrid';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CommunityHub() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllIdeas = async () => {
    try {
      const data = await api.getIdeas();
      setIdeas(data);
    } catch (e) {
      console.error('Error fetching community ideas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllIdeas();
  }, []);

  const isEmployee = user?.role === 'Employee';

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-black flex items-center gap-2">
            <Users className="h-8 w-8 text-brand-blue" />
            Community Hub
          </h1>
          <p className="text-gray-500 mt-1">
            Explore all ideas and innovations across the organization.
          </p>
        </div>

        {!loading && (
          <div className="bg-brand-blue/5 border border-brand-blue/10 rounded-xl px-5 py-3 text-center sm:text-right shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-0.5">Total Ideas Submitted</p>
            <p className="text-2xl font-extrabold text-brand-black leading-none">{ideas.length}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="h-8 w-8 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin mb-4" />
          <p>Loading community ideas...</p>
        </div>
      ) : (
        <IdeaCardGrid
          ideas={ideas}
          viewType="community"
          showSearch={true}
          isEmployee={isEmployee} // Enables strict visibility mode in IdeaCardGrid
        />
      )}
    </div>
  );
}
