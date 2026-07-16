import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';
import {
  Lightbulb, ClipboardList, CheckCircle, XCircle, Users, TrendingUp,
  RefreshCw, Info, ChevronDown, Calendar, Loader2, AlertCircle
} from 'lucide-react';

// ─── Colour palette for pie chart segments ────────────────────────────────────
const PIE_COLOURS = [
  '#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#0891b2',
  '#be123c', '#ca8a04', '#0d9488', '#9333ea', '#dc2626',
];

// ─── Info tooltip ──────────────────────────────────────────────────────────────
function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-gray-400 hover:text-blue-600 transition-colors"
        aria-label="More information"
      >
        <Info size={13} />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 rounded-lg bg-gray-800 text-white text-xs px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, colour, info }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2.5 rounded-lg shrink-0 ${colour}`}>
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-sm font-medium text-gray-500 leading-snug flex items-center flex-wrap">
          {label}
          {info && <InfoTip text={info} />}
        </p>
      </div>
      <p className="text-3xl font-bold text-gray-900 tracking-tight mt-auto">{value ?? '—'}</p>
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div className="relative flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:border-blue-400 transition-colors">
      <ChevronDown size={13} className="text-gray-400 pointer-events-none shrink-0" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none pr-1 cursor-pointer"
      >
        <option value="">{placeholder || `All ${label}`}</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Custom Pie Label (renders percentage inside slice) ───────────────────────
const RADIAN = Math.PI / 180;
function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null; // hide tiny slices
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function ManagementDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePieIndex, setActivePieIndex] = useState(null);

  // Filters
  const [filters, setFilters] = useState({ org: '', category: '', status: '', from: '', to: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.org)      params.org      = filters.org;
      if (filters.category) params.category = filters.category;
      if (filters.status)   params.status   = filters.status;
      if (filters.from)     params.from     = filters.from;
      if (filters.to)       params.to       = filters.to;
      const result = await api.getManagementDashboard(params);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetFilters = () => setFilters({ org: '', category: '', status: '', from: '', to: '' });
  const hasFilter = Object.values(filters).some(Boolean);

  // ─── KPI definitions ────────────────────────────────────────────────────────
  const kpis = data ? [
    { icon: Lightbulb,     label: 'Total Ideas Submitted',   value: data.kpis.totalIdeas,           colour: 'bg-blue-500'   },
    { icon: ClipboardList, label: 'Ideas Under Review',      value: data.kpis.underReview,           colour: 'bg-amber-500'  },
    { icon: CheckCircle,   label: 'Ideas Approved',          value: data.kpis.approved,              colour: 'bg-green-500'  },
    { icon: XCircle,       label: 'Ideas Declined',          value: data.kpis.declined,              colour: 'bg-red-500'    },
    {
      icon: Users, label: 'Employees Participated (Submitted 1+ Ideas)', value: data.kpis.employeesParticipated, colour: 'bg-purple-500',
      info: 'Count of distinct employees who have submitted at least one idea (non-draft) within the selected filters.'
    },
    {
      icon: TrendingUp, label: 'Employee Participation Rate', value: `${data.kpis.participationRate}%`, colour: 'bg-teal-500',
      info: 'Formula: (Employees who submitted ≥1 idea ÷ Total employees in scope) × 100. Calculated against all Employee-role users.'
    },
  ] : [];

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Management Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Snapshot of innovation across the organization</p>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <FilterSelect
          label="Department"
          placeholder="Department: All"
          value={filters.org}
          onChange={v => setFilters(f => ({ ...f, org: v }))}
          options={data?.filters.organizations ?? []}
        />
        <FilterSelect
          label="Category"
          placeholder="Category: All"
          value={filters.category}
          onChange={v => setFilters(f => ({ ...f, category: v }))}
          options={data?.filters.categories ?? []}
        />
        <FilterSelect
          label="Status"
          placeholder="Status: All"
          value={filters.status}
          onChange={v => setFilters(f => ({ ...f, status: v }))}
          options={data?.filters.statuses ?? []}
        />

        {/* Date Range */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:border-blue-400 transition-colors">
          <Calendar size={13} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="text-sm text-gray-700 bg-transparent focus:outline-none w-32"
          />
          <span className="text-gray-300 text-xs">→</span>
          <input
            type="date"
            value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="text-sm text-gray-700 bg-transparent focus:outline-none w-32"
          />
        </div>

        <button
          onClick={resetFilters}
          className={`ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${hasFilter ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <RefreshCw size={13} />
          Reset
        </button>
      </div>

      {/* ── Loading / Error ───────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={36} />
        </div>
      )}
      {!loading && error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* ── KPI Cards ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((k, i) => (
              <KpiCard key={i} icon={k.icon} label={k.label} value={k.value} colour={k.colour} info={k.info} />
            ))}
          </div>

          {/* ── Charts Row ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

            {/* Pie Chart — Ideas by Category */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-5">Ideas by Category</h2>

              {data.byCategory.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-12">No idea data for selected filters.</p>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Donut chart */}
                  <div className="relative w-52 h-52 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.byCategory}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={95}
                          dataKey="count"
                          stroke="none"
                          labelLine={false}
                          label={CustomPieLabel}
                          onMouseEnter={(_, idx) => setActivePieIndex(idx)}
                          onMouseLeave={() => setActivePieIndex(null)}
                        >
                          {data.byCategory.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={PIE_COLOURS[idx % PIE_COLOURS.length]}
                              opacity={activePieIndex === null || activePieIndex === idx ? 1 : 0.45}
                              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, _, props) => [`${value} (${props.payload.percentage}%)`, props.payload.name]}
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-gray-900">{data.kpis.totalIdeas}</span>
                      <span className="text-xs text-gray-400 font-medium">Total Ideas</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <ul className="space-y-2 flex-1 min-w-0">
                    {data.byCategory.map((cat, idx) => (
                      <li
                        key={cat.name}
                        className="flex items-center gap-2 cursor-pointer"
                        onMouseEnter={() => setActivePieIndex(idx)}
                        onMouseLeave={() => setActivePieIndex(null)}
                      >
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: PIE_COLOURS[idx % PIE_COLOURS.length] }}
                        />
                        <span className="text-xs text-gray-600 truncate flex-1">{cat.name}</span>
                        <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                          {cat.count} ({cat.percentage}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Department Performance Table */}
            <div className="xl:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-auto">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Department Performance</h2>
              <table className="w-full text-sm border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      { label: 'Department' },
                      { label: 'HOD Name', info: 'Head of Department — the Org Admin assigned to manage this department.' },
                      { label: 'Ideas Submitted' },
                      { label: 'Under Review', info: 'Ideas currently in "Pending Review" or "Under Review" status.' },
                      { label: 'Approved' },
                      { label: 'Declined' },
                      { label: 'Participation Rate', info: '(Employees with ≥1 idea submitted ÷ Total employees in dept) × 100' },
                    ].map(col => (
                      <th key={col.label} className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {col.label}{col.info && <InfoTip text={col.info} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.departmentPerformance.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No department data for selected filters.</td></tr>
                  )}
                  {data.departmentPerformance.map((row, i) => (
                    <tr key={row.dept} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="py-2.5 px-2 font-medium text-gray-800">{row.dept}</td>
                      <td className="py-2.5 px-2 text-gray-600">{row.hod}</td>
                      <td className="py-2.5 px-2 text-gray-700 font-semibold">{row.submitted}</td>
                      <td className="py-2.5 px-2 text-amber-600 font-medium">{row.underReview}</td>
                      <td className="py-2.5 px-2 text-green-600 font-medium">{row.approved}</td>
                      <td className="py-2.5 px-2 text-red-500 font-medium">{row.declined}</td>
                      <td className="py-2.5 px-2">
                        <span className={`font-semibold ${row.participationRate >= 60 ? 'text-green-600' : row.participationRate >= 35 ? 'text-amber-600' : 'text-red-500'}`}>
                          {row.participationRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── HOD Engagement Table ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-auto">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Employees Under Each HOD — Login & Engagement Tracking
            </h2>
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    { label: 'HOD Name' },
                    { label: 'Department' },
                    { label: 'Total Employees' },
                    {
                      label: 'Never Logged In',
                      info: 'Employees who have never completed the onboarding walkthrough and have submitted no ideas. Treated as never meaningfully active on Catalyst.'
                    },
                    {
                      label: 'Logged In, No Idea',
                      info: 'Employees who completed the onboarding walkthrough (earned 5 XP) but have not submitted any ideas yet.'
                    },
                    {
                      label: 'Not Logged In (10+ Days)',
                      info: 'Employees whose most recent login to Catalyst was more than 10 days ago, regardless of their idea submission history.'
                    },
                  ].map(col => (
                    <th key={col.label} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {col.label}{col.info && <InfoTip text={col.info} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.hodEngagement.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No HOD data available.</td></tr>
                )}
                {data.hodEngagement.map((row, i) => (
                  <tr key={row.dept} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="py-2.5 px-3 font-medium text-gray-800">{row.hod}</td>
                    <td className="py-2.5 px-3 text-gray-600">{row.dept}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-700">{row.totalEmployees}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-semibold ${row.neverLoggedIn > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {row.neverLoggedIn}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-semibold ${row.loggedInNoIdea > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {row.loggedInNoIdea}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-semibold ${row.notLoggedIn10Days > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                        {row.notLoggedIn10Days}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
