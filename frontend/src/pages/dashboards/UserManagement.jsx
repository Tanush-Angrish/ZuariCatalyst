import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { UserPlus, Upload, Check, Trash2, Users, Phone, Hash } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';


const ROLES = ['Employee', 'Org Admin', 'Central Team', 'Administrator'];
const displayRole = (r) => r === 'Superadmin' ? 'Central Team' : (r || '');

/**
 * Normalize Excel role column values.
 * Handles: OrgAdmin, Employee, Org Admin, org_admin, employee etc.
 */
function normalizeExcelRole(raw) {
  if (!raw) return 'Employee';
  const r = String(raw).trim().toLowerCase().replace(/[\s_-]/g, '');
  if (r === 'orgadmin') return 'Org Admin';
  if (r === 'centralteam' || r === 'superadmin' || r === 'admin') return 'Central Team';
  if (r === 'administrator') return 'Administrator';
  return 'Employee';
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [tab, setTab] = useState('table'); // table | add | bulk
  const [editingRole, setEditingRole] = useState({}); // userId -> newRole
  const [form, setForm] = useState({
    name: '', title: '', email: '', role: 'Employee',
    organization: '', mobileNumber: '', employeeId: ''
  });
  const [bulkUsers, setBulkUsers] = useState([]);
  const [bulkResult, setBulkResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) { console.error(e); }
  };

  const fetchOrganizations = async () => {
    try {
      const data = await api.getOrganizations();
      setOrganizations(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchUsers(); fetchOrganizations(); }, []);

  // ---------- Add User ----------
  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createUser({
        ...form,
        role: form.role === 'Central Team' ? 'Superadmin' : form.role
      });
      alert('User created successfully!');
      setForm({ name: '', title: '', email: '', role: 'Employee', organization: '', mobileNumber: '', employeeId: '' });
      fetchUsers();
      setTab('table');
    } catch (e) {
      alert('Error creating user: ' + e.message);
    }
    setLoading(false);
  };

  // ---------- Role Change ----------
  const handleRoleChange = async (userId, newRole) => {
    try {
      const dbRole = newRole === 'Central Team' ? 'Superadmin' : newRole;
      await api.updateUserRole(userId, dbRole);
      setEditingRole(prev => { const c = { ...prev }; delete c[userId]; return c; });
      fetchUsers();
    } catch (e) {
      alert('Error updating role: ' + e.message);
    }
  };

  // ---------- Delete User ----------
  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(userId);
      fetchUsers();
    } catch (e) { alert('Error deleting user: ' + e.message); }
  };

  // ---------- Bulk Upload ----------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

      // Normalize column names — handle the confirmed Excel format:
      // Name | Title | Email | Organization | Role (OrgAdmin/Employee) | Mobile Number | Emp Id
      const normalized = data.map(row => ({
        name: String(row.Name || row.name || '').trim(),
        title: String(row.Title || row.title || '').trim(),
        email: String(row.Email || row.email || '').trim(),
        organization: String(row.Organization || row.organization || '').trim(),
        role: normalizeExcelRole(row.Role || row.role || ''),
        // Mobile: may come as number from Excel — convert to string
        mobileNumber: row['Mobile Number'] !== undefined && row['Mobile Number'] !== ''
          ? String(row['Mobile Number']).trim()
          : (row.mobileNumber ? String(row.mobileNumber).trim() : ''),
        // Emp Id: may come as number from Excel — convert to string
        employeeId: row['Emp Id'] !== undefined && row['Emp Id'] !== ''
          ? String(row['Emp Id']).trim()
          : (row.employeeId ? String(row.employeeId).trim() : ''),
      })).filter(r => r.name && r.email); // Drop blank rows

      setBulkUsers(normalized);
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkUsers.length === 0) return;
    setLoading(true);
    setBulkResult(null);
    try {
      const payload = bulkUsers.map(u => ({
        ...u,
        role: u.role === 'Central Team' ? 'Superadmin' : u.role
      }));
      const data = await api.bulkCreateUsers(payload);
      setBulkResult(data);
      fetchUsers();
    } catch (e) { alert('Error uploading users: ' + e.message); }
    setLoading(false);
  };

  const inputClass = 'w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue transition-colors';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">User Management</h1>
        <p className="text-gray-500">Create, view, and manage all system users.</p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2">
        {[
          { id: 'table', label: 'All Users', icon: Users },
          { id: 'add', label: 'Add User', icon: UserPlus },
          { id: 'bulk', label: 'Bulk Upload', icon: Upload },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-brand-blue text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* =================== ALL USERS TABLE =================== */}
      {tab === 'table' && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="text-left text-sm" style={{ minWidth: '1000px', width: '100%' }}>
              <thead className="bg-[#f8f9fc] border-b border-gray-200 text-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '200px' }}>Name</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '100px' }}>Emp ID</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '140px' }}>Title</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '220px' }}>Email</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '130px' }}>Organization</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '120px' }}>Mobile</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '230px' }}>Role</th>
                  <th className="px-5 py-3 font-semibold text-right" style={{ minWidth: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-400">No users found.</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-3">
                        {u.profilePhotoUrl ? (
                          <img src={api.getFileUrl(u.profilePhotoUrl)} alt={u.name}
                            className="h-8 w-8 rounded-full object-cover border border-gray-200 shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="font-medium text-brand-black text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-gray-600 text-sm font-mono">{u.employeeId || '—'}</td>
                    <td className="px-5 py-4 align-top text-gray-600 text-sm">{u.title || '—'}</td>
                    <td className="px-5 py-4 align-top text-gray-600 text-sm">{u.email}</td>
                    <td className="px-5 py-4 align-top text-gray-600 text-sm">{u.organization || '—'}</td>
                    <td className="px-5 py-4 align-top text-gray-600 text-sm">{u.mobileNumber || '—'}</td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-md border border-gray-300 p-1.5 text-xs bg-white cursor-pointer focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                          style={{ minWidth: '140px' }}
                          value={editingRole[u.id] || displayRole(u.role)}
                          onChange={(e) => setEditingRole({ ...editingRole, [u.id]: e.target.value })}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {editingRole[u.id] && editingRole[u.id] !== displayRole(u.role) && (
                          <button onClick={() => handleRoleChange(u.id, editingRole[u.id])}
                            className="h-7 w-7 rounded-md bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 transition-colors" title="Confirm role change">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-right">
                      <button onClick={() => handleDelete(u.id)}
                        className="h-7 w-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors ml-auto" title="Delete user">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================== ADD USER FORM =================== */}
      {tab === 'add' && (
        <Card className="border-t-4 border-t-brand-blue shadow-sm max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-brand-blue" /> Add New User</CardTitle>
            <CardDescription>Fill in the details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Full name" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Title / Designation</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="e.g. Head Distillery" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="user@adventz.com" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1"><Hash size={13} /> Employee ID</label>
                  <input value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className={inputClass} placeholder="e.g. 1818" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1"><Phone size={13} /> Mobile Number</label>
                  <input type="tel" value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} className={inputClass} placeholder="e.g. 9935985433" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputClass}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {(form.role === 'Org Admin' || form.role === 'Central Team' || form.role === 'Administrator') && (
                  <p className="text-xs text-blue-600 mt-1.5 font-medium">
                    ✓ {form.role} will automatically also have Employee access (idea submission)
                  </p>
                )}
              </div>
              {form.role !== 'Central Team' && form.role !== 'Administrator' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Organization / Unit</label>
                  <select
                    value={form.organization}
                    onChange={e => setForm({ ...form, organization: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">— Select Organization / Unit —</option>
                    {organizations.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                  {organizations.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No organizations found. Add users via Bulk Upload first to populate this list.</p>
                  )}
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-center">
                <Button type="submit" disabled={loading} size="lg" className="w-full md:w-64">
                  <UserPlus className="mr-2 h-4 w-4" /> {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* =================== BULK UPLOAD =================== */}
      {tab === 'bulk' && (
        <div className="space-y-6 max-w-5xl">
          <Card className="border-t-4 border-t-[#99CC33] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-[#99CC33]" /> Bulk Upload Users</CardTitle>
              <CardDescription>
                Upload an Excel file (.xlsx) with columns: <strong>Name</strong>, Title, <strong>Email</strong>, Organization, <strong>Role</strong> (OrgAdmin / Employee), Mobile Number, Emp Id
                <br />
                <span className="text-amber-600">⚠ Central Team and Administrator users cannot be added via bulk upload — add them from the "Add User" tab.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Column Guide */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Expected Column Headers
                </div>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead className="bg-white border-b border-gray-100">
                      <tr>
                        {['Name *', 'Title', 'Email *', 'Organization', 'Role *', 'Mobile Number', 'Emp Id'].map(h => (
                          <th key={h} className="px-4 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-gray-500">
                        <td className="px-4 py-2">AJAY KUMAR TIWARY</td>
                        <td className="px-4 py-2">HEAD DISTILLERY</td>
                        <td className="px-4 py-2">ajay@adventz.com</td>
                        <td className="px-4 py-2">Distillery</td>
                        <td className="px-4 py-2 font-mono text-brand-blue">OrgAdmin</td>
                        <td className="px-4 py-2 font-mono">9935985433</td>
                        <td className="px-4 py-2 font-mono">1818</td>
                      </tr>
                      <tr className="text-gray-500 bg-gray-50/50">
                        <td className="px-4 py-2">AJAY KUMAR TRIPATHI</td>
                        <td className="px-4 py-2">DY HEAD FINANCE</td>
                        <td className="px-4 py-2">tripathi@adventz.com</td>
                        <td className="px-4 py-2">Finance Accounts</td>
                        <td className="px-4 py-2 font-mono text-green-600">Employee</td>
                        <td className="px-4 py-2 font-mono">9559990437</td>
                        <td className="px-4 py-2 font-mono">2664</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-blue/50 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
                <Upload className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Click to select an Excel file, or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">Supports .xlsx and .xls files</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              </div>

              {/* Preview */}
              {bulkUsers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Preview ({bulkUsers.length} users)</h3>
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto max-h-[300px]">
                      <table className="text-left text-xs" style={{ minWidth: '800px', width: '100%' }}>
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2 font-semibold">#</th>
                            <th className="px-4 py-2 font-semibold">Name</th>
                            <th className="px-4 py-2 font-semibold">Emp ID</th>
                            <th className="px-4 py-2 font-semibold">Email</th>
                            <th className="px-4 py-2 font-semibold">Organization</th>
                            <th className="px-4 py-2 font-semibold">Role</th>
                            <th className="px-4 py-2 font-semibold">Mobile</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bulkUsers.map((u, i) => (
                            <tr key={i} className={`hover:bg-gray-50/50 ${(u.role === 'Central Team' || u.role === 'Administrator') ? 'bg-red-50' : ''}`}>
                              <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                              <td className="px-4 py-2 text-brand-black font-medium">{u.name}</td>
                              <td className="px-4 py-2 text-gray-600 font-mono">{u.employeeId || '—'}</td>
                              <td className="px-4 py-2 text-gray-600">{u.email}</td>
                              <td className="px-4 py-2 text-gray-600">{u.organization || '—'}</td>
                              <td className="px-4 py-2">
                                <Badge variant={u.role === 'Org Admin' ? 'secondary' : 'default'}>
                                  {u.role}
                                </Badge>
                                {u.role === 'Org Admin' && <span className="ml-1 text-[10px] text-blue-500">+Employee</span>}
                              </td>
                              <td className="px-4 py-2 text-gray-600 font-mono">{u.mobileNumber || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={handleBulkSubmit} disabled={loading} size="lg" className="w-full md:w-64 bg-[#99CC33] hover:bg-[#88bb22]">
                      <Upload className="mr-2 h-4 w-4" /> {loading ? 'Uploading...' : `Upload ${bulkUsers.length} Users`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Results */}
              {bulkResult && (
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm font-medium text-green-700">✓ {bulkResult.successes} users created successfully</p>
                  {bulkResult.errors?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-600">✗ {bulkResult.errors.length} errors:</p>
                      {bulkResult.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-500">Row {e.row}: {e.error} {e.email ? `(${e.email})` : ''}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
