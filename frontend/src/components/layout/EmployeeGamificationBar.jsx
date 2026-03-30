import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Coins, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeGamificationBar({ userId }) {
  const [points, setPoints] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    api.getUserPoints(userId)
      .then(res => {
        if (mounted) setPoints(res.totalPoints || 0);
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, [userId]);

  const coins = points * 5;
  const progress = Math.min(points, 200);
  const percentage = (progress / 200) * 100;

  return (
    <>
      {/* Mobile Version (Compact) */}
      <div 
        onClick={() => navigate('/dashboard/leaderboard')}
        className="flex md:hidden items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors shadow-sm"
      >
        <Coins className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />
        <span className="text-sm font-bold text-brand-black">{coins.toLocaleString()}</span>
      </div>

      {/* Desktop Version (Full Bar) */}
      <div 
        onClick={() => navigate('/dashboard/leaderboard')}
        className="flex-1 max-w-[650px] mx-6 hidden md:flex items-center bg-gray-50/80 hover:bg-gray-100 border border-gray-200/60 rounded-full cursor-pointer transition-all duration-300 group shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] h-12 overflow-hidden"
      >
        {/* Left Area (Progress) */}
        <div className="flex-1 px-5 flex flex-col justify-center h-full">
          {/* Top text */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <Zap className="h-3 w-3 text-brand-blue fill-brand-blue/20" />
              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Idea Score</span>
            </div>
            <div className="text-[10px] font-semibold text-gray-400">
              <span className="text-gray-700">{points}</span> / 200 Pts
            </div>
          </div>
          
          {/* Progress Bar Container */}
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden relative">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-brand-blue to-purple-500 relative transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            >
              {/* Smooth flow animation */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Right Area (Coins) */}
        <div className="px-5 flex flex-col items-center justify-center min-w-[100px] h-full bg-white/50">
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 whitespace-nowrap">Coin Balance</span>
          <div className="flex items-center gap-1.5 text-brand-black">
            <Coins className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />
            <span className="text-base font-extrabold leading-none tracking-tight">{coins.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </>
  );
}
