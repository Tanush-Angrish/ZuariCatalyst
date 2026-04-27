import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [myPoints, setMyPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getLeaderboard(),
      user?.id ? api.getUserPoints(user.id) : Promise.resolve({ totalPoints: 0 })
    ])
      .then(([lb, pts]) => {
        setLeaders(lb);
        setMyPoints(pts.totalPoints);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const rankIcon = (rank) => {
    if (rank === 1) return <Crown size={18} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={18} className="text-gray-400" />;
    if (rank === 3) return <Medal size={18} className="text-amber-600" />;
    return <span className="text-sm font-bold text-gray-400 w-[18px] text-center">{rank}</span>;
  };

  const rankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-amber-200';
    return 'bg-white border-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue/5 text-brand-blue text-xs font-bold uppercase tracking-widest mb-4 border border-brand-blue/10">
          <Trophy size={14} />
          Leaderboard
        </div>
        <h1 className="text-3xl font-extrabold text-brand-black tracking-tight" style={{ fontFamily: 'var(--fd, inherit)' }}>
          Top Innovators
        </h1>
        <p className="text-gray-500 mt-2">
          Recognising ideas that matter. Every submission, upvote, and project counts.
        </p>
      </div>

      {/* My Points Card */}
      {user && user.role === 'Employee' && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-brand-blue/5 border border-brand-blue/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
              {user.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-black">{user.name}</p>
              <p className="text-xs text-gray-500">{user.organization || 'No org'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-brand-blue">{myPoints}</p>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Your Points</p>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {leaders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Star size={40} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No points earned yet</p>
          <p className="text-sm mt-1">Submit ideas and earn points to appear here!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaders.map((entry) => {
            const isMe = user?.id === entry.userId;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${rankBg(entry.rank)} ${isMe ? 'ring-2 ring-brand-blue/30 shadow-sm' : ''}`}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center shrink-0">
                  {rankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${entry.rank <= 3 ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {entry.name?.charAt(0) || '?'}
                </div>

                {/* Name + Org */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isMe ? 'text-brand-blue' : 'text-brand-black'}`}>
                    {entry.name} {isMe && <span className="text-xs text-gray-400">(You)</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{entry.organization}</p>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <p className={`text-lg font-extrabold ${entry.rank <= 3 ? 'text-brand-blue' : 'text-gray-700'}`}>
                    {entry.totalPoints}
                  </p>
                  <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
