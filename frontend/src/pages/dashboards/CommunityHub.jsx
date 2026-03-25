import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import IdeaCardGrid from '../../components/IdeaCardGrid';
import { api } from '../../services/api';


export default function CommunityHub() {
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black flex items-center gap-2">
          <Users className="h-8 w-8 text-brand-blue" />
          Community Hub
        </h1>
        <p className="text-gray-500 mt-1">
          Explore all ideas and innovations across the organization.
        </p>
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
        />
      )}
    </div>
  );
}
