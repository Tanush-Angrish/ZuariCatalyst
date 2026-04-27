import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { FileText } from 'lucide-react';
import IdeaCardGrid from '../../components/IdeaCardGrid';
import { api } from '../../services/api';


export default function MyIdeas() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);

  const [limits, setLimits] = useState({ submittedCount: 0, draftCount: 0 });

  useEffect(() => {
    const fetchMyIdeas = async () => {
      try {
        const [data, limitsData] = await Promise.all([
          api.getMyIdeas(user.id),
          api.getIdeaLimits(user.id)
        ]);
        setIdeas(data);
        setLimits(limitsData);
      } catch (e) {
        console.error(e);
      }
    };
    if (user?.id) fetchMyIdeas();
  }, [user?.id]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-black flex items-center gap-2">
            <FileText className="h-8 w-8 text-gray-400" /> My Submitted Ideas
          </h1>
          <p className="text-gray-500 mt-2">Track the current review status of your previously submitted proposals.</p>
        </div>
        
        {/* Limits Display */}
        <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm shrink-0 divide-x divide-gray-100 overflow-hidden">
          <div className="flex flex-col items-center px-4 py-2.5 bg-gray-50/50">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Monthly Subm.</span>
             <span className={`text-[17px] font-extrabold ${limits.submittedCount >= 5 ? 'text-red-500' : 'text-brand-blue'}`}>
               {limits.submittedCount} <span className="text-gray-400 text-sm font-medium">/ 5</span>
             </span>
          </div>
          <div className="flex flex-col items-center px-4 py-2.5 bg-gray-50/50">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Saved Drafts</span>
             <span className={`text-[17px] font-extrabold ${limits.draftCount >= 3 ? 'text-amber-500' : 'text-brand-blue'}`}>
               {limits.draftCount} <span className="text-gray-400 text-sm font-medium">/ 3</span>
             </span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <IdeaCardGrid ideas={ideas} viewType="myIdeas" />
      </div>
    </div>
  );
}
