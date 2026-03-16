import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Plus, Pencil, Trash2, Save, X, GripVertical,
  ChevronDown, ChevronUp, AlertCircle, Settings2
} from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'file', label: 'File Upload' },
  { value: 'voice', label: 'Voice Note' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
];

const CATEGORIES = ['GENERAL', 'MANUFACTURING', 'EPC', 'EXCEL AUTOMATION'];

export default function TemplateConfig() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // template object being edited
  const [isNew, setIsNew] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = () => {
    setEditing({
      category: 'GENERAL',
      name: '',
      description: '',
      fields: [
        { id: 'title', label: 'Title', type: 'text', required: true },
        { id: 'department', label: 'Department', type: 'select', options: ['HR', 'IT', 'Finance', 'Operations', 'Engineering', 'Manufacturing', 'Procurement', 'Sales'], required: true },
        { id: 'problemDescription', label: 'Problem Description', type: 'textarea', required: true },
        { id: 'proposedSolution', label: 'Proposed Solution', type: 'textarea', required: true },
        { id: 'expectedImpact', label: 'Estimated Benefit / Impact', type: 'textarea', required: true },
        { id: 'attachment', label: 'Attachment', type: 'file', required: false },
        { id: 'referenceLink', label: 'Reference Link', type: 'url', required: false },
      ]
    });
    setIsNew(true);
  };

  const handleEdit = (template) => {
    setEditing(JSON.parse(JSON.stringify(template))); // deep clone
    setIsNew(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template? This cannot be undone.')) return;
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      await fetchTemplates();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!editing.name.trim()) return alert('Template name is required');
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/templates' : `/api/templates/${editing.id}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: editing.category,
          name: editing.name,
          description: editing.description,
          fields: editing.fields
        })
      });
      if (res.ok) {
        setEditing(null);
        setIsNew(false);
        await fetchTemplates();
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Field Helpers ─────────────────────────────────────────────────────
  const updateField = (index, key, value) => {
    setEditing(prev => {
      const fields = [...prev.fields];
      fields[index] = { ...fields[index], [key]: value };
      return { ...prev, fields };
    });
  };

  const addField = () => {
    const id = 'field_' + Date.now();
    setEditing(prev => ({
      ...prev,
      fields: [...prev.fields, { id, label: '', type: 'text', required: false }]
    }));
  };

  const removeField = (index) => {
    setEditing(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const moveField = (index, direction) => {
    setEditing(prev => {
      const fields = [...prev.fields];
      const target = index + direction;
      if (target < 0 || target >= fields.length) return prev;
      [fields[index], fields[target]] = [fields[target], fields[index]];
      return { ...prev, fields };
    });
  };

  const updateOption = (fieldIdx, optIdx, value) => {
    setEditing(prev => {
      const fields = [...prev.fields];
      const opts = [...(fields[fieldIdx].options || [])];
      opts[optIdx] = value;
      fields[fieldIdx] = { ...fields[fieldIdx], options: opts };
      return { ...prev, fields };
    });
  };

  const addOption = (fieldIdx) => {
    setEditing(prev => {
      const fields = [...prev.fields];
      const opts = [...(fields[fieldIdx].options || []), ''];
      fields[fieldIdx] = { ...fields[fieldIdx], options: opts };
      return { ...prev, fields };
    });
  };

  const removeOption = (fieldIdx, optIdx) => {
    setEditing(prev => {
      const fields = [...prev.fields];
      const opts = (fields[fieldIdx].options || []).filter((_, i) => i !== optIdx);
      fields[fieldIdx] = { ...fields[fieldIdx], options: opts };
      return { ...prev, fields };
    });
  };

  const inputClass = 'w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue transition-colors';

  // ─── Editor Modal ──────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-black">
            {isNew ? 'Create Template' : 'Edit Template'}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }} className="gap-1.5">
              <X size={16} />Cancel
            </Button>
            <Button onClick={handleSave} className="gap-1.5">
              <Save size={16} />Save Template
            </Button>
          </div>
        </div>

        {/* Template Metadata */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                  className={inputClass} placeholder="e.g. Process Improvement Idea" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className={inputClass}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
                rows="2" className={inputClass} placeholder="Brief description of this template..." />
            </div>
          </CardContent>
        </Card>

        {/* Fields Editor */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Fields ({editing.fields.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={addField} className="gap-1.5">
              <Plus size={14} />Add Field
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {editing.fields.map((field, i) => (
              <div key={field.id || i} className="border rounded-lg p-3 bg-gray-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveField(i, -1)} className="text-gray-400 hover:text-gray-600" disabled={i === 0}>
                      <ChevronUp size={14} />
                    </button>
                    <button type="button" onClick={() => moveField(i, 1)} className="text-gray-400 hover:text-gray-600" disabled={i === editing.fields.length - 1}>
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400 font-mono w-6 text-center">{i + 1}</span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input value={field.label} onChange={e => updateField(i, 'label', e.target.value)}
                      className={inputClass} placeholder="Field label" />
                    <input value={field.id} onChange={e => updateField(i, 'id', e.target.value)}
                      className={inputClass + ' font-mono text-xs'} placeholder="field_id" />
                    <select value={field.type} onChange={e => updateField(i, 'type', e.target.value)} className={inputClass}>
                      {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={field.required || false} onChange={e => updateField(i, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-brand-blue" />
                        Required
                      </label>
                      <button type="button" onClick={() => removeField(i)} className="text-red-400 hover:text-red-600 ml-auto">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dropdown options */}
                {field.type === 'select' && (
                  <div className="ml-10 space-y-1.5">
                    <p className="text-xs font-medium text-gray-500">Dropdown Options</p>
                    {(field.options || []).map((opt, oi) => (
                      <div key={oi} className="flex gap-1.5 items-center">
                        <input value={opt} onChange={e => updateOption(i, oi, e.target.value)}
                          className={inputClass + ' max-w-xs'} placeholder="Option value" />
                        <button type="button" onClick={() => removeOption(i, oi)} className="text-red-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => addOption(i)} className="text-xs h-7 gap-1">
                      <Plus size={12} />Add Option
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Template List ─────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-black flex items-center gap-2">
            <Settings2 className="h-7 w-7 text-gray-400" />Template Configuration
          </h1>
          <p className="text-gray-500 mt-1">Create, edit, and manage idea submission templates.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 shrink-0">
          <Plus size={18} />New Template
        </Button>
      </div>

      {loading ? (
        <div className="text-center p-12 text-gray-400">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-xl text-gray-500">
          <AlertCircle className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="font-medium">No templates found</p>
          <p className="text-sm mt-1">Click "New Template" to create your first template.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {CATEGORIES.map(cat => {
            const catTemplates = templates.filter(t => t.category === cat);
            if (catTemplates.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">{cat}</h2>
                <div className="grid gap-3">
                  {catTemplates.map(t => (
                    <Card key={t.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-brand-black">{t.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{t.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{t.fields?.length || 0} fields</Badge>
                            <Badge className="text-xs">{t.category}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(t)} className="gap-1.5">
                            <Pencil size={13} />Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5">
                            <Trash2 size={13} />Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
