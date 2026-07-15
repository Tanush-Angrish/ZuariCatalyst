import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Crown, Medal, Star, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

// ─── Medal tokens ─────────────────────────────────────────────────────────────
const M = {
  1: {
    Icon: Crown,
    iconCls:   'text-yellow-500',
    rowCls:    'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300',
    ptsCls:    'text-yellow-700',
    rankLabel: 'bg-yellow-400 text-white',
  },
  2: {
    Icon: Medal,
    iconCls:   'text-slate-400',
    rowCls:    'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-300',
    ptsCls:    'text-slate-600',
    rankLabel: 'bg-slate-400 text-white',
  },
  3: {
    Icon: Medal,
    iconCls:   'text-amber-600',
    rowCls:    'bg-gradient-to-r from-orange-50 to-amber-50 border-amber-400',
    ptsCls:    'text-amber-700',
    rankLabel: 'bg-amber-500 text-white',
  },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const COLORS = [
  'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700', 'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
];

function Avatar({ name, photoUrl, size = 'sm' }) {
  const dim = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
  }[size] || 'h-8 w-8 text-xs';
  const color = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  if (photoUrl) {
    return (
      <img
        src={api.getFileUrl(photoUrl)}
        alt={name}
        className={`${dim} rounded-full object-cover border-2 border-white shadow-sm shrink-0`}
      />
    );
  }
  return (
    <div className={`${dim} ${color} rounded-full flex items-center justify-center font-bold shrink-0 border-2 border-white shadow-sm`}>
      {initials}
    </div>
  );
}

// ─── Single row ───────────────────────────────────────────────────────────────
function Row({ entry, isMe, showOrg = false }) {
  const m = M[entry.rank];

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all
        ${m
          ? m.rowCls
          : isMe
            ? 'bg-blue-50 border-blue-200'
            : 'bg-white border-gray-100 hover:bg-gray-50'
        }`}
    >
      {/* Rank indicator */}
      <div className="w-7 shrink-0 flex items-center justify-center">
        {m
          ? <m.Icon size={16} className={m.iconCls} />
          : <span className="text-xs font-bold text-gray-400 w-full text-center">{entry.rank}</span>
        }
      </div>

      <Avatar name={entry.name} photoUrl={entry.profilePhotoUrl} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-sm font-semibold truncate ${isMe ? 'text-brand-blue' : 'text-gray-900'}`}>
            {entry.name}
          </span>
          {isMe && (
            <span className="shrink-0 text-[9px] font-bold bg-brand-blue text-white px-1.5 py-0.5 rounded-full leading-none">
              You
            </span>
          )}
        </div>
        {showOrg && entry.organization && entry.organization !== '—' && (
          <p className="text-[10px] text-gray-400 truncate">{entry.organization}</p>
        )}
      </div>

      <span className={`text-sm font-extrabold shrink-0 ${m ? m.ptsCls : isMe ? 'text-brand-blue' : 'text-gray-600'}`}>
        {entry.totalPoints}
        <span className="text-[9px] font-normal text-gray-400 ml-0.5">pts</span>
      </span>
    </div>
  );
}

// ─── Panel (global or my-org) ─────────────────────────────────────────────────
function Panel({ title, subtitle, entries, loading, userId, showOrg, emptyText, borderClass }) {
  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm flex items-center justify-center h-[520px] ${borderClass || 'border border-gray-100'}`}>
        <Loader2 size={20} className="animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-[520px] ${borderClass || 'border border-gray-100'}`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50 shrink-0">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-amber-500 shrink-0" />
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 leading-tight">{title}</h2>
            {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <Star size={24} className="text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">{emptyText || 'No entries yet'}</p>
          </div>
        ) : entries.map(e => (
          <Row key={e.userId} entry={e} isMe={e.userId === userId} showOrg={showOrg} />
        ))}
      </div>
    </div>
  );
}

// ─── Dept card (always fully expanded) ───────────────────────────────────────
function DeptCard({ org, entries, userId }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
        <div className="h-6 w-6 rounded-md bg-brand-blue/8 flex items-center justify-center shrink-0">
          <Building2 size={12} className="text-brand-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold text-gray-900 truncate leading-tight">{org}</h3>
          <p className="text-[10px] text-gray-400">{entries.length} ranked</p>
        </div>
        {/* Top scorer badge */}
        {entries[0] && (
          <span className="text-[10px] font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <Crown size={9} className="text-yellow-500" />
            {entries[0].totalPoints} pts
          </span>
        )}
      </div>

      {/* All rows */}
      <div className="p-3 space-y-1.5">
        {entries.map(e => (
          <Row key={e.userId} entry={e} isMe={e.userId === userId} showOrg={false} />
        ))}
      </div>
    </div>
  );
}

// ─── My score strip (compact) ─────────────────────────────────────────────────
function ScoreStrip({ user, myPoints, globalRank, orgRank }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-brand-blue to-blue-600 rounded-xl text-white shadow-md">
      <Avatar name={user.name} photoUrl={user.profilePhotoUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate leading-tight">{user.name}</p>
        <p className="text-[10px] text-blue-200 truncate">{user.organization || '—'}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-lg font-extrabold leading-none">{myPoints}</p>
          <p className="text-[9px] text-blue-200 uppercase tracking-widest">pts</p>
        </div>
        {globalRank && (
          <div className="bg-white/15 rounded-lg px-2.5 py-1.5 border border-white/20 text-center">
            <p className="text-sm font-extrabold leading-none">#{globalRank}</p>
            <p className="text-[8px] text-blue-200 uppercase tracking-widest">global</p>
          </div>
        )}
        {orgRank && (
          <div className="bg-white/15 rounded-lg px-2.5 py-1.5 border border-white/20 text-center">
            <p className="text-sm font-extrabold leading-none">#{orgRank}</p>
            <p className="text-[8px] text-blue-200 uppercase tracking-widest">in org</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const { user } = useAuth();

  const [globalEntries, setGlobalEntries] = useState([]);
  const [orgEntries,    setOrgEntries]    = useState([]);
  const [allOrgs,       setAllOrgs]       = useState([]);
  const [myPoints,      setMyPoints]      = useState(0);
  const [loading,       setLoading]       = useState(true);

  const myId  = user?.id;
  const myOrg = user?.organization;
  const hasOrg = !!myOrg;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [
        api.getLeaderboard(),                                                             // [0]
        api.getAllOrgsLeaderboard(),                                                      // [1]
        myId ? api.getUserPoints(myId) : Promise.resolve({ totalPoints: 0 }),            // [2]
        ...(hasOrg ? [api.getOrgLeaderboard(myOrg)] : []),                               // [3]
      ];
      const res = await Promise.allSettled(calls);
      const val = (i) => res[i]?.status === 'fulfilled' ? res[i].value : null;

      setGlobalEntries(Array.isArray(val(0)) ? val(0) : []);
      setAllOrgs(Array.isArray(val(1)) ? val(1) : []);
      setMyPoints(val(2)?.totalPoints || 0);
      if (hasOrg) setOrgEntries(Array.isArray(val(3)) ? val(3) : []);
    } catch (e) {
      console.error('Leaderboard:', e);
    } finally {
      setLoading(false);
    }
  }, [myId, myOrg, hasOrg]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const globalRank = globalEntries.find(e => e.userId === myId)?.rank;
  const orgRank    = orgEntries.find(e => e.userId === myId)?.rank;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up pb-8">

      {/* ── Page title ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Trophy size={20} className="text-amber-500" />
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">Leaderboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Rankings across Zuari Catalyst — every idea earns points.</p>
        </div>
      </div>

      {/* ── Personal score strip ────────────────────────────────────────────── */}
      {user && !loading && myPoints > 0 && (
        <ScoreStrip
          user={user}
          myPoints={myPoints}
          globalRank={globalRank}
          orgRank={hasOrg ? orgRank : undefined}
        />
      )}

      {/* ── Global + My Org panels side-by-side ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={hasOrg ? '' : 'md:col-span-2'}>
          <Panel
            title="Global Rankings"
            subtitle="All organizations combined"
            entries={globalEntries}
            loading={loading}
            userId={myId}
            showOrg={true}
            emptyText="No ideas submitted yet — be the first innovator!"
            borderClass="border-2 border-brand-blue shadow-md"
          />
        </div>

        {hasOrg && (
          <Panel
            title={myOrg}
            subtitle="Your department"
            entries={orgEntries}
            loading={loading}
            userId={myId}
            showOrg={false}
            emptyText="Your org hasn't earned points yet."
          />
        )}
      </div>

      {/* ── Department-wise — fully expanded cards, visible to everyone ───────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} className="text-gray-400" />
          <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">All Departments</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin text-brand-blue" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : allOrgs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Building2 size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No department data yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allOrgs.map(({ org, entries }) => (
              <DeptCard key={org} org={org} entries={entries} userId={myId} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
