import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Plus, Pencil, Trash2, Save, X, GripVertical,
  AlertCircle, Settings2, Globe, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../../services/api';

const FIELD_TYPES = [
  { value: 'text',     label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number',   label: 'Number' },
  { value: 'select',   label: 'Dropdown' },
  { value: 'file',     label: 'File Upload' },
  { value: 'voice',    label: 'Voice Note' },
  { value: 'date',     label: 'Date' },
  { value: 'url',      label: 'URL' },
];

const CATEGORIES = ['GENERAL', 'MANUFACTURING', 'EPC', 'EXCEL AUTOMATION'];

const inputClass =
  'w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue transition-colors';

// ─── Shared Field Row Component ─────────────────────────────────────────────
function FieldRow({
  field, index, total,
  isGlobal,
  canReorder,     // whether this row can be dragged (template editor)
  canEdit,        // whether label/type/options are editable
  canDelete,      // whether delete button is shown
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  // drag
  dragging,
  dragOver,
  onDragStart,
  onDragEnter,
  onDragEnd,
}) {
  const rowBg = isGlobal ? 'bg-blue-50/60 border-blue-200' : 'bg-gray-50/50';

  return (
    <div
      className={`border rounded-lg p-3 space-y-3 transition-all ${rowBg}
        ${dragging ? 'opacity-40 scale-[0.99]' : ''}
        ${dragOver ? 'ring-2 ring-brand-blue bg-blue-50' : ''}
      `}
      draggable={canReorder}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={e => e.preventDefault()}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle or up/down buttons */}
        {canReorder ? (
          <div
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-0.5 shrink-0"
            title="Drag to reorder"
          >
            <GripVertical size={18} />
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 shrink-0">
            <button type="button" onClick={onMoveUp} disabled={index === 0}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
              <ChevronUp size={14} />
            </button>
            <button type="button" onClick={onMoveDown} disabled={index === total - 1}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
              <ChevronDown size={14} />
            </button>
          </div>
        )}

        <span className="text-xs text-gray-400 font-mono w-5 text-center shrink-0">{index + 1}</span>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* Label */}
          <input
            value={field.label}
            onChange={e => onUpdate('label', e.target.value)}
            className={inputClass}
            placeholder="Field label"
            disabled={!canEdit}
          />
          {/* ID */}
          <input
            value={field.id}
            onChange={e => onUpdate('id', e.target.value)}
            className={inputClass + ' font-mono text-xs'}
            placeholder="field_id"
            disabled={!canEdit}
          />
          {/* Type */}
          <select
            value={field.type}
            onChange={e => onUpdate('type', e.target.value)}
            className={inputClass}
            disabled={!canEdit}
          >
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {/* Required + actions */}
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-1.5 text-sm cursor-pointer ${!canEdit ? 'text-gray-400' : 'text-gray-600'}`}>
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={e => onUpdate('required', e.target.checked)}
                className="rounded border-gray-300 text-brand-blue"
                disabled={!canEdit}
              />
              Required
            </label>
            {isGlobal ? (
              <Badge
                variant="outline"
                className="ml-auto font-semibold text-blue-700 border-blue-300 bg-blue-100 text-[10px] px-1.5 py-0.5 leading-tight flex items-center gap-0.5"
              >
                <Globe size={9} /> Global
              </Badge>
            ) : canDelete ? (
              <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 ml-auto">
                <Trash2 size={14} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Dropdown options */}
      {field.type === 'select' && (
        <div className="ml-10 space-y-1.5">
          <p className="text-xs font-medium text-gray-500">Dropdown Options</p>
          {(field.options || []).map((opt, oi) => (
            <div key={oi} className="flex gap-1.5 items-center">
              <input
                value={opt}
                onChange={e => {
                  const opts = [...(field.options || [])];
                  opts[oi] = e.target.value;
                  onUpdate('options', opts);
                }}
                className={inputClass + ' max-w-xs'}
                placeholder="Option value"
                disabled={!canEdit}
              />
              {canEdit && (
                <button type="button"
                  onClick={() => onUpdate('options', field.options.filter((_, i) => i !== oi))}
                  className="text-red-400 hover:text-red-600">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <Button size="sm" variant="outline"
              onClick={() => onUpdate('options', [...(field.options || []), ''])}
              className="text-xs h-7 gap-1">
              <Plus size={12} />Add Option
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Master Template Editor ──────────────────────────────────────────────────
// Only manages add/edit/remove of global fields. No per-template ordering here.
function MasterEditor({ masterTemplate, onCancel, onSaved }) {
  const [fields, setFields] = useState(() =>
    masterTemplate ? JSON.parse(JSON.stringify(masterTemplate.fields || [])) : []
  );
  const [saving, setSaving] = useState(false);

  const updateField = (i, key, value) =>
    setFields(prev => { const f = [...prev]; f[i] = { ...f[i], [key]: value }; return f; });

  const addField = () => {
    const id = 'global_' + Date.now();
    setFields(prev => [...prev, { id, label: '', type: 'text', required: false }]);
  };

  const removeField = (i) => {
    if (!confirm('Remove this global field from ALL templates?')) return;
    setFields(prev => prev.filter((_, idx) => idx !== i));
  };

  const moveField = (i, dir) =>
    setFields(prev => {
      const f = [...prev];
      const target = i + dir;
      if (target < 0 || target >= f.length) return f;
      [f[i], f[target]] = [f[target], f[i]];
      return f;
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateTemplate('MASTER_TEMPLATE', {
        name: masterTemplate.name,
        description: masterTemplate.description,
        fields,
      });
      await onSaved();
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-black flex items-center gap-2">
            <Globe className="h-6 w-6 text-brand-blue" /> Edit Global Fields
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            These fields appear in <strong>all templates</strong>. Changes propagate automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="gap-1.5"><X size={16} />Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save size={16} />{saving ? 'Saving…' : 'Save Global Fields'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border-2 border-brand-blue bg-blue-50/30 p-4 text-sm text-blue-700 flex items-start gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <span>
          Adding a global field will add it to all templates (at end of their field order).
          Removing a global field will remove it from all templates.
        </span>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Global Fields ({fields.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={addField} className="gap-1.5">
            <Plus size={14} />Add Global Field
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">
              No global fields yet. Click "Add Global Field" to start.
            </p>
          )}
          {fields.map((field, i) => (
            <FieldRow
              key={field.id || i}
              field={field}
              index={i}
              total={fields.length}
              isGlobal={false}
              canReorder={false}
              canEdit={true}
              canDelete={true}
              onUpdate={(key, val) => updateField(i, key, val)}
              onRemove={() => removeField(i)}
              onMoveUp={() => moveField(i, -1)}
              onMoveDown={() => moveField(i, 1)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Template Editor (Per-Template) ─────────────────────────────────────────
// Shows global + template fields with drag-and-drop ordering.
// Global fields are locked (no edit/delete) but freely reorderable.
function TemplateEditor({ template, masterTemplate, isNew, onCancel, onSaved }) {
  const masterFields = masterTemplate?.fields || [];
  const masterIds = new Set(masterFields.map(f => f.id));

  // Build initial combined fields in the correct order
  const buildCombined = () => {
    // template.fields from API is already ordered (server applies fieldOrder)
    if (template?.fields?.length > 0) return JSON.parse(JSON.stringify(template.fields));
    // New template: global fields first
    return JSON.parse(JSON.stringify(masterFields));
  };

  const [meta, setMeta] = useState({
    name: template?.name || '',
    category: template?.category || 'GENERAL',
    description: template?.description || '',
  });
  const [fields, setFields] = useState(buildCombined);
  const [saving, setSaving] = useState(false);

  // Drag state
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const onDragStart = (i) => { dragIndexRef.current = i; };
  const onDragEnter = (i) => setDragOverIndex(i);
  const onDragEnd = () => {
    const from = dragIndexRef.current;
    const to = dragOverIndex;
    if (from !== null && to !== null && from !== to) {
      setFields(prev => {
        const f = [...prev];
        const [moved] = f.splice(from, 1);
        f.splice(to, 0, moved);
        return f;
      });
    }
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const updateField = (i, key, value) =>
    setFields(prev => { const f = [...prev]; f[i] = { ...f[i], [key]: value }; return f; });

  const addField = () => {
    const id = 'field_' + Date.now();
    setFields(prev => [...prev, { id, label: '', type: 'text', required: false }]);
  };

  const removeField = (i) =>
    setFields(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!meta.name.trim()) return alert('Template name is required');
    setSaving(true);
    try {
      // Template-specific fields only (global fields are stored in master)
      const templateOnlyFields = fields.filter(f => !masterIds.has(f.id));
      // Full field order (IDs of all fields in current order)
      const fieldOrder = fields.map(f => f.id);

      const payload = {
        category: meta.category,
        name: meta.name,
        description: meta.description,
        fields: templateOnlyFields,
        fieldOrder,
      };

      if (isNew) {
        await api.createTemplate(payload);
      } else {
        await api.updateTemplate(template.id, payload);
      }
      await onSaved();
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-black">
          {isNew ? 'Create Template' : 'Edit Template'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="gap-1.5"><X size={16} />Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save size={16} />{saving ? 'Saving…' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Meta */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Template Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))}
                className={inputClass} placeholder="e.g. Process Improvement Idea" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={meta.category} onChange={e => setMeta(m => ({ ...m, category: e.target.value }))}
                className={inputClass}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
              rows="2" className={inputClass} placeholder="Brief description of this template..." />
          </div>
        </CardContent>
      </Card>

      {/* Fields — drag-and-drop */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Fields ({fields.length})</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">
              Drag <GripVertical size={11} className="inline" /> to reorder. Global fields (
              <Globe size={10} className="inline text-blue-500" /> Global) cannot be edited here.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={addField} className="gap-1.5">
            <Plus size={14} />Add Field
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">No fields yet.</p>
          )}
          {fields.map((field, i) => {
            const isGlobal = masterIds.has(field.id);
            return (
              <FieldRow
                key={field.id || i}
                field={field}
                index={i}
                total={fields.length}
                isGlobal={isGlobal}
                canReorder={true}
                canEdit={!isGlobal}
                canDelete={!isGlobal}
                onUpdate={(key, val) => updateField(i, key, val)}
                onRemove={() => removeField(i)}
                dragging={dragIndexRef.current === i}
                dragOver={dragOverIndex === i}
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
              />
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-4 items-center text-xs text-gray-400 py-2">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-200 inline-block" />
          Global field (from Master Template)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 inline-block" />
          Template-specific field
        </span>
      </div>
    </div>
  );
}

// ─── Main TemplateConfig Component ──────────────────────────────────────────
export default function TemplateConfig() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [masterTemplate, setMasterTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  // view: 'list' | 'master' | 'template'
  const [view, setView] = useState('list');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getTemplates();
      setTemplates(data.templates || []);
      setMasterTemplate(data.master || null);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSaved = async () => {
    await fetchTemplates();
    setView('list');
    setEditingTemplate(null);
    setIsNew(false);
  };

  const handleCreateTemplate = () => {
    // Pre-populate with all global fields
    setEditingTemplate({
      id: null,
      category: 'GENERAL',
      name: '',
      description: '',
      fields: masterTemplate ? JSON.parse(JSON.stringify(masterTemplate.fields || [])) : [],
    });
    setIsNew(true);
    setView('template');
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
    setIsNew(false);
    setView('template');
  };

  const handleEditMaster = () => {
    setView('master');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    try {
      await api.deleteTemplate(id);
      await fetchTemplates();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  // ── Render views ────────────────────────────────────────────────────────
  if (view === 'master') {
    return (
      <MasterEditor
        masterTemplate={masterTemplate}
        onCancel={() => setView('list')}
        onSaved={handleSaved}
      />
    );
  }

  if (view === 'template') {
    return (
      <TemplateEditor
        template={editingTemplate}
        masterTemplate={masterTemplate}
        isNew={isNew}
        onCancel={() => { setView('list'); setEditingTemplate(null); setIsNew(false); }}
        onSaved={handleSaved}
      />
    );
  }

  // ── Template List View ──────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-black flex items-center gap-2">
            <Settings2 className="h-7 w-7 text-gray-400" />Template Configuration
          </h1>
          <p className="text-gray-500 mt-1">Manage global fields and per-template layouts.</p>
        </div>
        <Button onClick={handleCreateTemplate} className="gap-2 shrink-0 shadow-md">
          <Plus size={18} />New Template
        </Button>
      </div>

      {/* Master Template Section */}
      {['superadmin', 'central team'].includes(user?.role?.toLowerCase()) && (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-blue mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
            Master Template — Global Fields
          </h2>

          {!masterTemplate ? (
            <Card className="border border-dashed border-blue-300 bg-blue-50/30">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-8 w-8 text-blue-400 mb-2" />
                <p className="text-blue-700 font-medium">Master Template not found</p>
                <p className="text-sm text-blue-600 mb-4">
                  No MASTER_TEMPLATE record exists in the database. Please seed the database.
                </p>
                <Button variant="outline" size="sm" onClick={fetchTemplates} className="gap-2">
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-brand-blue shadow-lg bg-gradient-to-br from-blue-50 to-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue" />
              <CardContent className="flex items-center justify-between p-6">
                <div className="min-w-0 flex-1 pl-2">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="font-extrabold text-lg text-brand-black tracking-tight">{masterTemplate.name}</h3>
                    <Badge className="bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 border-0 pointer-events-none">
                      Global Impact
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{masterTemplate.description}</p>
                  <div className="mt-3 text-xs font-semibold text-brand-blue flex items-center gap-1.5">
                    <div className="px-2 py-1 rounded bg-blue-100 flex items-center gap-1">
                      <Globe size={12} />
                      {masterTemplate.fields?.length || 0} global fields
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">Automatically injected into every template</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <Button
                    onClick={handleEditMaster}
                    className="gap-2 bg-brand-blue hover:bg-blue-800 shadow-md"
                  >
                    <Pencil size={15} />Edit Global Fields
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Specific Templates Section */}
      <div className="pt-2 border-t border-gray-100">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 ml-1">
          Specific Templates
        </h2>

        {loading ? (
          <div className="text-center p-12 text-gray-400">Loading templates…</div>
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
                <div key={cat} className="mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                    {cat}
                  </h3>
                  <div className="grid gap-3">
                    {catTemplates.map(t => {
                      const globalCount = (masterTemplate?.fields || []).length;
                      const ownCount = (t.fields?.length || 0) - globalCount;
                      return (
                        <Card key={t.id} className="shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-brand-black">{t.name}</h3>
                              <p className="text-sm text-gray-500 truncate">{t.description}</p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {t.fields?.length || 0} total fields
                                </Badge>
                                {globalCount > 0 && (
                                  <Badge className="text-xs bg-blue-100 text-blue-700 border-0 flex items-center gap-0.5">
                                    <Globe size={9} />{globalCount} global
                                  </Badge>
                                )}
                                {ownCount > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {ownCount} own
                                  </Badge>
                                )}
                                <Badge className="text-xs">{t.category}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4 shrink-0">
                              <Button size="sm" variant="outline" onClick={() => handleEditTemplate(t)} className="gap-1.5">
                                <Pencil size={13} />Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5">
                                <Trash2 size={13} />Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
