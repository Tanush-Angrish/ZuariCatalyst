import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import mammoth from 'mammoth';
import { Link, useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { IdeaPDFDocument } from './IdeaPDF';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ChevronDown, ChevronUp, X,
  Building, Tag, CheckCircle2, XCircle,
  Calendar, Paperclip, Link as LinkIcon, UserCheck,
  Download, Eye, Mic, Lightbulb, ThumbsUp, Search, SlidersHorizontal,
  AlertTriangle, RefreshCw, Send, Clock, ChevronRight, Users, Plus, FileDown
} from 'lucide-react';
import { api } from '../services/api';

// ─── Unified Action Modal ─────────────────────────────────────────────────
// Handles: Under Review, Reject, Assign (all require a reason)
function ActionModal({ ideaId, ideaTitle, ideaStatus, viewType, orgAdmins, onConfirm, onCancel }) {
  // Determine available actions based on viewType and current ideaStatus
  const getActions = () => {
    if (ideaStatus === 'Under Review') {
      // Under review: can Approve or Reject (with reason)
      const acts = [
        { id: 'Approved', label: 'Approve Idea', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', desc: 'Approve and convert to a project.' },
        { id: 'Rejected', label: 'Decline Idea', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'Decline this idea with a reason.' },
      ];
      return acts;
    }
    const acts = [
      { id: 'Under Review', label: 'Put Under Review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Move to active review. Required before approving.' },
      { id: 'Rejected', label: 'Decline Idea', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'Decline this idea with a reason.' },
    ];
    if (viewType === 'superadmin') {
      acts.push({ id: 'Assigned', label: 'Assign to Org Admin', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Delegate review to an Org Admin.' });
    }
    return acts;
  };

  const actions = getActions();
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedAction) { setError('Please select an action.'); return; }
    if (selectedAction === 'Rejected' && !reason.trim()) { setError('A reason is required when declining an idea.'); return; }
    if (selectedAction === 'Approved') {
      const len = reason.trim().length;
      if (len < 10 || len > 150) {
        setError('Please provide remarks between 10 and 150 characters to proceed.');
        return;
      }
    }
    if (selectedAction === 'Assigned' && !selectedAdmin) { setError('Please select an Org Admin to assign to.'); return; }

    setLoading(true);
    try {
      await onConfirm({ action: selectedAction, reason: reason.trim(), adminId: selectedAdmin || null });
    } catch (e) {
      setError(e.message || 'Action failed. Please try again.');
      setLoading(false);
    }
  };

  const selectedDef = actions.find(a => a.id === selectedAction);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-16 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b">
          <div className="p-2 rounded-xl bg-gray-100 text-gray-600">
            <ChevronRight size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">Take Action</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{ideaTitle}</p>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Action Selector */}
        <div className="px-6 pt-5 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Choose Action</p>
          {actions.map(act => {
            const Icon = act.icon;
            const isSelected = selectedAction === act.id;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => { setSelectedAction(act.id); setError(''); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  isSelected ? `${act.bg} ${act.border} ring-2 ring-offset-1 ring-current ${act.color}` : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon size={17} className={isSelected ? act.color : 'text-gray-400'} />
                <div>
                  <p className={`text-sm font-semibold ${isSelected ? act.color : 'text-gray-700'}`}>{act.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Org Admin Selector (only for Assign) */}
        {selectedAction === 'Assigned' && (
          <div className="px-6 pt-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assign To <span className="text-red-500">*</span></label>
            <select
              className="w-full text-sm border border-gray-300 rounded-xl p-2.5 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              value={selectedAdmin}
              onChange={e => setSelectedAdmin(e.target.value)}
            >
              <option value="">Select Org Admin…</option>
              {(orgAdmins || []).map(a => (
                <option key={a.id} value={a.id}>{a.name}{a.organization ? ` (${a.organization})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* Remarks Input — required for Approval and Rejection */}
        {(selectedAction === 'Rejected' || selectedAction === 'Approved') && (
          <div className="px-6 pt-4">
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-xs font-semibold text-gray-600">
                {selectedAction === 'Rejected' ? 'Reason for Declining' : 'Remarks'} <span className="text-red-500">*</span>
                <span className="ml-1 font-normal text-gray-400">(required)</span>
              </label>
              {selectedAction === 'Approved' && (
                <span className={`text-[10px] font-semibold ${reason.trim().length < 10 || reason.trim().length > 150 ? 'text-red-500' : 'text-gray-400'}`}>
                  {reason.trim().length}/150
                </span>
              )}
            </div>
            <textarea
              autoFocus
              value={reason}
              onChange={e => { setReason(e.target.value); setError(''); }}
              rows={3}
              placeholder={selectedAction === 'Rejected' ? "Explain why this idea is being declined. This will be shared with the employee…" : "Provide remarks for this approval (10-150 chars)…"}
              className={`w-full rounded-xl border p-3 text-sm resize-none transition-all focus:outline-none focus:ring-2 ${
                selectedAction === 'Approved' && (reason.trim().length > 0 && (reason.trim().length < 10 || reason.trim().length > 150))
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-gray-200 focus:border-brand-blue/50 focus:ring-brand-blue/20'
              }`}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
            <AlertTriangle size={13} />{error}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-5">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedAction || loading}
            className={selectedDef?.id === 'Rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : selectedDef?.id === 'Approved' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          >
            {loading ? 'Processing…' : (selectedDef ? `Confirm: ${selectedDef.label}` : 'Select an Action')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Helper: extract field value from idea ─────────────────────────────────
function getFieldValue(fieldId, idea) {
  if (fieldId === 'title') return idea.title;
  if (fieldId === 'department') return idea.department;
  if (fieldId === 'expectedImpact') return idea.expectedImpact;
  if (fieldId === 'referenceLink' || fieldId === 'supportingLink') return idea.supportingLink;
  if (fieldId === 'problemDescription') {
    if (idea.extra?.problemDescription) return idea.extra.problemDescription;
    const m = idea.description?.match(/Problem:\n([\s\S]*?)(?=\n\nSolution:|$)/i);
    return m ? m[1].trim() : idea.description;
  }
  if (fieldId === 'proposedSolution') {
    if (idea.extra?.proposedSolution) return idea.extra.proposedSolution;
    const m = idea.description?.match(/Solution:\n([\s\S]*)/i);
    return m ? m[1].trim() : '';
  }
  return idea.extra?.[fieldId] ?? '';
}

// ─── Status badge variant ──────────────────────────────────────────────────
function statusVariant(status) {
  switch (status) {
    case 'Approved': return 'success';
    case 'Rejected': return 'destructive';
    case 'Under Review': return 'warning';
    case 'Assigned to Org Admin': return 'secondary';
    default: return 'secondary';
  }
}

// ─── SLA Status Badge ───────────────────────────────────────────────────────
function SLABadge({ idea }) {
  if (!idea.slaDeadline) return null;

  const deadline = new Date(idea.slaDeadline);
  const now = new Date();
  const msRemaining = deadline.getTime() - now.getTime();
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  let label = '';
  let colorClass = '';

  if (msRemaining <= 0) {
    if (idea.slaStage === 'under_review_central' || idea.slaStage === 'under_review_org_admin') {
      label = 'Auto approval pending';
      colorClass = 'bg-red-50 text-red-700 border-red-200';
    } else {
      label = 'SLA breached';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  } else {
    if (daysRemaining > 1) {
      label = `${Math.ceil(daysRemaining)} days remaining`;
      colorClass = 'bg-blue-50 text-blue-700 border-blue-150';
    } else {
      const hrs = Math.max(1, Math.ceil(hoursRemaining));
      label = `${hrs} hr${hrs > 1 ? 's' : ''} remaining`;
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorClass}`}>
      <Clock size={11} className="shrink-0" />
      {label}
    </span>
  );
}


// ─── Read-More text block ──────────────────────────────────────────────────
const TRUNCATE_LEN = 120;
function ReadMoreText({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-gray-300 text-xs">—</span>;
  const needsTrunc = text.length > TRUNCATE_LEN;
  return (
    <div>
      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
        {needsTrunc && !expanded ? text.slice(0, TRUNCATE_LEN) + '…' : text}
      </p>
      {needsTrunc && (
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          className="mt-1 text-xs text-brand-blue font-medium hover:underline flex items-center gap-1"
        >
          {expanded ? <><ChevronUp size={12} />Read Less</> : <><ChevronDown size={12} />Read More</>}
        </button>
      )}
    </div>
  );
}

// ─── Detail Modal (rendered via Portal for proper centering) ───────────────
function IdeaDetailModal({ idea, viewType, currentUser, onClose, onAction, orgAdmins, selectedAdmins, onAdminSelect, onDirectAction, templates, isEmployee }) {
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const templateDef = (templates || []).find(t => t.id === idea.extra?._templateId);
  const fields = templateDef?.fields ?? [];

  const isEmployeeView = viewType === 'employee' || viewType === 'myIdeas';
  const isOwnIdea = currentUser && idea.authorId === currentUser.id;
  const showRejectionBanner = idea.status === 'Rejected' && (isEmployeeView || isOwnIdea);

  // PDF download permission: only the author OR an admin role
  const canDownloadPDF = currentUser && (
    idea.authorId === currentUser.id ||
    ['Org Admin', 'Superadmin', 'Central Team'].includes(currentUser.role)
  );

  // PDF download state
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const fileName = `Catalyst-Idea-${(idea.title || 'idea').replace(/[^a-z0-9\u0900-\u097F]/gi, '-')}.pdf`;
      const blob = await pdf(<IdeaPDFDocument idea={idea} templateDef={templateDef} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      // Surface real error so it can be diagnosed quickly
      const msg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
      alert(`PDF Error: ${msg}`);
    } finally {
      setPdfLoading(false);
    }
  };


  // Parse files from idea (must be before renderReadOnlyField which uses ideaFiles)
  const ideaFiles = useMemo(() => {
    try {
      const raw = typeof idea.files === 'string' ? JSON.parse(idea.files) : (idea.files || []);
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }, [idea.files]);
  const fileAttachments = ideaFiles.filter(f => f.type === 'file');
  const voiceNotes = ideaFiles.filter(f => f.type === 'voice');

  // ── Read-only field renderer (mirrors the submission form) ────────────────
  const inputReadOnlyCls = 'w-full rounded-md border border-gray-200 bg-gray-50/60 p-2 text-sm text-gray-700 cursor-not-allowed outline-none';

  const renderReadOnlyField = (field) => {
    const value = getFieldValue(field.id, idea);
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            disabled
            readOnly
            value={value || ''}
            rows={4}
            className={inputReadOnlyCls + ' resize-none'}
          />
        );
      case 'url':
        return value ? (
          <div className={inputReadOnlyCls + ' flex items-center gap-1.5'}>
            <LinkIcon size={12} className="text-brand-blue shrink-0" />
            <a href={value} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline text-sm truncate">{value}</a>
          </div>
        ) : <div className={inputReadOnlyCls + ' text-gray-300 italic'}>Not provided</div>;
      case 'select':
        return (
          <div className={inputReadOnlyCls}>{value || <span className="text-gray-300 italic">Not selected</span>}</div>
        );
      case 'file': {
        const fieldFiles = ideaFiles.filter(f => f.type === 'file');
        if (!fieldFiles.length) return <div className={inputReadOnlyCls + ' text-gray-300 italic'}>No files attached</div>;
        return (
          <div className="space-y-1.5">
            {fieldFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-gray-50 border border-gray-100 text-sm">
                <Paperclip size={12} className="text-brand-blue shrink-0" />
                <span className="flex-1 truncate text-gray-700">{f.name || f.url}</span>
                <button type="button" onClick={() => setViewingFile(f)} className="text-brand-blue text-xs hover:underline flex items-center gap-1"><Eye size={11} />View</button>
                <button type="button" onClick={(e) => handleDownload(e, api.getFileUrl(f.url), f.name)} className="text-brand-blue text-xs hover:underline flex items-center gap-1"><Download size={11} />Download</button>
              </div>
            ))}
          </div>
        );
      }
      case 'voice': {
        const vNotes = ideaFiles.filter(f => f.type === 'voice');
        if (!vNotes.length) return <div className={inputReadOnlyCls + ' text-gray-300 italic'}>No voice note recorded</div>;
        return (
          <div className="space-y-1.5">
            {vNotes.map((v, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-purple-50/50 border border-purple-100">
                <Mic size={13} className="text-purple-500 shrink-0" />
                <audio controls src={api.getFileUrl(v.url)} className="h-8 flex-1" />
              </div>
            ))}
          </div>
        );
      }
      case 'number':
      case 'date':
      default:
        return (
          <div className={inputReadOnlyCls}>{value || <span className="text-gray-300 italic">Not provided</span>}</div>
        );
    }
  };

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (!viewingFile) {
      setFileContent(null);
      setLoadingFile(false);
      return;
    }

    const ext = viewingFile.url.split('.').pop().toLowerCase();

    if (ext === 'txt') {
      setLoadingFile(true);
      fetch(api.getFileUrl(viewingFile.url))
        .then(res => res.text())
        .then(text => {
          setFileContent({ type: 'txt', content: text });
          setLoadingFile(false);
        })
        .catch(err => {
          console.error('Error fetching txt file:', err);
          setLoadingFile(false);
        });
    } else if (ext === 'docx') {
      setLoadingFile(true);
      fetch(api.getFileUrl(viewingFile.url))
        .then(res => res.arrayBuffer())
        .then(buffer => mammoth.convertToHtml({ arrayBuffer: buffer }))
        .then(result => {
          setFileContent({ type: 'docx', content: result.value });
          setLoadingFile(false);
        })
        .catch(err => {
          console.error('Error converting docx file:', err);
          setLoadingFile(false);
        });
    }
  }, [viewingFile]);
  
  const handleDownload = async (e, url, fileName) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download Error:", err);
      // Fallback to direct link if fetch fails (e.g. CORS)
      window.open(url, '_blank');
    }
  };

  const problem = getFieldValue('problemDescription', idea);
  const solution = getFieldValue('proposedSolution', idea);
  const extraFields = fields.filter(f =>
    !['title', 'department', 'problemDescription', 'proposedSolution',
      'expectedImpact', 'referenceLink', 'supportingLink', 'attachment'].includes(f.id)
  );

  const isOwn = currentUser && idea.authorId === currentUser.id;
  const displayName = isOwn ? 'Me' : (idea.authorName || 'Unknown');
  const displayOrg = idea.authorOrganization || (isOwn ? currentUser?.organization : null);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`modal-transition-container ${viewingFile ? 'modal-slide-left' : ''}`}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto animate-modal-in"
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between gap-4 z-10 rounded-t-2xl">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-brand-black leading-snug">{idea.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {viewType !== 'community' && <SLABadge idea={idea} />}
                {!(isEmployee && viewType === 'community') && (
                  <Badge variant={statusVariant(idea.status)}>{idea.status === 'Rejected' ? 'Declined' : idea.status}</Badge>
                )}
                {displayOrg && !(isEmployee && viewType === 'community') && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Building size={10} />{displayOrg}
                  </span>
                )}
                {idea.department && !(isEmployee && viewType === 'community') && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Tag size={10} />{idea.department}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* PDF Download — only for author, Org Admin, Superadmin, Central Team */}
              {canDownloadPDF && idea.status !== 'Draft' && (
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-all shadow-sm"
                >
                  <FileDown size={13} />
                  {pdfLoading ? 'Generating…' : 'Download PDF'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Rejection reason banner — shown to employees for their own rejected ideas */}
          {showRejectionBanner && idea.rejectionReason && !(isEmployee && viewType === 'community') && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500 shrink-0" />
                <h3 className="text-sm font-bold text-red-700">Declined — Reviewer Feedback</h3>
              </div>
              <p className="text-sm text-red-800 leading-relaxed">{idea.rejectionReason}</p>
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <RefreshCw size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Coming Soon — Resubmit Feature</p>
                  <p className="text-xs text-amber-700 mt-0.5">We are working on a feature that will let you update and resubmit your idea for review. Stay tuned!</p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection placeholder when no reason stored (old ideas) */}
          {showRejectionBanner && !idea.rejectionReason && !(isEmployee && viewType === 'community') && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500 shrink-0" />
                <span className="text-sm font-semibold text-red-700">Idea Declined</span>
              </div>
              <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <RefreshCw size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">We are working on a resubmission feature. Stay tuned!</p>
              </div>
            </div>
          )}

          {/* AI Insights Section */}
            {idea.aiSummary && (
              <div className="p-5 rounded-2xl bg-[#F4F6FB] border border-[#E1E5F2]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-white border border-[#E1E5F2] text-amber-500 shadow-sm">
                    <Lightbulb size={16} />
                  </div>
                  <h3 className="text-[13px] font-extrabold uppercase tracking-widest text-brand-blue">AI Summary</h3>
                </div>
                <p className="text-base font-medium text-gray-800 leading-relaxed italic">
                  "{idea.aiSummary}"
                </p>

                {/* AI Tags */}
                {(() => {
                  try {
                    const tags = typeof idea.aiTags === 'string' ? JSON.parse(idea.aiTags) : (idea.aiTags || []);
                    if (Array.isArray(tags) && tags.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 bg-white border border-brand-blue/20 text-brand-blue rounded-full font-semibold uppercase tracking-tight">
                              {tag}
                            </span>
                          ))}
                        </div>
                      );
                    }
                  } catch (e) { return null; }
                  return null;
                })()}
              </div>
            )}

            {/* Author block (Shown to all) */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              {/* Avatar: photo or initials */}
              {idea.authorPhotoUrl ? (
                <img
                  src={api.getFileUrl(idea.authorPhotoUrl)}
                  alt={displayName}
                  className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-blue to-blue-400 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {displayName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-black">{displayName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  {!(isEmployee && viewType === 'community') && displayOrg && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Building size={10} />{displayOrg}
                    </span>
                  )}
                  {/* Employee ID + Mobile — visible to admins in review/assigned views */}
                  {!isEmployee && idea.authorEmployeeId && (
                    <span className="text-xs text-gray-400 font-mono">ID: {idea.authorEmployeeId}</span>
                  )}
                  {!isEmployee && idea.authorMobile && (
                    <span className="text-xs text-gray-400 font-mono">📱 {idea.authorMobile}</span>
                  )}
                </div>
              </div>
              <div className="ml-auto text-xs text-gray-400 flex items-center gap-1 shrink-0">
                <Calendar size={11} />
                {new Date(idea.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* ── Read-only Form View (mirrors submission form exactly) ─────────── */}
            {!(isEmployee && viewType === 'community') && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/30 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <FileText size={13} className="text-brand-blue" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {templateDef ? templateDef.name : 'Idea Details'}
                  </span>
                </div>

                <div className="p-4">
                  {fields.length > 0 ? (
                    // Template fields exist → render as read-only form grid
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {fields.map(field => (
                        <div
                          key={field.id}
                          className={field.type === 'textarea' || field.type === 'file' || field.type === 'voice' ? 'md:col-span-2' : ''}
                        >
                          <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-gray-600">
                            {field.label}
                            {field.required && <span className="text-red-400 text-xs">*</span>}
                          </label>
                          {renderReadOnlyField(field)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // No template def → graceful fallback showing core fields
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {[
                        { id: 'title', label: 'Title', type: 'text' },
                        { id: 'department', label: 'Department', type: 'text' },
                        { id: 'problemDescription', label: 'Problem Description', type: 'textarea' },
                        { id: 'proposedSolution', label: 'Proposed Solution', type: 'textarea' },
                        { id: 'expectedImpact', label: 'Expected Impact', type: 'textarea' },
                        { id: 'referenceLink', label: 'Supporting Link', type: 'url' },
                      ].map(field => {
                        const val = getFieldValue(field.id, idea);
                        if (!val) return null;
                        return (
                          <div
                            key={field.id}
                            className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                          >
                            <label className="mb-1.5 block text-sm font-semibold text-gray-600">{field.label}</label>
                            {renderReadOnlyField(field)}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Voice notes — always shown if present */}
                  {voiceNotes.length > 0 && (
                    <div className="mt-4 md:col-span-2">
                      <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-gray-600">
                        <Mic size={13} className="text-gray-400" /> Voice Note
                      </label>
                      <div className="space-y-2">
                        {voiceNotes.map((v, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-purple-50/50 border border-purple-100">
                            <Mic size={13} className="text-purple-500 shrink-0" />
                            <audio controls src={api.getFileUrl(v.url)} className="h-8 flex-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer action buttons */}
          {(viewType === 'orgAdmin' || viewType === 'superadmin') && idea.status !== 'Approved' && idea.status !== 'Rejected' && (
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <Button
                size="sm"
                className="font-semibold gap-2 px-6 py-2.5 h-auto text-sm shadow-md bg-brand-blue hover:bg-blue-700 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => setActionModalOpen(true)}
              >
                Take Action <ChevronDown size={16} />
              </Button>
            </div>
          )}

          {actionModalOpen && (
            <ActionModal
              ideaId={idea.id}
              ideaTitle={idea.title}
              ideaStatus={idea.status}
              viewType={viewType}
              orgAdmins={orgAdmins}
              onConfirm={async ({ action, reason, adminId }) => {
                if (action === 'Under Review') {
                  await api.underReviewIdea(idea.id);
                } else if (action === 'Assigned') {
                  await api.assignIdea(idea.id, parseInt(adminId));
                } else if (action === 'Approved') {
                  await onDirectAction?.(idea.id, 'Approved', null);
                } else if (action === 'Rejected') {
                  await onDirectAction?.(idea.id, 'Rejected', reason);
                }
                setActionModalOpen(false);
                onAction?.(idea.id, action, reason, adminId);
                onClose(); // Close detail modal after action
              }}
              onCancel={() => setActionModalOpen(false)}
            />
          )}
        </div>

        {/* File Viewer Panel (Slides in from right) */}
        {viewingFile && (
          <div className="absolute left-[calc(50%+20px)] sm:left-[calc(50%+100px)] top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[88vh] flex flex-col animate-viewer-in z-[10000]">
            {/* Viewer Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between gap-4 rounded-t-2xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewingFile(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                  title="Back to idea"
                >
                  <ChevronUp className="-rotate-90" size={20} />
                </button>
                <h2 className="text-lg font-bold text-brand-black truncate">{viewingFile.name}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 overflow-auto bg-gray-50 flex flex-col">
              {loadingFile ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
                  <div className="h-8 w-8 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin mb-4" />
                  <p className="text-sm">Loading document...</p>
                </div>
              ) : fileContent?.type === 'txt' ? (
                <div className="p-8 bg-white min-h-full">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                    {fileContent.content}
                  </pre>
                </div>
              ) : fileContent?.type === 'docx' ? (
                <div className="p-8 bg-white min-h-full prose prose-sm max-w-none">
                  <div
                    className="docx-content text-gray-800"
                    dangerouslySetInnerHTML={{ __html: fileContent.content }}
                  />
                </div>
              ) : viewingFile.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                <div className="flex-1 flex items-center justify-center">
                  <img
                    src={api.getFileUrl(viewingFile.url)}
                    alt={viewingFile.name}
                    className="max-w-full max-h-full object-contain p-4"
                  />
                </div>
              ) : viewingFile.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`${api.getFileUrl(viewingFile.url)}#toolbar=0`}
                  className="w-full h-full border-none"
                  title={viewingFile.name}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-6">Preview not available for this file type.</p>
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, api.getFileUrl(viewingFile.url), viewingFile.name)}
                    className="inline-flex items-center justify-center px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 shadow-sm transition-all gap-2 text-sm font-medium"
                  >
                    <Download size={16} /> Download to View
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render into document.body so fixed positioning & centering are never affected
  // by any parent transform/overflow CSS
  return ReactDOM.createPortal(modal, document.body);
}

// ─── Single Idea Card ──────────────────────────────────────────────────────
function IdeaCard({ idea, viewType, currentUser, onAction, orgAdmins, selectedAdmins, onAdminSelect, onDirectAction, templates, isEmployee }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch upvote count on mount
  useEffect(() => {
    if (currentUser?.id && idea.id) {
      api.getUpvotes(idea.id, currentUser.id)
        .then(data => { setUpvoteCount(data.count); setHasUpvoted(data.upvoted); })
        .catch(() => {});
    }
  }, [idea.id, currentUser?.id]);

  const problem = getFieldValue('problemDescription', idea);
  const solution = getFieldValue('proposedSolution', idea);
  const templateName = idea.extra?._templateName || 'General';

  const isOwn = currentUser && idea.authorId === currentUser.id;
  const displayName = isOwn ? 'Me' : (idea.authorName || 'Unknown');

  const openModal = () => setModalOpen(true);

  // Wrapper that opens modal when clicking the non-interactive parts of the card
  const handleCardClick = e => {
    // Let interactive elements handle their own events
    if (e.defaultPrevented) return;
    
    // If it's the author's own Draft, go to editor instead of opening detail modal
    if (isOwn && idea.status === 'Draft') {
      navigate('/dashboard', { state: { editDraftIdea: idea } });
      return;
    }
    
    openModal();
  };

  return (
    <>
      {/* The outer div catches all card clicks */}
      <div
        role="button"
        tabIndex={0}
        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        onClick={handleCardClick}
        onKeyDown={e => { if (e.key === 'Enter') openModal(); }}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            {idea.authorPhotoUrl ? (
              <img
                src={api.getFileUrl(idea.authorPhotoUrl)}
                alt={displayName}
                className="h-7 w-7 rounded-full object-cover border border-gray-200 shrink-0"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-blue to-blue-400 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {displayName.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-brand-black truncate">{displayName}</span>
            {idea.authorOrganization && !isOwn && viewType !== 'community' && (
              <span className="text-xs text-gray-400 hidden sm:block truncate">• {idea.authorOrganization}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {viewType !== 'community' && <SLABadge idea={idea} />}
            {/* Hide Status badge for employees in community view */}
            {!(isEmployee && viewType === 'community') && (
              <Badge variant={statusVariant(idea.status)} className={`text-xs ${idea.status === 'Draft' ? 'bg-amber-100 text-amber-800' : ''}`}>{idea.status === 'Rejected' ? 'Declined' : idea.status}</Badge>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="px-5 pb-4 flex-1 space-y-4">
          {/* AI Summary (Top of card content) */}
          {idea.aiSummary && (
            <div className="p-4 rounded-xl bg-[#F4F6FB] border border-[#E1E5F2] hover:shadow-sm transition-shadow">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-brand-blue mb-1.5 flex items-center gap-1.5">
                <Lightbulb size={13} className="text-amber-500" /> AI Summary
              </p>
              <p className="text-[14.5px] font-medium text-gray-800 leading-relaxed italic line-clamp-4">
                "{idea.aiSummary}"
              </p>
            </div>
          )}
          <h3 className="font-extrabold text-gray-900 text-lg leading-[1.3] group-hover:text-brand-blue transition-colors line-clamp-3">
            {idea.title}
          </h3>
        </div>

        {/* Card Footer */}
        <div className="px-5 py-4 border-t border-gray-100 mt-auto bg-gray-50/30 rounded-b-xl">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              {/* Upvote button (Hidden if rejected) */}
              {currentUser && idea.authorId !== currentUser.id && idea.status !== 'Rejected' && (
                <button
                  type="button"
                  disabled={upvoteLoading || hasUpvoted}
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    setUpvoteLoading(true);
                    api.toggleUpvote(idea.id, currentUser.id)
                      .then(data => { setHasUpvoted(data.upvoted); setUpvoteCount(data.count); })
                      .catch(() => {})
                      .finally(() => setUpvoteLoading(false));
                  }}
                  onPointerDown={e => e.stopPropagation()}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${hasUpvoted ? 'bg-brand-blue text-white border-brand-blue shadow-sm cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue hover:text-brand-blue shadow-sm'}`}
                >
                  <ThumbsUp size={14} className={hasUpvoted ? 'fill-white' : ''} />
                  {upvoteCount > 0 && <span className="font-semibold">{upvoteCount}</span>}
                </button>
              )}
              {/* Show static count for own ideas, logged-out users, or rejected ideas */}
              {(!currentUser || idea.authorId === currentUser.id || idea.status === 'Rejected') && upvoteCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-brand-black font-semibold px-2 py-1">
                  <ThumbsUp size={14} className="text-brand-blue" />{upvoteCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Employee Draft Action */}
              {viewType === 'myIdeas' && idea.status === 'Draft' && (
                <div onClick={e => e.preventDefault()} onPointerDown={e => e.stopPropagation()}>
                  <Button 
                    size="sm" 
                    className="text-xs py-1.5 h-auto font-semibold shadow-sm bg-brand-blue hover:bg-blue-700 text-white gap-1.5 px-3"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to submit this draft for review?")) {
                        try {
                          await api.submitDraftIdea(idea.id);
                          window.location.reload();
                        } catch(err) {
                          alert(err.message);
                        }
                      }
                    }}
                  >
                    <Send size={13} /> Submit Now
                  </Button>
                </div>
              )}

              {/* Central Team / Org Admin Action Button */}
              {(viewType === 'superadmin' || viewType === 'orgAdmin') && idea.status !== 'Approved' && idea.status !== 'Rejected' && (
                <div onClick={e => e.preventDefault()} onPointerDown={e => e.stopPropagation()}>
                  <Button
                    size="sm"
                    className="text-xs py-1.5 h-auto font-semibold shadow-sm gap-1.5 px-3"
                    onClick={e => { e.stopPropagation(); setActionModalOpen(true); }}
                  >
                    Take Action <ChevronDown size={13} />
                  </Button>
                </div>
              )}

              <div className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
                {idea.status === 'Draft' ? 'Saved' : 'Submitted'} on {new Date(idea.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Action Modal */}
      {actionModalOpen && (
        <ActionModal
          ideaId={idea.id}
          ideaTitle={idea.title}
          ideaStatus={idea.status}
          viewType={viewType}
          orgAdmins={orgAdmins}
          onConfirm={async ({ action, reason, adminId }) => {
            if (action === 'Under Review') {
              await api.underReviewIdea(idea.id);
            } else if (action === 'Assigned') {
              await api.assignIdea(idea.id, parseInt(adminId));
            } else if (action === 'Approved') {
              await onDirectAction?.(idea.id, 'Approved', reason);
            } else if (action === 'Rejected') {
              await onDirectAction?.(idea.id, 'Rejected', reason);
            }
            setActionModalOpen(false);
            onAction?.(idea.id, action, reason, adminId);
          }}
          onCancel={() => setActionModalOpen(false)}
        />
      )}

      {/* Detail Modal */}
      {modalOpen && (
        <IdeaDetailModal
          idea={idea}
          viewType={viewType}
          currentUser={currentUser}
          onClose={() => setModalOpen(false)}
          onAction={onAction}
          orgAdmins={orgAdmins}
          selectedAdmins={selectedAdmins}
          onAdminSelect={onAdminSelect}
          onDirectAction={onDirectAction}
          templates={templates}
          isEmployee={isEmployee}
        />
      )}
    </>
  );
}

// ─── Main Export: IdeaCardGrid ─────────────────────────────────────────────
export default function IdeaCardGrid({
  ideas,
  viewType,
  onAction,
  orgAdmins,
  selectedAdmins,
  onAdminSelect,
  onDirectAction,
  showSearch = true,
  isEmployee = false,
}) {
  const { user: currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    api.getTemplates().then(d => setTemplates(d.templates || [])).catch(console.error);
  }, []);

  const parsedIdeas = useMemo(() =>
    ideas.map(idea => ({
      ...idea,
      extra: typeof idea.extraFields === 'string'
        ? JSON.parse(idea.extraFields)
        : (idea.extraFields || {})
    }))
    , [ideas]);

  // Collect unique statuses for filter chips
  const allStatuses = useMemo(() => {
    const s = new Set(parsedIdeas.map(i => i.status).filter(Boolean));
    return ['All', ...Array.from(s)];
  }, [parsedIdeas]);

  // Robust multi-field search + status filter
  const filteredIdeas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return parsedIdeas.filter(idea => {
      // Status filter
      if (statusFilter !== 'All' && idea.status !== statusFilter) return false;
      if (!q) return true;
      // Search across multiple fields
      const extraText = Object.values(idea.extra || {}).join(' ');
      return (
        idea.title?.toLowerCase().includes(q) ||
        idea.authorName?.toLowerCase().includes(q) ||
        idea.authorOrganization?.toLowerCase().includes(q) ||
        idea.department?.toLowerCase().includes(q) ||
        idea.aiSummary?.toLowerCase().includes(q) ||
        idea.status?.toLowerCase().includes(q) ||
        extraText.toLowerCase().includes(q)
      );
    });
  }, [parsedIdeas, searchQuery, statusFilter]);

  // Status chip color helper
  const chipColor = (status) => {
    if (status === 'All') return statusFilter === 'All' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue hover:text-brand-blue';
    if (statusFilter === status) {
      if (status === 'Approved') return 'bg-green-600 text-white border-green-600';
      if (status === 'Rejected') return 'bg-red-600 text-white border-red-600';
      return 'bg-brand-blue text-white border-brand-blue';
    }
    return 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue hover:text-brand-blue';
  };

  const showSearchUI = showSearch && parsedIdeas.length > 0;



  // Superadmin gets wider cards (2 cols) to fit assign + approve/reject
  const gridCols = viewType === 'superadmin'
    ? 'grid-cols-1 lg:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="space-y-4">
      {/* ── Search + Filter Bar ─────────────────────────────────────── */}
      {showSearchUI && (
        <div className="space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, summary, department…"
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue/40 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter chips — hidden for employees in Community Hub */}
          {allStatuses.length > 2 && !(isEmployee && viewType === 'community') && (
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal size={13} className="text-gray-400 shrink-0" />
              {allStatuses.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${chipColor(s)}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Result count */}
          {(searchQuery || statusFilter !== 'All') && (
            <p className="text-xs text-gray-400">
              Showing <strong className="text-gray-700">{filteredIdeas.length}</strong> of {parsedIdeas.length} ideas
              {searchQuery && <> matching &ldquo;<em>{searchQuery}</em>&rdquo;</>}
            </p>
          )}
        </div>
      )}

      {/* ── Completely Empty State for Employees ──────────────────────── */}
      {parsedIdeas.length === 0 && isEmployee && (
        <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center text-gray-500 bg-white shadow-sm max-w-2xl mx-auto mt-12 animate-fade-in-up">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mb-5 border border-blue-100">
            <Lightbulb size={32} strokeWidth={2} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nothing here yet</h3>
          <p className="text-[15px] mb-8 max-w-md mx-auto leading-relaxed">
            There are no ideas to display right now. Start sharing your innovative thoughts to help improve the organization and climb the leaderboard!
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_4px_12px_rgba(0,53,128,0.2)] hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Submit New Idea
          </Link>
        </div>
      )}

      {/* ── No Search Results State / Default Empty State ─────────────── */}
      {((parsedIdeas.length > 0 && filteredIdeas.length === 0) || (parsedIdeas.length === 0 && !isEmployee)) && (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400 bg-white">
          <Search className="mx-auto h-10 w-10 text-gray-200 mb-3" />
          <h3 className="text-base font-semibold text-gray-600 mb-1">No results found</h3>
          <p className="text-sm">
            {parsedIdeas.length === 0 ? "No ideas have been submitted yet." : "Try adjusting your search or clearing the status filter."}
          </p>
          {parsedIdeas.length > 0 && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
              className="mt-3 text-xs font-semibold text-brand-blue hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Ideas grid ──────────────────────────────────────────────── */}
      {filteredIdeas.length > 0 && (
        <div className={`grid ${gridCols} gap-5 animate-fade-in-up`}>
          {filteredIdeas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              viewType={viewType}
              currentUser={currentUser}
              onAction={onAction}
              orgAdmins={orgAdmins}
              selectedAdmins={selectedAdmins}
              onAdminSelect={onAdminSelect}
              onDirectAction={onDirectAction}
              templates={templates}
              isEmployee={isEmployee}
            />
          ))}
        </div>
      )}
    </div>
  );
}
