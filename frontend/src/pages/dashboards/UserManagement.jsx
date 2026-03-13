import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { UserPlus, Upload, Check, Trash2, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

const ROLES = ['Employee', 'Org Admin', 'Central Team'];
const roleMap = { 'Superadmin': 'Central Team', 'Central Team': 'Central Team', 'Org Admin': 'Org Admin', 'Employee': 'Employee' };
const displayRole = (r) => roleMap[r] || r;
const dbRole = (r) => r === 'Central Team' ? 'Superadmin' : r;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [tab, setTab] = useState('table'); // table | add | bulk
  const [editingRole, setEditingRole] = useState({}); // userId -> newRole
  const [form, setForm] = useState({ name: '', title: '', email: '', role: 'Employee', organization: '' });
  const [bulkUsers, setBulkUsers] = useState([]);
  const [bulkResult, setBulkResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) { console.error(e); }
  };

  const fetchFormFields = async () => {
    try {
      const res = await fetch('/api/form-fields/user');
      const data = await res.json();
      setFormFields(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchUsers(); fetchFormFields(); }, []);

  // ---------- Add User ----------
  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, role: dbRole(form.role) };
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert('User created successfully!');
        setForm({ name: '', title: '', email: '', role: 'Employee', organization: '' });
        fetchUsers();
        setTab('table');
      } else {
        alert(data.error || 'Error creating user');
      }
    } catch (e) { alert('Error creating user'); }
    setLoading(false);
  };

  // ---------- Role Change ----------
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: dbRole(newRole) })
      });
      if (res.ok) {
        setEditingRole(prev => { const c = { ...prev }; delete c[userId]; return c; });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Error updating role');
      }
    } catch (e) { alert('Error updating role'); }
  };

  // ---------- Delete User ----------
  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    } catch (e) { alert('Error deleting user'); }
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
      const data = XLSX.utils.sheet_to_json(ws);
      // Normalize column names
      const normalized = data.map(row => ({
        name: row.Name || row.name || '',
        title: row.Title || row.title || '',
        email: row.Email || row.email || '',
        role: row.Role || row.role || 'Employee',
        organization: row.Organization || row.organization || ''
      }));
      setBulkUsers(normalized);
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkUsers.length === 0) return;
    setLoading(true);
    setBulkResult(null);
    try {
      const payload = bulkUsers.map(u => ({ ...u, role: dbRole(u.role) }));
      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: payload })
      });
      const data = await res.json();
      setBulkResult(data);
      fetchUsers();
    } catch (e) { alert('Error uploading users'); }
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
            <table className="text-left text-sm" style={{ minWidth: '800px', width: '100%' }}>
              <thead className="bg-[#f8f9fc] border-b border-gray-200 text-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '180px' }}>Name</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '140px' }}>Title</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '220px' }}>Email</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '130px' }}>Organization</th>
                  <th className="px-5 py-3 font-semibold" style={{ minWidth: '230px' }}>Role</th>
                  <th className="px-5 py-3 font-semibold text-right" style={{ minWidth: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No users found.</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-xs shrink-0">{u.name.charAt(0)}</div>
                        <span className="font-medium text-brand-black text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-gray-600 text-sm">{u.title || '—'}</td>
                    <td className="px-5 py-4 align-top text-gray-600 text-sm">{u.email}</td>
                    <td className="px-5 py-4 align-top text-gray-600 text-sm">{u.organization || '—'}</td>
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
            <CardDescription>Fill in the details below. Default password will be "password".</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Full name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="e.g. Engineer, Manager" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="user@company.com" />
              </div>
              {form.role !== 'Central Team' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Organization</label>
                  <input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} className={inputClass} placeholder="e.g. Simon, Sugar" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputClass}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
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
        <div className="space-y-6 max-w-4xl">
          <Card className="border-t-4 border-t-[#99CC33] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-[#99CC33]" /> Bulk Upload Users</CardTitle>
              <CardDescription>Upload an Excel file (.xlsx) with columns: Name, Title, Email, Role, Organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <table className="text-left text-xs" style={{ minWidth: '600px', width: '100%' }}>
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2 font-semibold">#</th>
                            <th className="px-4 py-2 font-semibold">Name</th>
                            <th className="px-4 py-2 font-semibold">Title</th>
                            <th className="px-4 py-2 font-semibold">Email</th>
                            <th className="px-4 py-2 font-semibold">Role</th>
                            <th className="px-4 py-2 font-semibold">Organization</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bulkUsers.map((u, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                              <td className="px-4 py-2 text-brand-black font-medium">{u.name}</td>
                              <td className="px-4 py-2 text-gray-600">{u.title}</td>
                              <td className="px-4 py-2 text-gray-600">{u.email}</td>
                              <td className="px-4 py-2"><Badge variant="secondary">{u.role}</Badge></td>
                              <td className="px-4 py-2 text-gray-600">{u.organization}</td>
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
