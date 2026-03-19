import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import IdeaCardGrid from '../../components/IdeaCardGrid';
import { api } from '../../services/api';


export default function CommunityHub() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredIdeas = ideas.filter(idea => 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.authorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-black flex items-center gap-2">
            <Users className="h-8 w-8 text-brand-blue" />
            Community Hub
          </h1>
          <p className="text-gray-500 mt-1">
            Explore all ideas and innovations across the organization.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ideas, authors, or depts..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="h-8 w-8 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin mb-4" />
          <p>Loading community ideas...</p>
        </div>
      ) : (
        <IdeaCardGrid 
          ideas={filteredIdeas} 
          viewType="community" 
        />
      )}
      
      {!loading && filteredIdeas.length === 0 && searchQuery && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500">No ideas match your search query.</p>
        </div>
      )}
    </div>
  );
}
