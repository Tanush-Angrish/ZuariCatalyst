import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import {
  Building2, UserCheck, UserPlus, X, Search, Loader2,
  ShieldCheck, Hash, Mail, ChevronDown, ChevronUp, UserMinus, RefreshCw,
} from 'lucide-react';

// ─── Avatar helper ────────────────────────────────────────────────────────────
function Avatar({ user, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs';
  if (user.profilePhotoUrl) {
    return (
      <img
        src={api.getFileUrl(user.profilePhotoUrl)}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm shrink-0`}
      />
    );
  }
  const initials = user.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const colors = [
    'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700', 'bg-teal-100 text-teal-700',
  ];
  const color = colors[(user.id || 0) % colors.length];
  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold shrink-0 border-2 border-white shadow-sm`}>
      {initials}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function OrgAdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <ShieldCheck size={10} /> Org Admin
    </span>
  );
}

function EmployeeBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
      Employee
    </span>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ org, onClose, onAssigned }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const { notify } = useNotifications();

  // Eligible: all members of the org who are not already Org Admin
  const eligible = (org.members || []).filter(m => !m.isOrgAdmin);
  const filtered = eligible.filter(m =>
    !search.trim() ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.employeeId || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.assignOrgAdmin(selected.id);
      notify({ type: 'success', title: 'Org Admin Assigned', message: `${selected.name} is now Org Admin for ${org.name}.`, event: '' });
      onAssigned();
      onClose();
    } catch (e) {
      notify({ type: 'error', title: 'Assignment Failed', message: e.message || 'Could not assign Org Admin.', event: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-modal-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-brand-black">Assign Org Admin</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Select an employee from <span className="font-semibold text-brand-blue">{org.name}</span> to assign as Org Admin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-4 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            The selected user will be granted the <strong>Org Admin</strong> role while keeping their <strong>Employee</strong> access — they can still submit ideas.
          </p>
        </div>

        {/* Search */}
        <div className="px-6 mt-4">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or employee ID…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue/50 transition-all bg-gray-50"
            />
          </div>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-6 mt-3 pb-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <UserPlus size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">
                {eligible.length === 0
                  ? 'All members of this organization are already Org Admins.'
                  : 'No employees match your search.'}
              </p>
            </div>
          ) : filtered.map(member => {
            const isSelected = selected?.id === member.id;
            return (
              <button
                key={member.id}
                onClick={() => setSelected(isSelected ? null : member)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-brand-blue bg-blue-50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Avatar user={member} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-black truncate">{member.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Mail size={10} />{member.email}</span>
                    {member.employeeId && (
                      <span className="flex items-center gap-1"><Hash size={10} />{member.employeeId}</span>
                    )}
                  </div>
                  {member.title && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{member.title}</p>}
                </div>
                <div className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  isSelected ? 'border-brand-blue bg-brand-blue' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-100 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-brand-blue rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
            {saving ? 'Assigning…' : selected ? `Assign ${selected.name.split(' ')[0]}` : 'Assign Org Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Org Card ─────────────────────────────────────────────────────────────────
function OrgCard({ org, onAssign, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const hasAdmins = org.orgAdmins.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-4 p-5">
        {/* Org icon */}
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-blue/10 to-blue-50 border border-brand-blue/10 flex items-center justify-center shrink-0">
          <Building2 size={20} className="text-brand-blue" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-brand-black text-base truncate">{org.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {org.members.length} {org.members.length === 1 ? 'member' : 'members'}
            {hasAdmins && ` · ${org.orgAdmins.length} org ${org.orgAdmins.length === 1 ? 'admin' : 'admins'}`}
          </p>
        </div>

        {/* Status pill */}
        {hasAdmins ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shrink-0">
            <UserCheck size={12} /> Assigned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            Unassigned
          </span>
        )}
      </div>

      {/* Admins section */}
      {hasAdmins ? (
        <div className="border-t border-gray-50 px-5 py-4 space-y-3">
          {org.orgAdmins.map(admin => (
            <div key={admin.id} className="flex items-center gap-3">
              <Avatar user={admin} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-brand-black truncate">{admin.name}</span>
                  <OrgAdminBadge />
                  <EmployeeBadge />
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1"><Mail size={10} />{admin.email}</span>
                  {admin.employeeId && (
                    <span className="flex items-center gap-1"><Hash size={10} />{admin.employeeId}</span>
                  )}
                </div>
                {admin.title && <p className="text-[11px] text-gray-400 mt-0.5">{admin.title}</p>}
              </div>
              <button
                onClick={() => onRemove(admin, org)}
                title="Remove Org Admin role"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              >
                <UserMinus size={15} />
              </button>
            </div>
          ))}

          {/* Assign another */}
          <button
            onClick={() => onAssign(org)}
            className="mt-1 w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-brand-blue border border-brand-blue/20 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <UserPlus size={12} /> Add Another Org Admin
          </button>
        </div>
      ) : (
        /* Empty state */
        <div className="border-t border-dashed border-gray-100 px-5 py-5 flex flex-col items-center text-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <UserPlus size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">No Org Admin Assigned</p>
            <p className="text-xs text-gray-400 mt-0.5">Ideas from this org will need central review.</p>
          </div>
          <button
            onClick={() => onAssign(org)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-blue rounded-xl hover:bg-blue-700 transition-all shadow-sm"
          >
            <UserPlus size={14} /> Assign Org Admin
          </button>
        </div>
      )}

      {/* Collapsible members list */}
      {org.members.length > 0 && (
        <div className="border-t border-gray-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <span>View all members ({org.members.length})</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {expanded && (
            <div className="px-5 pb-4 space-y-2 border-t border-gray-50">
              {org.members.map(m => (
                <div key={m.id} className="flex items-center gap-2.5 py-1.5">
                  <Avatar user={m} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-brand-black truncate">{m.name}</span>
                      {m.isOrgAdmin && <OrgAdminBadge />}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{m.email}</p>
                  </div>
                  {m.employeeId && (
                    <span className="text-[11px] font-mono text-gray-400 shrink-0">#{m.employeeId}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Remove Confirm Modal ─────────────────────────────────────────────────────
function RemoveConfirmModal({ admin, org, onClose, onConfirmed }) {
  const [saving, setSaving] = useState(false);
  const { notify } = useNotifications();

  const handleRemove = async () => {
    setSaving(true);
    try {
      await api.removeOrgAdmin(admin.id);
      notify({ type: 'info', title: 'Org Admin Removed', message: `${admin.name} is no longer Org Admin for ${org.name}.`, event: '' });
      onConfirmed();
      onClose();
    } catch (e) {
      notify({ type: 'error', title: 'Failed', message: e.message || 'Could not remove Org Admin role.', event: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-modal-in p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <UserMinus size={18} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-bold text-brand-black text-base">Remove Org Admin</h2>
            <p className="text-xs text-gray-500">This will revoke their admin role.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-6">
          Remove <span className="font-semibold">{admin.name}</span> as Org Admin for{' '}
          <span className="font-semibold">{org.name}</span>? They will revert to an Employee.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
            {saving ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OrgAdminManagement() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned'
  const [assignModal, setAssignModal] = useState(null); // org object
  const [removeModal, setRemoveModal] = useState(null); // { admin, org }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getOrgAdminOverview();
      setOrgs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load org admin overview:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtering
  const filtered = orgs.filter(org => {
    const matchesSearch = !search.trim() ||
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.orgAdmins.some(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
      );
    const matchesFilter =
      filter === 'all' ||
      (filter === 'assigned' && org.orgAdmins.length > 0) ||
      (filter === 'unassigned' && org.orgAdmins.length === 0);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: orgs.length,
    assigned: orgs.filter(o => o.orgAdmins.length > 0).length,
    unassigned: orgs.filter(o => o.orgAdmins.length === 0).length,
    totalAdmins: orgs.reduce((sum, o) => sum + o.orgAdmins.length, 0),
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-black">Org Admin Management</h1>
          <p className="text-gray-500 mt-1">Assign and manage Org Admin roles across all organizations.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Orgs', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
          { label: 'With Org Admin', value: stats.assigned, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'No Admin Yet', value: stats.unassigned, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Total Admins', value: stats.totalAdmins, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} ${s.border} border rounded-xl px-4 py-3`}>
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} mt-0.5`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl shrink-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'unassigned', label: 'Unassigned' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.id
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by organization or admin name…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue/50 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={22} className="animate-spin text-brand-blue" />
          <span className="text-sm font-medium">Loading organizations…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <Building2 size={36} className="mx-auto text-gray-200 mb-3" />
          <h3 className="font-semibold text-gray-600 text-base">No organizations found</h3>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different search.' : 'Add employees with an organization to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(org => (
            <OrgCard
              key={org.name}
              org={org}
              onAssign={o => setAssignModal(o)}
              onRemove={(admin, o) => setRemoveModal({ admin, org: o })}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center pb-2">
          Showing {filtered.length} of {orgs.length} organization{orgs.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Modals */}
      {assignModal && (
        <AssignModal
          org={assignModal}
          onClose={() => setAssignModal(null)}
          onAssigned={fetchData}
        />
      )}
      {removeModal && (
        <RemoveConfirmModal
          admin={removeModal.admin}
          org={removeModal.org}
          onClose={() => setRemoveModal(null)}
          onConfirmed={fetchData}
        />
      )}
    </div>
  );
}
