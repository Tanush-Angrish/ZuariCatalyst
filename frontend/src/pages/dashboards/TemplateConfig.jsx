import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Plus, Pencil, Trash2, Save, X, GripVertical,
  AlertCircle, Settings2, Globe, ChevronDown, ChevronUp, Sparkles, Loader2, Mic,
  FolderOpen, Check
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

const inputClass =
  'w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue transition-colors';

// ─── Shared Field Row Component ─────────────────────────────────────────────
function FieldRow({
  field, index, total,
  isGlobal,
  canReorder,
  canEdit,
  canDelete,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
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
          <input
            value={field.label}
            onChange={e => onUpdate('label', e.target.value)}
            className={inputClass}
            placeholder="Field label"
            disabled={!canEdit}
          />
          <input
            value={field.id}
            onChange={e => onUpdate('id', e.target.value)}
            className={inputClass + ' font-mono text-xs'}
            placeholder="field_id"
            disabled={!canEdit}
          />
          <select
            value={field.type}
            onChange={e => onUpdate('type', e.target.value)}
            className={inputClass}
            disabled={!canEdit}
          >
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

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

// ─── Manage Categories Modal ──────────────────────────────────────────────────
function ManageCategoriesModal({ categories, onClose, onChanged }) {
  const [list, setList] = useState(categories);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    const data = await api.getCategories();
    setList(data);
    onChanged(data);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setError('');
    setSaving(true);
    try {
      await api.createCategory(newName.trim());
      setNewName('');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    if (!editValue.trim()) return;
    setError('');
    setSaving(true);
    try {
      await api.updateCategory(id, editValue.trim());
      setEditingId(null);
      setEditValue('');
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Existing templates will keep their current category value.')) return;
    setSaving(true);
    try {
      await api.deleteCategory(id);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-16 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-brand-blue" />
            <h2 className="text-lg font-bold text-brand-black">Manage Categories</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Existing categories */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {list.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 group px-1 py-0.5 rounded-lg hover:bg-gray-50">
                {editingId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                    <button onClick={() => handleEdit(cat.id)} disabled={saving}
                      className="p-1.5 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Check size={13} />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-800 py-1.5">{cat.name}</span>
                    <button onClick={() => { setEditingId(cat.id); setEditValue(cat.name); }}
                      className="p-1.5 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} disabled={saving}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
            {list.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No categories yet</p>
            )}
          </div>

          {/* Add new */}
          <div className="flex gap-2 pt-2 border-t">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="New category name…"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
            <Button size="sm" onClick={handleAdd} disabled={saving || !newName.trim()} className="gap-1.5 shrink-0">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add
            </Button>
          </div>
          <p className="text-[11px] text-gray-400">
            Categories are stored in uppercase. Renaming propagates to all existing templates instantly.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button variant="outline" className="w-full" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Category Dropdown with inline "Manage" trigger ──────────────────────────
function CategorySelect({ value, onChange, categories, onManage }) {
  return (
    <div className="flex gap-1.5">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={inputClass + ' flex-1'}
      >
        <option value="">Select category…</option>
        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
      <button
        type="button"
        onClick={onManage}
        title="Manage categories"
        className="px-2.5 border border-gray-300 rounded-md text-gray-500 hover:text-brand-blue hover:border-brand-blue hover:bg-blue-50 transition-colors"
      >
        <FolderOpen size={15} />
      </button>
    </div>
  );
}

// ─── Template Editor (Per-Template) ─────────────────────────────────────────
function TemplateEditor({ template, masterTemplate, isNew, onCancel, onSaved, categories, onCategoriesChange }) {
  const masterFields = masterTemplate?.fields || [];
  const masterIds = new Set(masterFields.map(f => f.id));

  const buildCombined = () => {
    if (template?.fields?.length > 0) return JSON.parse(JSON.stringify(template.fields));
    return JSON.parse(JSON.stringify(masterFields));
  };

  const [meta, setMeta] = useState({
    name: template?.name || '',
    category: template?.category || categories[0]?.name || '',
    description: template?.description || '',
  });
  const [fields, setFields] = useState(buildCombined);
  const [saving, setSaving] = useState(false);
  const [manageCatOpen, setManageCatOpen] = useState(false);

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
    if (!meta.category) return alert('Please select a category');
    setSaving(true);
    try {
      const templateOnlyFields = fields.filter(f => !masterIds.has(f.id));
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
      {manageCatOpen && (
        <ManageCategoriesModal
          categories={categories}
          onClose={() => setManageCatOpen(false)}
          onChanged={onCategoriesChange}
        />
      )}

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
              <CategorySelect
                value={meta.category}
                onChange={val => setMeta(m => ({ ...m, category: val }))}
                categories={categories}
                onManage={() => setManageCatOpen(true)}
              />
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
  const [categories, setCategories] = useState([]);
  const [manageCatOpen, setManageCatOpen] = useState(false);

  // view: 'list' | 'master' | 'template'
  const [view, setView] = useState('list');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const [data, cats] = await Promise.all([api.getTemplates(), api.getCategories()]);
      setTemplates(data.templates || []);
      setMasterTemplate(data.master || null);
      setCategories(cats || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSaved = async () => {
    await fetchTemplates();
    setView('list');
    setEditingTemplate(null);
    setIsNew(false);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate({
      id: null,
      category: categories[0]?.name || '',
      name: '',
      description: '',
      fields: masterTemplate ? JSON.parse(JSON.stringify(masterTemplate.fields || [])) : [],
    });
    setIsNew(true);
    setView('template');
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const result = await api.generateTemplate(aiPrompt.trim());
      const globalFields = masterTemplate ? JSON.parse(JSON.stringify(masterTemplate.fields || [])) : [];
      const aiFields = (result.fields || []).map(f => ({
        id: f.id || 'ai_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        label: f.label || '',
        type: f.type || 'text',
        required: f.required || false,
        options: f.options || [],
      }));
      // Try to match AI-suggested category; fallback to first available
      const aiCat = result.category
        ? (categories.find(c => c.name.toUpperCase() === result.category.toUpperCase())?.name || categories[0]?.name || '')
        : (categories[0]?.name || '');
      setEditingTemplate({
        id: null,
        category: aiCat,
        name: result.template_name || '',
        description: result.description || '',
        fields: [...globalFields, ...aiFields],
      });
      setIsNew(true);
      setAiModalOpen(false);
      setAiPrompt('');
      setView('template');
    } catch (e) {
      setAiError(e.message || 'AI generation failed. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
    setIsNew(false);
    setView('template');
  };

  const handleEditMaster = () => { setView('master'); };

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
        categories={categories}
        onCategoriesChange={setCategories}
      />
    );
  }

  // ── Template List View ──────────────────────────────────────────────────
  // Group templates by category dynamically
  const usedCategories = [...new Set(templates.map(t => t.category).filter(Boolean))];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Manage Categories Modal (from list view) */}
      {manageCatOpen && (
        <ManageCategoriesModal
          categories={categories}
          onClose={() => setManageCatOpen(false)}
          onChanged={(cats) => { setCategories(cats); fetchTemplates(); }}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-black flex items-center gap-2">
            <Settings2 className="h-7 w-7 text-gray-400" />Template Configuration
          </h1>
          <p className="text-gray-500 mt-1">Manage global fields and per-template layouts.</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {['superadmin', 'central team'].includes(user?.role?.toLowerCase()) && (
            <>
              <Button
                variant="outline"
                onClick={() => setManageCatOpen(true)}
                className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
              >
                <FolderOpen size={15} />Manage Categories
              </Button>
              <Button
                variant="outline"
                onClick={() => setAiModalOpen(true)}
                className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 shadow-sm"
              >
                <Sparkles size={16} />Create with AI
              </Button>
            </>
          )}
          <Button onClick={handleCreateTemplate} className="gap-2 shrink-0 shadow-md">
            <Plus size={18} />New Template
          </Button>
        </div>
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
            {usedCategories.map(cat => {
              const catTemplates = templates.filter(t => t.category === cat);
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

      {/* AI Template Generation Modal */}
      {aiModalOpen && (
        <div
          className="fixed inset-0 z-[9999] p-4 pt-[12vh] sm:pt-[15vh] flex justify-center items-start transition-all duration-300"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setAiModalOpen(false); setAiError(''); } }}
        >
          <div className="bg-white/95 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] w-full max-w-2xl p-6 sm:p-8 transform transition-all animate-modal-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-100 to-fuchsia-50 text-purple-600 shadow-sm">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-brand-black tracking-tight">
                    Create with AI
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">Describe your ideal template</p>
                </div>
              </div>
              <button onClick={() => { setAiModalOpen(false); setAiError(''); }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="relative group">
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={4}
                placeholder='e.g. "Create a process improvement template with fields for department, problem, solution, expected cost savings..."'
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 p-5 pr-14 text-base focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-400/10 transition-all resize-none text-gray-800 placeholder:text-gray-400"
                disabled={aiLoading}
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                   type="button"
                   className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                   title="Voice input coming soon"
                >
                   <Mic size={18} />
                </button>
              </div>
            </div>

            {aiError && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="font-medium leading-snug">{aiError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4">
              <p className="text-[11px] text-gray-400 font-medium">
                Powered by Gemini AI • <span className="text-gray-500">Fields are fully editable later</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-xl px-5" onClick={() => { setAiModalOpen(false); setAiError(''); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 shadow-md shadow-purple-200 transition-all transform active:scale-95"
                >
                  {aiLoading ? (
                    <><Loader2 size={18} className="animate-spin" />Generating…</>
                  ) : (
                    <><Sparkles size={18} />Generate</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
