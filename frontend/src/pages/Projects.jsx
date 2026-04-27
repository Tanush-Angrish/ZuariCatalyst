import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Users, PartyPopper } from 'lucide-react';
import IdeaCardGrid from '../components/IdeaCardGrid';
import { api } from '../services/api';


export default function Projects() {
  const [ideas, setIdeas] = useState([]);

  const fetchCommunityIdeas = async () => {
    try {
      const data = await api.getInnovationProjects();
      setIdeas(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCommunityIdeas();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-brand-blue to-[#004e90] p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <Badge className="bg-white/20 text-white hover:bg-white/30 mb-4 border-none">
            <PartyPopper className="w-3 h-3 mr-2 inline" /> Innovation Feed
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
             Projects
          </h1>
          <p className="text-blue-100 max-w-2xl">
            Explore approved innovations and ideas submitted by your peers that are slated for implementation.
          </p>
        </div>
        <Users className="w-48 h-48 absolute -right-8 -bottom-8 text-white/5" />
      </div>

      <div className="mt-8">
        <IdeaCardGrid ideas={ideas} viewType="community" />
      </div>
    </div>
  );
}
