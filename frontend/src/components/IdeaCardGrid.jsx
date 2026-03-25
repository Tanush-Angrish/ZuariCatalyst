import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import mammoth from 'mammoth';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ChevronDown, ChevronUp, X,
  Building, Tag, CheckCircle2, XCircle,
  Calendar, Paperclip, Link as LinkIcon, UserCheck,
  Download, Eye, Mic, Lightbulb, ThumbsUp, Search, SlidersHorizontal,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

// ─── Reject Reason Modal ───────────────────────────────────────────────────
function RejectReasonModal({ ideaTitle, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) { setError('Please provide a reason for rejection.'); return; }
    onConfirm(reason.trim());
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-20 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b">
          <div className="p-2 rounded-xl bg-red-50 text-red-500">
            <XCircle size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Reject Idea</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">{ideaTitle}</p>
          </div>
          <button onClick={onCancel} className="ml-auto p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Reason for Rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            autoFocus
            value={reason}
            onChange={e => { setReason(e.target.value); setError(''); }}
            rows={4}
            placeholder="Explain why this idea is being rejected. This feedback will be shared with the employee to help them improve and resubmit…"
            className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 resize-none transition-all"
          />
          {error && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle size={12} />{error}
            </p>
          )}
          <p className="mt-2 text-[11px] text-gray-400">
            This reason will be shown to the employee in the app and in the email notification.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
          >
            <XCircle size={15} />Confirm Reject
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
    case 'Assigned to Org Admin': return 'warning';
    default: return 'secondary';
  }
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
function IdeaDetailModal({ idea, viewType, currentUser, onClose, onAction, orgAdmins, selectedAdmins, onAdminSelect, onDirectAction, templates }) {
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [pendingRejectTarget, setPendingRejectTarget] = useState(null); // { id, via: 'orgAdmin'|'superadmin' }
  const templateDef = (templates || []).find(t => t.id === idea.extra?._templateId);
  const fields = templateDef?.fields ?? [];

  const isEmployee = viewType === 'employee' || viewType === 'myIdeas' || viewType === 'community';
  const isOwnIdea = currentUser && idea.authorId === currentUser.id;
  const showRejectionBanner = idea.status === 'Rejected' && (isEmployee || isOwnIdea);

  const handleRejectClick = (ideaId, via) => {
    setPendingRejectTarget({ id: ideaId, via });
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = (reason) => {
    setRejectModalOpen(false);
    if (!pendingRejectTarget) return;
    const { id, via } = pendingRejectTarget;
    if (via === 'orgAdmin') onAction?.(id, 'Rejected', reason);
    else onDirectAction?.(id, 'Rejected', reason);
    onClose();
  };

  // Parse files from idea
  const ideaFiles = useMemo(() => {
    try {
      const raw = typeof idea.files === 'string' ? JSON.parse(idea.files) : (idea.files || []);
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }, [idea.files]);
  const fileAttachments = ideaFiles.filter(f => f.type === 'file');
  const voiceNotes = ideaFiles.filter(f => f.type === 'voice');

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
                <Badge variant={statusVariant(idea.status)}>{idea.status}</Badge>
                {idea.authorOrganization && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Building size={10} />{idea.authorOrganization}
                  </span>
                )}
                {idea.department && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Tag size={10} />{idea.department}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Rejection reason banner — shown to employees for their own rejected ideas */}
          {showRejectionBanner && idea.rejectionReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500 shrink-0" />
                <h3 className="text-sm font-bold text-red-700">Rejected — Reviewer Feedback</h3>
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
          {showRejectionBanner && !idea.rejectionReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500 shrink-0" />
                <span className="text-sm font-semibold text-red-700">Idea Rejected</span>
              </div>
              <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <RefreshCw size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">We are working on a resubmission feature. Stay tuned!</p>
              </div>
            </div>
          )}

          {/* AI Insights Section */}
            {idea.aiSummary && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-brand-blue/5 to-purple-50 border border-brand-blue/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-brand-blue/10 text-brand-blue">
                    <Lightbulb size={14} />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-blue">AI Summary</h3>
                </div>
                <p className="text-sm font-medium text-brand-black leading-relaxed italic">
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

            {/* Author block */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="h-9 w-9 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-sm shrink-0">
                {displayName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-black">{displayName}</p>
                <p className="text-xs text-gray-400">{idea.authorOrganization || 'No organization'}</p>
              </div>
              <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={11} />
                {new Date(idea.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Problem Description */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Problem Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-red-50/50 border border-red-100 rounded-lg p-3">
                {problem || '—'}
              </p>
            </div>

            {/* Proposed Solution */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Proposed Solution</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-green-50/50 border border-green-100 rounded-lg p-3">
                {solution || '—'}
              </p>
            </div>

            {/* Expected Impact */}
            {idea.expectedImpact && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Expected Impact</h3>
                <p className="text-sm text-gray-700 leading-relaxed bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                  {idea.expectedImpact}
                </p>
              </div>
            )}

            {/* Extra template-specific fields */}
            {extraFields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {extraFields.map(f => {
                  const val = idea.extra?.[f.id];
                  if (!val) return null;
                  if (f.type === 'url') return (
                    <div key={f.id}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{f.label}</h3>
                      <a href={val} target="_blank" rel="noreferrer" className="text-brand-blue text-sm flex items-center gap-1 hover:underline">
                        <LinkIcon size={12} />View Link
                      </a>
                    </div>
                  );
                  return (
                    <div key={f.id}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{f.label}</h3>
                      <p className="text-sm text-gray-700">{val}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Supporting link */}
            {idea.supportingLink && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Supporting Link</h3>
                <a href={idea.supportingLink} target="_blank" rel="noreferrer"
                  className="text-brand-blue text-sm flex items-center gap-1 hover:underline">
                  <Paperclip size={12} />View Attachment
                </a>
              </div>
            )}

            {/* File Attachments */}
            {fileAttachments.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Attached Files</h3>
                <div className="space-y-2">
                  {fileAttachments.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                      <FileText size={16} className="text-brand-blue shrink-0" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setViewingFile(f)}
                        className="text-brand-blue hover:underline text-xs flex items-center gap-1"
                      >
                        <Eye size={12} />View
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDownload(e, api.getFileUrl(f.url), f.name)} 
                        className="text-brand-blue hover:underline text-xs flex items-center gap-1"
                      >
                        <Download size={12} />Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Notes */}
            {voiceNotes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Voice Notes</h3>
                <div className="space-y-2">
                  {voiceNotes.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-purple-50/50 border border-purple-100">
                      <Mic size={16} className="text-purple-600 shrink-0" />
                      <audio controls src={api.getFileUrl(v.url)} className="h-8 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Superadmin Assign panel */}
            {viewType === 'superadmin' && orgAdmins?.length > 0 && (
              <div className="p-4 rounded-xl bg-gray-50 border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Assign Reviewer</h3>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-300 rounded-lg text-sm p-2 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    value={selectedAdmins?.[idea.id] || ''}
                    onChange={e => onAdminSelect?.(idea.id, e.target.value)}
                  >
                    <option value="">Select Org Admin...</option>
                    {orgAdmins.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}{a.organization ? ` (${a.organization})` : ''}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" className="shrink-0" onClick={() => { onAction?.(idea.id); onClose(); }}>
                    <UserCheck size={14} className="mr-1" />Assign
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer action buttons */}
          {(viewType === 'orgAdmin' || viewType === 'superadmin') && (
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 font-semibold gap-1.5"
                onClick={() => handleRejectClick(idea.id, viewType === 'orgAdmin' ? 'orgAdmin' : 'superadmin')}
              >
                <XCircle size={15} />Reject
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold gap-1.5"
                onClick={() => {
                  if (viewType === 'orgAdmin') onAction?.(idea.id, 'Approved');
                  else onDirectAction?.(idea.id, 'Approved');
                  onClose();
                }}
              >
                <CheckCircle2 size={15} />Approve
              </Button>
            </div>
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
      {rejectModalOpen && (
        <RejectReasonModal
          ideaTitle={idea.title}
          onConfirm={handleRejectConfirm}
          onCancel={() => { setRejectModalOpen(false); setPendingRejectTarget(null); }}
        />
      )}
    </div>
  );

  // Render into document.body so fixed positioning & centering are never affected
  // by any parent transform/overflow CSS
  return ReactDOM.createPortal(modal, document.body);
}

// ─── Single Idea Card ──────────────────────────────────────────────────────
function IdeaCard({ idea, viewType, currentUser, onAction, orgAdmins, selectedAdmins, onAdminSelect, onDirectAction, templates }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [pendingRejectVia, setPendingRejectVia] = useState(null);

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
            <div className="h-7 w-7 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-xs shrink-0">
              {displayName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-brand-black truncate">{displayName}</span>
            {idea.authorOrganization && !isOwn && viewType !== 'community' && (
              <span className="text-xs text-gray-400 hidden sm:block truncate">• {idea.authorOrganization}</span>
            )}
          </div>
          <Badge variant={statusVariant(idea.status)} className="shrink-0 text-xs">{idea.status}</Badge>
        </div>

        {/* Card Body */}
        <div className="px-4 pb-3 flex-1 space-y-3">
          {/* AI Summary (Top of card content) */}
          {idea.aiSummary && (
            <div className="p-2.5 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-blue mb-1 flex items-center gap-1">
                <Lightbulb size={10} /> AI Summary
              </p>
              <p className="text-xs font-semibold text-brand-black leading-snug line-clamp-2 italic">
                "{idea.aiSummary}"
              </p>
            </div>
          )}
          <h3 className="font-bold text-brand-black text-base leading-snug group-hover:text-brand-blue transition-colors line-clamp-2">
            {idea.title}
          </h3>
        </div>

        {/* Card Footer */}
        <div className="px-4 py-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {/* Upvote button */}
              {currentUser && idea.authorId !== currentUser.id && (
                <button
                  type="button"
                  disabled={upvoteLoading}
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
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all ${hasUpvoted ? 'bg-brand-blue text-white border-brand-blue shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-brand-blue hover:text-brand-blue shadow-sm'}`}
                >
                  <ThumbsUp size={14} className={hasUpvoted ? 'fill-white' : ''} />
                  {upvoteCount > 0 && <span className="font-semibold">{upvoteCount}</span>}
                </button>
              )}
              {/* Show count only for own ideas or logged out */}
              {(!currentUser || idea.authorId === currentUser.id) && upvoteCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium px-2 py-1">
                  <ThumbsUp size={14} />{upvoteCount}
                </span>
              )}
            </div>

              {/* OrgAdmin buttons — single row */}
              {viewType === 'orgAdmin' && (
                <div className="flex gap-2" onClick={e => e.preventDefault()} onPointerDown={e => e.stopPropagation()}>
                  <Button size="sm" variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs py-1 h-auto font-semibold gap-1"
                    onClick={e => { e.stopPropagation(); setPendingRejectVia('orgAdmin'); setRejectModalOpen(true); }}>
                    <XCircle size={13} />Reject
                  </Button>
                  <Button size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-auto font-semibold gap-1"
                    onClick={e => { e.stopPropagation(); onAction?.(idea.id, 'Approved'); }}>
                    <CheckCircle2 size={13} />Approve
                  </Button>
                </div>
              )}
            </div>

            {/* Superadmin — two-row layout for assign + approve/reject */}
            {viewType === 'superadmin' && (
              <div className="mt-2 space-y-2" onClick={e => e.preventDefault()} onPointerDown={e => e.stopPropagation()}>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-300 rounded-md text-xs p-1.5 focus:border-brand-blue"
                    value={selectedAdmins?.[idea.id] || ''}
                    onChange={e => onAdminSelect?.(idea.id, e.target.value)}
                  >
                    <option value="">Assign to...</option>
                    {orgAdmins?.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}{a.organization ? ` (${a.organization})` : ''}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" className="text-xs py-1 h-auto shrink-0" onClick={e => { e.stopPropagation(); onAction?.(idea.id); }}>
                    Assign
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50 text-xs py-1 h-auto font-semibold gap-1"
                    onClick={e => { e.stopPropagation(); onDirectAction?.(idea.id, 'Approved'); }}>
                    <CheckCircle2 size={13} />Approve
                  </Button>
                  <Button size="sm" variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-xs py-1 h-auto font-semibold gap-1"
                    onClick={e => { e.stopPropagation(); setPendingRejectVia('superadmin'); setRejectModalOpen(true); }}>
                    <XCircle size={13} />Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
      </div>

      {rejectModalOpen && (
        <RejectReasonModal
          ideaTitle={idea.title}
          onConfirm={(reason) => {
            setRejectModalOpen(false);
            if (pendingRejectVia === 'orgAdmin') onAction?.(idea.id, 'Rejected', reason);
            else onDirectAction?.(idea.id, 'Rejected', reason);
          }}
          onCancel={() => { setRejectModalOpen(false); setPendingRejectVia(null); }}
        />
      )}

      {/* Detail Modal — via portal, always centered */}
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

  if (parsedIdeas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 bg-white">
        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-brand-black">No ideas found</h3>
        <p className="text-sm">There are currently no ideas to display in this view.</p>
      </div>
    );
  }

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

          {/* Status filter chips */}
          {allStatuses.length > 2 && (
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

      {/* ── No results state ────────────────────────────────────────── */}
      {filteredIdeas.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400 bg-white">
          <Search className="mx-auto h-10 w-10 text-gray-200 mb-3" />
          <h3 className="text-base font-semibold text-gray-600 mb-1">No results found</h3>
          <p className="text-sm">Try adjusting your search or clearing the status filter.</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
            className="mt-3 text-xs font-semibold text-brand-blue hover:underline"
          >
            Clear all filters
          </button>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
