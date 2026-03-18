import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import {
  X, Plus, Trash2, Edit3, Check, ChevronDown, 
  MessageSquare, Send, Sparkles, Calendar, Clock,
  Loader2, AtSign, CheckCircle2, AlertCircle, Pause, User
} from 'lucide-react';

const STATUS_COLORS = {
  Initiated:   'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  'On Hold':   'bg-gray-100 text-gray-600 border-gray-200',
  Completed:   'bg-green-100 text-green-700 border-green-200',
};

const STEP_STATUS_COLORS = {
  Pending:       'bg-gray-100 text-gray-600',
  'In Progress': 'bg-amber-100 text-amber-700',
  Completed:     'bg-green-100 text-green-700',
};

const PROJECT_STATUSES = ['Initiated', 'In Progress', 'On Hold', 'Completed'];
const STEP_STATUSES    = ['Pending', 'In Progress', 'Completed'];

// ─── Format date helper ────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Section Divider ───────────────────────────────────────────────────────
function Section({ title, children, action }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Step Card ─────────────────────────────────────────────────────────────
function StepCard({ step, canEdit, onEdit, onDelete, onStatusChange }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(step.description);
  const [status, setStatus] = useState(step.status);
  const [deadline, setDeadline] = useState(step.deadline ? step.deadline.split('T')[0] : '');

  const handleSave = () => {
    onEdit(step.id, { description: desc, status, deadline: deadline || null });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2 transition-all hover:border-gray-200 hover:shadow-sm">
      {editing ? (
        <div className="space-y-3">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            rows={2}
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            <select
              className="border border-gray-300 rounded-lg text-xs p-1.5 bg-white focus:ring-1 focus:ring-blue-500"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STEP_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input
              type="date"
              className="border border-gray-300 rounded-lg text-xs p-1.5 bg-white focus:ring-1 focus:ring-blue-500"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="text-xs h-auto py-1.5">
              <Check size={12} className="mr-1" />Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="text-xs h-auto py-1.5">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 leading-relaxed">{step.description}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STEP_STATUS_COLORS[step.status]}`}>
                {step.status}
              </span>
              {step.deadline && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Calendar size={9} />Due {fmtDate(step.deadline)}
                </span>
              )}
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit step"
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={() => onDelete(step.id)}
                className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500 transition-colors"
                title="Delete step"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chat Bubble ───────────────────────────────────────────────────────────
function ChatBubble({ msg, currentUser }) {
  const isOwn = msg.senderId === currentUser.id;
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
        {msg.senderName?.charAt(0) || '?'}
      </div>
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isOwn && <span className="text-[10px] text-gray-400 px-1">{msg.senderName}</span>}
        <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${isOwn ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
          {msg.message}
        </div>
        <span className="text-[9px] text-gray-300 px-1">
          {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ─── Main ProjectModal ─────────────────────────────────────────────────────
export default function ProjectModal({ project: initialProject, onClose, currentUser, onProjectUpdated }) {
  const [project, setProject] = useState(initialProject);
  const [steps, setSteps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview | steps | chat
  
  // Steps state
  const [addingStep, setAddingStep] = useState(false);
  const [newStepDesc, setNewStepDesc] = useState('');
  const [newStepDeadline, setNewStepDeadline] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiSteps, setGeminiSteps] = useState(null); // pending review
  const [savingGemini, setSavingGemini] = useState(false);

  // Status/deadline
  const [editStatus, setEditStatus] = useState(false);
  const [editDeadline, setEditDeadline] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(project.status);
  const [selectedDeadline, setSelectedDeadline] = useState(
    project.deadline ? project.deadline.split('T')[0] : ''
  );

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [mentionDropdown, setMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [pendingMentions, setPendingMentions] = useState([]); // { id, name }
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const isPrivileged = currentUser.role === 'Org Admin' || currentUser.role === 'Superadmin';
  const isMentioned = messages.some(m => {
    try {
      const mentioned = JSON.parse(m.mentionedUsers || '[]');
      return mentioned.includes(currentUser.id);
    } catch { return false; }
  });
  const canChat = isPrivileged || isMentioned;

  // ── Fetch steps & messages ────────────────────────────────────────────────
  const fetchSteps = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`);
      const data = await res.json();
      setSteps(data.steps || []);
      setMessages(data.messages || []);
    } catch (e) { console.error(e); }
  }, [project.id]);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/participants`);
      const data = await res.json();
      setParticipants(data);
    } catch (e) { console.error(e); }
  }, [project.id]);

  useEffect(() => { fetchSteps(); fetchParticipants(); }, [fetchSteps, fetchParticipants]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Keyboard close
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  // ── Step actions ─────────────────────────────────────────────────────────
  const handleAddStep = async () => {
    if (!newStepDesc.trim()) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newStepDesc, deadline: newStepDeadline || null })
      });
      if (res.ok) {
        setNewStepDesc(''); setNewStepDeadline(''); setAddingStep(false);
        fetchSteps();
      }
    } catch (e) { console.error(e); }
  };

  const handleEditStep = async (stepId, data) => {
    try {
      await fetch(`/api/projects/${project.id}/steps/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      fetchSteps();
    } catch (e) { console.error(e); }
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Delete this step?')) return;
    try {
      await fetch(`/api/projects/${project.id}/steps/${stepId}`, { method: 'DELETE' });
      fetchSteps();
    } catch (e) { console.error(e); }
  };

  // ── Gemini plan ───────────────────────────────────────────────────────────
  const handleGeminiPlan = async () => {
    setGeminiLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/gemini-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          problemDescription: '',
          proposedSolution: project.aiSummary || ''
        })
      });
      const data = await res.json();
      if (data.steps) {
        setGeminiSteps(data.steps.map(s => ({ ...s, _editing: false })));
      } else {
        alert('Gemini could not generate a plan. Please check your API key.');
      }
    } catch (e) { alert('Error calling Gemini AI.'); }
    setGeminiLoading(false);
  };

  const handleSaveGeminiSteps = async () => {
    setSavingGemini(true);
    try {
      await fetch(`/api/projects/${project.id}/steps/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: geminiSteps })
      });
      setGeminiSteps(null);
      fetchSteps();
    } catch (e) { alert('Error saving steps.'); }
    setSavingGemini(false);
  };

  // ── Status / Deadline ─────────────────────────────────────────────────────
  const handleStatusSave = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus })
      });
      if (res.ok) {
        const updated = { ...project, status: selectedStatus };
        setProject(updated);
        onProjectUpdated?.(updated);
        setEditStatus(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeadlineSave = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/deadline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: selectedDeadline || null })
      });
      if (res.ok) {
        const updated = { ...project, deadline: selectedDeadline ? new Date(selectedDeadline).toISOString() : null };
        setProject(updated);
        onProjectUpdated?.(updated);
        setEditDeadline(false);
      }
    } catch (e) { console.error(e); }
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const handleChatInput = (e) => {
    const val = e.target.value;
    setChatInput(val);
    const lastAtPos = val.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const search = val.slice(lastAtPos + 1);
      if (!search.includes(' ')) {
        setMentionSearch(search);
        setMentionDropdown(true);
        return;
      }
    }
    setMentionDropdown(false);
  };

  const handleMentionSelect = (participant) => {
    const lastAtPos = chatInput.lastIndexOf('@');
    const newInput = chatInput.slice(0, lastAtPos) + `@${participant.name} `;
    setChatInput(newInput);
    setPendingMentions(prev => prev.find(p => p.id === participant.id) ? prev : [...prev, participant]);
    setMentionDropdown(false);
    chatInputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !canChat) return;
    setSendingMsg(true);
    try {
      await fetch(`/api/projects/${project.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          message: chatInput,
          mentionedUserIds: pendingMentions.map(p => p.id)
        })
      });
      setChatInput('');
      setPendingMentions([]);
      fetchSteps(); // also refreshes messages
    } catch (e) { console.error(e); }
    setSendingMsg(false);
  };

  const filteredParticipants = participants.filter(p =>
    p.id !== currentUser.id &&
    p.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col animate-modal-in"
        onPointerDown={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-mono tracking-wider">
                {project.projectId}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[project.status] || STATUS_COLORS.Initiated}`}>
                {project.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">{project.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock size={10} /> Created {fmtDate(project.createdAt)}
              {project.deadline && <><span className="mx-1">·</span><Calendar size={10} /> Due {fmtDate(project.deadline)}</>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b bg-white px-6 gap-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'steps', label: `Steps (${steps.length})` },
            { key: 'chat', label: `Chat (${messages.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">

          {/* ───── OVERVIEW ───── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* AI Summary */}
              {project.aiSummary && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">AI Summary</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{project.aiSummary}"</p>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Status</p>
                  {isPrivileged && editStatus ? (
                    <div className="flex gap-2">
                      <select
                        className="flex-1 border border-gray-300 rounded-lg text-sm p-1.5 focus:ring-1 focus:ring-blue-500 bg-white"
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                      >
                        {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <Button size="sm" onClick={handleStatusSave} className="h-auto py-1.5 px-2 text-xs">
                        <Check size={12} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[project.status] || ''}`}>
                        {project.status}
                      </span>
                      {isPrivileged && (
                        <button onClick={() => setEditStatus(true)} className="text-gray-300 hover:text-blue-500 transition-colors">
                          <Edit3 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Deadline */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Deadline</p>
                  {isPrivileged && editDeadline ? (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="flex-1 border border-gray-300 rounded-lg text-sm p-1.5 focus:ring-1 focus:ring-blue-500 bg-white"
                        value={selectedDeadline}
                        onChange={e => setSelectedDeadline(e.target.value)}
                      />
                      <Button size="sm" onClick={handleDeadlineSave} className="h-auto py-1.5 px-2 text-xs">
                        <Check size={12} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-medium">
                        {project.deadline ? fmtDate(project.deadline) : <span className="text-gray-400">Not set</span>}
                      </span>
                      {isPrivileged && (
                        <button onClick={() => setEditDeadline(true)} className="text-gray-300 hover:text-blue-500 transition-colors">
                          <Edit3 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Organization */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Organization</p>
                  <p className="text-sm font-medium text-gray-700">{project.orgId}</p>
                </div>

                {/* Created On */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Created On</p>
                  <p className="text-sm font-medium text-gray-700">{fmtDate(project.createdAt)}</p>
                </div>
              </div>

              {/* Step progress indicator */}
              {steps.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Progress</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((steps.filter(s => s.status === 'Completed').length / steps.length) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">
                      {steps.filter(s => s.status === 'Completed').length}/{steps.length} done
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───── STEPS ───── */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              {/* Gemini button */}
              {isPrivileged && !geminiSteps && (
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={handleGeminiPlan}
                    disabled={geminiLoading}
                  >
                    {geminiLoading
                      ? <><Loader2 size={14} className="animate-spin" />Generating...</>
                      : <><Sparkles size={14} />Use Gemini for Planning</>
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setAddingStep(!addingStep)}
                  >
                    <Plus size={14} />Add Step Manually
                  </Button>
                </div>
              )}

              {/* Add step form */}
              {addingStep && isPrivileged && (
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 space-y-3">
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm resize-none focus:ring-1 focus:ring-blue-500 bg-white"
                    rows={2}
                    placeholder="Describe this step..."
                    value={newStepDesc}
                    onChange={e => setNewStepDesc(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      className="border border-gray-300 rounded-lg text-xs p-1.5 bg-white"
                      value={newStepDeadline}
                      onChange={e => setNewStepDeadline(e.target.value)}
                    />
                    <Button size="sm" onClick={handleAddStep} className="text-xs">
                      <Plus size={12} className="mr-1" />Add
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingStep(false)} className="text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Gemini steps preview */}
              {geminiSteps && (
                <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={15} className="text-purple-600" />
                    <span className="text-sm font-bold text-purple-700">Gemini-Generated Plan</span>
                    <span className="text-xs text-purple-500">— review and edit before saving</span>
                  </div>
                  {geminiSteps.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-xs font-bold text-purple-400 mt-2 shrink-0 w-5">{i+1}.</span>
                      <textarea
                        className="flex-1 border border-purple-200 rounded-lg p-2 text-sm resize-none bg-white focus:ring-1 focus:ring-purple-400"
                        rows={2}
                        value={s.description}
                        onChange={e => {
                          const updated = [...geminiSteps];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setGeminiSteps(updated);
                        }}
                      />
                      <button
                        onClick={() => setGeminiSteps(geminiSteps.filter((_, idx) => idx !== i))}
                        className="p-1.5 text-purple-300 hover:text-red-400 transition-colors mt-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                      onClick={handleSaveGeminiSteps}
                      disabled={savingGemini}
                    >
                      {savingGemini ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Confirm & Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setGeminiSteps(null)} className="text-xs text-gray-500">
                      Discard
                    </Button>
                  </div>
                </div>
              )}

              {/* Steps list */}
              {steps.length === 0 && !geminiSteps && (
                <div className="text-center py-10 text-gray-400">
                  <CheckCircle2 className="mx-auto mb-3 text-gray-200" size={40} />
                  <p className="text-sm">No steps yet.{isPrivileged && ' Add steps manually or use Gemini to plan.'}</p>
                </div>
              )}
              <div className="space-y-2">
                {steps.map(step => (
                  <StepCard
                    key={step.id}
                    step={step}
                    canEdit={isPrivileged}
                    onEdit={handleEditStep}
                    onDelete={handleDeleteStep}
                    onStatusChange={handleEditStep}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ───── CHAT ───── */}
          {activeTab === 'chat' && (
            <div className="flex flex-col gap-4 h-full" style={{ minHeight: 320 }}>
              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 350 }}>
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <MessageSquare className="mx-auto mb-3 text-gray-200" size={40} />
                    <p className="text-sm">No messages yet.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <ChatBubble key={msg.id} msg={msg} currentUser={currentUser} />
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Mention dropdown */}
              {mentionDropdown && filteredParticipants.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredParticipants.slice(0, 5).map(p => (
                    <button
                      key={p.id}
                      onPointerDown={e => { e.preventDefault(); handleMentionSelect(p); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
                    >
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800">{p.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{p.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Input area */}
              {canChat ? (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    {pendingMentions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {pendingMentions.map(p => (
                          <span key={p.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AtSign size={9} />{p.name}
                            <button onClick={() => setPendingMentions(prev => prev.filter(x => x.id !== p.id))}>
                              <X size={9} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <textarea
                      ref={chatInputRef}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] max-h-[120px]"
                      placeholder={'Type a message... (use @ to mention someone)'}
                      value={chatInput}
                      onChange={handleChatInput}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                      }}
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || sendingMsg}
                    className="h-11 w-11 p-0 shrink-0 rounded-xl"
                  >
                    {sendingMsg ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">
                  <AlertCircle size={15} />
                  <span>You can only reply when someone @mentions you in this chat.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
