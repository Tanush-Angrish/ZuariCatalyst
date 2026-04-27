import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Settings, Plus, Trash2, Save, ArrowUp, ArrowDown, Lock } from 'lucide-react';
import { api } from '../../services/api';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Dropdown' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
];


export default function FormBuilder() {
  const [formType, setFormType] = useState('idea'); // 'idea' or 'user'
  const [fields, setFields] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [newField, setNewField] = useState({ fieldName: '', fieldLabel: '', fieldType: 'text', required: false, options: '' });
  const [editData, setEditData] = useState({});

  const fetchFields = async () => {
    try {
      const data = await api.getFormFields(formType);
      setFields(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchFields(); setShowAddForm(false); setEditingField(null); }, [formType]);

  // Add new field
  const handleAddField = async (e) => {
    e.preventDefault();
    const payload = {
      formType,
      fieldName: newField.fieldName.replace(/\s+/g, '_').toLowerCase(),
      fieldLabel: newField.fieldLabel,
      fieldType: newField.fieldType,
      required: newField.required,
      sortOrder: fields.length + 1,
      options: newField.fieldType === 'select' ? newField.options.split(',').map(o => o.trim()).filter(Boolean) : []
    };

    try {
      await api.createFormField(payload);
      setNewField({ fieldName: '', fieldLabel: '', fieldType: 'text', required: false, options: '' });
      setShowAddForm(false);
      fetchFields();
    } catch (e) {
      alert('Error adding field: ' + e.message);
    }
  };

  // Save edited field
  const handleSaveEdit = async (fieldId) => {
    const data = editData;
    const payload = {
      fieldLabel: data.fieldLabel,
      fieldType: data.fieldType,
      required: data.required,
      options: data.fieldType === 'select' ? (typeof data.options === 'string' ? data.options.split(',').map(o => o.trim()).filter(Boolean) : data.options) : []
    };

    try {
      await api.updateFormField(fieldId, payload);
      setEditingField(null);
      setEditData({});
      fetchFields();
    } catch (e) { alert('Error updating field: ' + e.message); }
  };

  // Delete field
  const handleDelete = async (fieldId) => {
    if (!confirm('Delete this field? This cannot be undone.')) return;
    try {
      await api.deleteFormField(fieldId);
      fetchFields();
    } catch (e) { alert('Error deleting field: ' + e.message); }
  };

  // Move field up/down
  const handleMove = async (idx, direction) => {
    const newFields = [...fields];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newFields.length) return;

    [newFields[idx], newFields[swapIdx]] = [newFields[swapIdx], newFields[idx]];
    const fieldOrder = newFields.map((f, i) => ({ id: f.id, sortOrder: i + 1 }));

    try {
      await api.reorderFormFields(formType, fieldOrder);
      fetchFields();
    } catch (e) { console.error(e); }
  };

  const inputClass = 'w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue transition-colors';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">Form Builder</h1>
        <p className="text-gray-500">Configure form fields for user registration and idea submission — no code changes needed.</p>
      </div>

      {/* Form type toggle */}
      <div className="flex gap-2">
        {[
          { id: 'idea', label: 'Idea Submission Fields' },
          { id: 'user', label: 'User Registration Fields' },
        ].map(t => (
          <button key={t.id} onClick={() => setFormType(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formType === t.id ? 'bg-brand-blue text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <Settings className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Fields List */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {formType === 'idea' ? 'Idea Submission' : 'User Registration'} Fields
            </CardTitle>
            <CardDescription>{fields.length} fields configured</CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Field
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add new field form (inline) */}
          {showAddForm && (
            <form onSubmit={handleAddField} className="border border-brand-blue/20 rounded-lg p-4 bg-blue-50/30 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Field Label *</label>
                  <input required value={newField.fieldLabel} onChange={e => setNewField({ ...newField, fieldLabel: e.target.value, fieldName: e.target.value.replace(/\s+/g, '_').toLowerCase() })} className={inputClass} placeholder="e.g. Priority Level" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Field Type *</label>
                  <select value={newField.fieldType} onChange={e => setNewField({ ...newField, fieldType: e.target.value })} className={inputClass}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={newField.required} onChange={e => setNewField({ ...newField, required: e.target.checked })} className="rounded" />
                    Required
                  </label>
                </div>
              </div>
              {newField.fieldType === 'select' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Options (comma-separated)</label>
                  <input value={newField.options} onChange={e => setNewField({ ...newField, options: e.target.value })} className={inputClass} placeholder="e.g. Low, Medium, High" />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
              </div>
            </form>
          )}

          {/* Existing fields */}
          {fields.map((field, idx) => (
            <div key={field.id} className="border border-gray-100 rounded-lg p-4 bg-white hover:border-gray-200 transition-colors">
              {editingField === field.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Label</label>
                      <input value={editData.fieldLabel} onChange={e => setEditData({ ...editData, fieldLabel: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                      <select value={editData.fieldType} onChange={e => setEditData({ ...editData, fieldType: e.target.value })} className={inputClass}>
                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end gap-3">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={editData.required} onChange={e => setEditData({ ...editData, required: e.target.checked })} className="rounded" />
                        Required
                      </label>
                    </div>
                  </div>
                  {editData.fieldType === 'select' && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Options (comma-separated)</label>
                      <input value={Array.isArray(editData.options) ? editData.options.join(', ') : editData.options} onChange={e => setEditData({ ...editData, options: e.target.value })} className={inputClass} />
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingField(null)}>Cancel</Button>
                    <Button type="button" size="sm" className="gap-1" onClick={() => handleSaveEdit(field.id)}><Save className="h-3 w-3" /> Save</Button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={() => handleMove(idx, 'down')} disabled={idx === fields.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-brand-black text-sm">{field.fieldLabel}</span>
                        {field.isSystem && <Lock className="h-3 w-3 text-gray-300" title="System field — cannot be deleted" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{field.fieldType}</Badge>
                        <span className="text-xs text-gray-400">({field.fieldName})</span>
                        {field.required && <span className="text-xs text-red-400">required</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingField(field.id); setEditData({ fieldLabel: field.fieldLabel, fieldType: field.fieldType, required: field.required, options: field.options }); }}
                      className="h-7 px-2 rounded text-xs text-gray-500 hover:bg-gray-100 transition-colors">Edit</button>
                    {!field.isSystem && (
                      <button onClick={() => handleDelete(field.id)}
                        className="h-7 w-7 rounded text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
