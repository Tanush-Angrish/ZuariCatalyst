import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ChevronDown, ChevronUp, X,
  Building, Tag, CheckCircle2, XCircle,
  Calendar, Paperclip, Link as LinkIcon, UserCheck,
  Download, Eye, Mic
} from 'lucide-react';

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
  const templateDef = (templates || []).find(t => t.id === idea.extra?._templateId);
  const fields = templateDef?.fields ?? [];

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
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline text-xs flex items-center gap-1">
                      <Eye size={12} />View
                    </a>
                    <a href={f.url} download className="text-brand-blue hover:underline text-xs flex items-center gap-1">
                      <Download size={12} />Download
                    </a>
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
                    <audio controls src={v.url} className="h-8 flex-1" />
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
                  {orgAdmins.map(a => <option key={a.id} value={a.id}>{a.name} ({a.organization})</option>)}
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
              onClick={() => {
                if (viewType === 'orgAdmin') onAction?.(idea.id, 'Rejected');
                else onDirectAction?.(idea.id, 'Rejected');
                onClose();
              }}
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
    </div>
  );

  // Render into document.body so fixed positioning & centering are never affected
  // by any parent transform/overflow CSS
  return ReactDOM.createPortal(modal, document.body);
}

// ─── Single Idea Card ──────────────────────────────────────────────────────
function IdeaCard({ idea, viewType, currentUser, onAction, orgAdmins, selectedAdmins, onAdminSelect, onDirectAction, templates }) {
  const [modalOpen, setModalOpen] = useState(false);

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
            {idea.authorOrganization && !isOwn && (
              <span className="text-xs text-gray-400 hidden sm:block truncate">• {idea.authorOrganization}</span>
            )}
          </div>
          <Badge variant={statusVariant(idea.status)} className="shrink-0 text-xs">{idea.status}</Badge>
        </div>

        {/* Card Body */}
        <div className="px-4 pb-3 flex-1 space-y-3">
          <h3 className="font-bold text-brand-black text-base leading-snug group-hover:text-brand-blue transition-colors line-clamp-2">
            {idea.title}
          </h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {templateName && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-brand-blue rounded-full px-2 py-0.5 border border-blue-100">
                <Tag size={9} />{templateName}
              </span>
            )}
            {idea.department && (
              <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                <Building size={9} />{idea.department}
              </span>
            )}
          </div>

          {/* Problem — stopPropagation only on interactive elements inside */}
          {problem && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Problem</p>
              <ReadMoreText text={problem} />
            </div>
          )}

          {/* Solution */}
          {solution && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Solution</p>
              <ReadMoreText text={solution} />
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
          <span className="text-xs text-gray-400">
            {new Date(idea.createdAt).toLocaleDateString()}
          </span>

          {/* Action buttons — absorb click so card doesn't open modal */}
          <div
            className="flex gap-2"
            onClick={e => e.preventDefault()}
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Superadmin */}
            {viewType === 'superadmin' && (
              <>
                <select
                  className="border border-gray-300 rounded-md text-xs p-1.5 focus:border-brand-blue max-w-[130px]"
                  value={selectedAdmins?.[idea.id] || ''}
                  onChange={e => onAdminSelect?.(idea.id, e.target.value)}
                >
                  <option value="">Assign to...</option>
                  {orgAdmins?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <Button size="sm" className="text-xs py-1 h-auto" onClick={e => { e.stopPropagation(); onAction?.(idea.id); }}>
                  Assign
                </Button>
                <Button size="sm" variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50 text-xs py-1 h-auto"
                  onClick={e => { e.stopPropagation(); onDirectAction?.(idea.id, 'Approved'); }}>
                  ✓
                </Button>
                <Button size="sm" variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs py-1 h-auto"
                  onClick={e => { e.stopPropagation(); onDirectAction?.(idea.id, 'Rejected'); }}>
                  ✕
                </Button>
              </>
            )}

            {/* OrgAdmin */}
            {viewType === 'orgAdmin' && (
              <>
                <Button size="sm" variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs py-1 h-auto font-semibold gap-1"
                  onClick={e => { e.stopPropagation(); onAction?.(idea.id, 'Rejected'); }}>
                  <XCircle size={13} />Reject
                </Button>
                <Button size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-auto font-semibold gap-1"
                  onClick={e => { e.stopPropagation(); onAction?.(idea.id, 'Approved'); }}>
                  <CheckCircle2 size={13} />Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

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
  onDirectAction
}) {
  const { user: currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(setTemplates).catch(console.error);
  }, []);

  const parsedIdeas = useMemo(() =>
    ideas.map(idea => ({
      ...idea,
      extra: typeof idea.extraFields === 'string'
        ? JSON.parse(idea.extraFields)
        : (idea.extraFields || {})
    }))
  , [ideas]);

  if (parsedIdeas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 bg-white">
        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-brand-black">No ideas found</h3>
        <p className="text-sm">There are currently no ideas to display in this view.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in-up">
      {parsedIdeas.map(idea => (
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
  );
}
