import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import {
  X, Plus, Trash2, Edit3, Check, ChevronDown,
  MessageSquare, Send, Sparkles, Calendar, Clock,
  Loader2, AtSign, CheckCircle2, AlertCircle, Pause, User,
  RefreshCw, Lock, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';

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

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────
function ConfirmDialog({ title, body, confirmLabel, confirmClass = '', onConfirm, onCancel, icon }) {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-20 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b">
          {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{body}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm} className={confirmClass}>{confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body
  );
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
function StepCard({ step, canEdit, onEdit, onDelete }) {
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
  const [activeTab, setActiveTab] = useState('overview');
  const { notify } = useNotifications();

  // AI finalization state — derived from project.isStepsFinalized (persisted)
  const [isFinalized, setIsFinalized] = useState(!!initialProject.isStepsFinalized);
  const [hasGenerated, setHasGenerated] = useState(false);   // has Gemini been triggered at least once?
  const [hasRegenerated, setHasRegenerated] = useState(false); // has Regenerate been used once already?

  // Steps state
  const [addingStep, setAddingStep] = useState(false);
  const [newStepDesc, setNewStepDesc] = useState('');
  const [newStepDeadline, setNewStepDeadline] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiSteps, setGeminiSteps] = useState(null); // pending review
  const [savingGemini, setSavingGemini] = useState(false);

  // Confirmation dialogs
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

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
  const [pendingMentions, setPendingMentions] = useState([]);
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
      const data = await api.getProjectDetails(project.id);
      setSteps(data.steps || []);
      setMessages(data.messages || []);
      // Keep finalization state in sync with DB
      if (data.isStepsFinalized !== undefined) {
        setIsFinalized(data.isStepsFinalized);
      }
    } catch (e) { console.error(e); }
  }, [project.id]);

  const fetchParticipants = useCallback(async () => {
    try {
      const data = await api.getProjectParticipants(project.id);
      setParticipants(data);
    } catch (e) { console.error(e); }
  }, [project.id]);

  useEffect(() => { fetchSteps(); fetchParticipants(); }, [fetchSteps, fetchParticipants]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
      await api.addProjectStep(project.id, { description: newStepDesc, deadline: newStepDeadline || null });
      setNewStepDesc(''); setNewStepDeadline(''); setAddingStep(false);
      fetchSteps();
      notify({ type: 'success', title: 'Step Added', message: 'The project step has been created.' });
    } catch (e) {
      console.error(e);
      notify({ type: 'error', title: 'Error', message: 'Failed to add step.' });
    }
  };

  const handleEditStep = async (stepId, data) => {
    try {
      await api.updateProjectStep(project.id, stepId, data);
      fetchSteps();
      notify({ type: 'success', title: 'Step Updated' });
    } catch (e) {
      console.error(e);
      notify({ type: 'error', title: 'Error', message: 'Failed to update step.' });
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Delete this step?')) return;
    try {
      await api.deleteProjectStep(project.id, stepId);
      fetchSteps();
      notify({ type: 'info', title: 'Step Deleted' });
    } catch (e) { console.error(e); }
  };

  // ── Gemini — INITIAL GENERATE ─────────────────────────────────────────────
  const runGeminiGenerate = async () => {
    setGeminiLoading(true);
    try {
      const data = await api.generateGeminiPlan(project.id, {
        title: project.title,
        problemDescription: '',
        proposedSolution: project.aiSummary || ''
      });
      if (data.steps) {
        setGeminiSteps(data.steps.map(s => ({ ...s, _editing: false })));
        setHasGenerated(true); // mark generate as used — enables Regenerate once
      } else {
        notify({ type: 'error', title: 'AI Error', message: 'Gemini could not generate a plan. Check your API key.' });
      }
    } catch (e) {
      notify({ type: 'error', title: 'AI Error', message: 'Error calling Gemini AI.' });
    }
    setGeminiLoading(false);
  };

  // ── Gemini — REGENERATE (wipe + re-generate) ──────────────────────────────
  const handleRegenerateConfirmed = async () => {
    setShowRegenerateConfirm(false);
    setGeminiSteps(null);
    // Wipe all current DB steps first
    try {
      await api.deleteAllProjectSteps(project.id);
      await fetchSteps(); // refresh to show empty list
    } catch (e) {
      notify({ type: 'error', title: 'Error', message: 'Failed to clear existing steps.' });
      return;
    }
    // Then generate fresh — mark regenerate as spent (max 1 use)
    setHasRegenerated(true);
    await runGeminiGenerate();
  };

  // ── Gemini — SAVE & FINALIZE ──────────────────────────────────────────────
  const handleSaveConfirmed = async () => {
    setShowSaveConfirm(false);
    setSavingGemini(true);
    try {
      // Pass finalize=true so backend locks AI in same transaction
      await api.bulkAddSteps(project.id, geminiSteps, true);
      setGeminiSteps(null);
      setIsFinalized(true);
      // Sync parent project state
      const updated = { ...project, isStepsFinalized: true };
      setProject(updated);
      onProjectUpdated?.(updated);
      await fetchSteps();
      notify({ type: 'success', title: 'Plan Saved & Locked', message: 'AI-generated steps saved. AI planning is now disabled for this project.' });
    } catch (e) {
      notify({ type: 'error', title: 'Error', message: 'Failed to save steps.' });
    }
    setSavingGemini(false);
  };

  // ── Status / Deadline ─────────────────────────────────────────────────────
  const handleStatusSave = async () => {
    try {
      await api.updateProjectStatus(project.id, selectedStatus);
      const updated = { ...project, status: selectedStatus };
      setProject(updated);
      onProjectUpdated?.(updated);
      setEditStatus(false);
      notify({ type: 'success', title: 'Status Updated', message: `Project status is now ${selectedStatus}.` });
    } catch (e) { console.error(e); }
  };

  const handleDeadlineSave = async () => {
    try {
      await api.updateProjectDeadline(project.id, selectedDeadline || null);
      const updated = { ...project, deadline: selectedDeadline ? new Date(selectedDeadline).toISOString() : null };
      setProject(updated);
      onProjectUpdated?.(updated);
      setEditDeadline(false);
      notify({ type: 'success', title: 'Deadline Updated' });
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
      await api.sendProjectMessage(project.id, {
        senderId: currentUser.id,
        senderName: currentUser.name,
        message: chatInput,
        mentionedUserIds: pendingMentions.map(p => p.id)
      });
      setChatInput('');
      setPendingMentions([]);
      fetchSteps();
      notify({ type: 'success', title: 'Message Sent' });
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
      {/* Confirmation: Regenerate warning */}
      {showRegenerateConfirm && (
        <ConfirmDialog
          title="Regenerate AI Steps?"
          body="This will permanently DELETE all existing steps and generate a brand-new plan with Gemini AI. This cannot be undone."
          confirmLabel="Yes, Regenerate"
          confirmClass="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
          icon={<AlertTriangle size={20} className="text-amber-500" />}
          onConfirm={handleRegenerateConfirmed}
          onCancel={() => setShowRegenerateConfirm(false)}
        />
      )}

      {/* Confirmation: Save & lock */}
      {showSaveConfirm && (
        <ConfirmDialog
          title="Save & Lock AI Planning?"
          body="Once saved, AI planning (Gemini) will be permanently disabled for this project. You can still add, edit, and delete steps manually."
          confirmLabel="Confirm & Save"
          confirmClass="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
          icon={<Lock size={20} className="text-purple-500" />}
          onConfirm={handleSaveConfirmed}
          onCancel={() => setShowSaveConfirm(false)}
        />
      )}

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
              {isFinalized && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 flex items-center gap-1">
                  <Lock size={9} />AI Locked
                </span>
              )}
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
              {project.aiSummary && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">AI Summary</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{project.aiSummary}"</p>
                </div>
              )}

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

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Organization</p>
                  <p className="text-sm font-medium text-gray-700">{project.orgId}</p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Created On</p>
                  <p className="text-sm font-medium text-gray-700">{fmtDate(project.createdAt)}</p>
                </div>
              </div>

              {steps.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Progress</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((steps.filter(s => s.status === 'Completed').length / steps.length) * 100)}%` }}
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

              {/* ── AI Status Banner ── */}
              {isPrivileged && isFinalized && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                  <ShieldCheck size={16} className="text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800">AI Planning Locked</p>
                    <p className="text-xs text-purple-600 mt-0.5">
                      Gemini step generation has been finalized. You can still add, edit, and delete steps manually below.
                    </p>
                  </div>
                </div>
              )}

              {/* ── AI Toolbar (only when NOT finalized) ── */}
              {isPrivileged && !isFinalized && !geminiSteps && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Initial generate — shown if Gemini hasn't been used yet */}
                    {!hasGenerated && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={runGeminiGenerate}
                        disabled={geminiLoading}
                      >
                        {geminiLoading
                          ? <><Loader2 size={14} className="animate-spin" />Generating...</>
                          : <><Sparkles size={14} />Use Gemini for Planning</>
                        }
                      </Button>
                    )}

                    {/* Regenerate — shown after first generate, disabled/hidden after one use */}
                    {hasGenerated && !hasRegenerated && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                        onClick={() => setShowRegenerateConfirm(true)}
                        disabled={geminiLoading}
                      >
                        {geminiLoading
                          ? <><Loader2 size={14} className="animate-spin" />Generating...</>
                          : <><RefreshCw size={14} />Regenerate Steps</>
                        }
                      </Button>
                    )}

                    {/* After both generate + regenerate used — show locked message */}
                    {hasGenerated && hasRegenerated && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
                        <Lock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">AI generation limit reached (1 generate + 1 regenerate)</span>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setAddingStep(!addingStep)}
                    >
                      <Plus size={14} />Add Step Manually
                    </Button>
                  </div>

                  {/* Helper text about limits — only visible before any generation */}
                  {!hasGenerated && (
                    <p className="text-[11px] text-gray-400">
                      <Sparkles size={10} className="inline mr-1 text-purple-400" />
                      Gemini can generate once and regenerate <strong>once</strong>. After saving, AI is permanently disabled.
                    </p>
                  )}
                  {hasGenerated && !hasRegenerated && (
                    <p className="text-[11px] text-amber-600">
                      <AlertTriangle size={10} className="inline mr-1" />
                      Regenerate is available <strong>one more time</strong>. It will delete all current steps and create a new plan.
                    </p>
                  )}
                </div>
              )}

              {/* ── Manual add (always visible for privileged, even after finalize) ── */}
              {isPrivileged && isFinalized && !geminiSteps && (
                <div className="flex items-center gap-3">
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

              {/* ── Gemini Steps Preview Panel ── */}
              {geminiSteps && (
                <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Sparkles size={15} className="text-purple-600" />
                    <span className="text-sm font-bold text-purple-700">Gemini-Generated Plan</span>
                    <span className="text-xs text-purple-500">— review and edit before saving</span>
                  </div>

                  {/* Warning about lock */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Lock size={13} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      <strong>Note:</strong> Saving these steps will <strong>permanently lock AI planning</strong> for this project.
                      You can still add/edit/delete steps manually after saving.
                    </p>
                  </div>

                  {geminiSteps.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-xs font-bold text-purple-400 mt-2 shrink-0 w-5">{i + 1}.</span>
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

                  <div className="flex gap-2 pt-1 flex-wrap">
                    {/* Save & Finalize (with confirm dialog) */}
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                      onClick={() => setShowSaveConfirm(true)}
                      disabled={savingGemini || geminiSteps.length === 0}
                    >
                      {savingGemini ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
                      Save Steps
                    </Button>
                    {/* Regenerate inside preview — only if regeneration hasn't been used */}
                    {!hasRegenerated && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                        onClick={() => setShowRegenerateConfirm(true)}
                        disabled={savingGemini}
                      >
                        <RefreshCw size={13} />Regenerate
                      </Button>
                    )}
                    {hasRegenerated && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Lock size={10} />Regenerate used — not available again
                      </span>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setGeminiSteps(null)} className="text-xs text-gray-500">
                      Discard
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Empty state ── */}
              {steps.length === 0 && !geminiSteps && (
                <div className="text-center py-10 text-gray-400">
                  <CheckCircle2 className="mx-auto mb-3 text-gray-200" size={40} />
                  <p className="text-sm">No steps yet.{isPrivileged && !isFinalized && ' Add steps manually or use Gemini to plan.'}</p>
                </div>
              )}

              {/* ── Steps List ── */}
              <div className="space-y-2">
                {steps.map(step => (
                  <StepCard
                    key={step.id}
                    step={step}
                    canEdit={isPrivileged}
                    onEdit={handleEditStep}
                    onDelete={handleDeleteStep}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ───── CHAT ───── */}
          {activeTab === 'chat' && (
            <div className="flex flex-col gap-4 h-full" style={{ minHeight: 320 }}>
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
