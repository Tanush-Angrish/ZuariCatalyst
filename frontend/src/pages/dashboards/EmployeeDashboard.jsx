import React, { useState, useRef } from 'react';
import { api } from '../../services/api';

import { useAuth } from '../../context/AuthContext';
import { useTour } from '../../context/TourContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Send, FileText, ArrowLeft, Lightbulb, Boxes, Building, FileSpreadsheet,
  Mic, Square, Trash2, Paperclip, Sparkles, Loader2, X, MicOff
} from 'lucide-react';

const CATEGORY_ICONS = {
  'GENERAL': Lightbulb,
  'MANUFACTURING': Boxes,
  'EPC': Building,
  'EXCEL AUTOMATION': FileSpreadsheet
};

// ─── Voice Recorder Component ──────────────────────────────────────────────
function VoiceRecorder({ onRecorded, existingUrl, onRemove }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(existingUrl || null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        try {
          const fd = new FormData();
          fd.append('voice', blob, 'voice-note.webm');
          const data = await api.uploadVoice(fd);
          setAudioUrl(data.url);

          onRecorded(data);
        } catch (err) {
          console.error('Voice upload error:', err);
          alert('Failed to upload voice note');
        } finally {
          setUploading(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied. Please allow microphone access to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="space-y-2">
      {!audioUrl ? (
        <div className="flex items-center gap-3">
          {recording ? (
            <>
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />Recording...
              </div>
              <Button type="button" size="sm" variant="outline" onClick={stopRecording}
                className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5">
                <Square size={13} />Stop
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={startRecording} className="gap-1.5" disabled={uploading}>
              <Mic size={14} />{uploading ? 'Uploading...' : 'Record Voice Note'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 border">
          <audio controls src={api.getFileUrl(audioUrl)} className="h-8 flex-1" />
          <button type="button" onClick={() => { setAudioUrl(null); onRemove?.(); }} className="text-red-400 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AI Autofill Bar ───────────────────────────────────────────────────────
function AIAutofillBar({ fields, onAutofill, onClose }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceSupported] = useState(() => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // ── Voice-to-text via Web Speech API (if available) ──
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setText(prev => prev ? prev + ' ' + transcript : transcript);
        setIsVoiceRecording(false);
      };
      recognition.onerror = () => setIsVoiceRecording(false);
      recognition.onend = () => setIsVoiceRecording(false);
      recognition.start();
      setIsVoiceRecording(true);
    } else {
      // Fallback: use MediaRecorder + alert that transcription is not available in this browser
      alert('Voice-to-text is not supported in this browser. Please type your idea instead.');
    }
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsVoiceRecording(false);
  };

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    await onAutofill(text.trim());
    setLoading(false);
    // Don't close — let user see results and then decide to collapse
  };

  return (
    <div className="animate-ai-bar mb-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/10">
            <Sparkles size={16} className="text-blue-600" />
          </div>
          <div>
            <span className="text-sm font-bold text-blue-900">Fill with AI</span>
            <p className="text-[11px] text-blue-500 leading-none mt-0.5">Describe your idea and AI will fill the form</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-blue-300 hover:text-blue-600 hover:bg-blue-100 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Input Bar */}
      <div className="px-5 pb-4">
        <div className="relative flex items-end gap-2 bg-white rounded-xl border border-blue-200 shadow-sm px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            id="ai-fill-box"
            ref={textareaRef}
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed min-h-[48px] max-h-[160px]"
            placeholder="Describe your idea in plain language... e.g. 'We need a system to reduce paperwork in procurement by digitizing approval workflows'..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            rows={2}
            disabled={loading}
            autoFocus
          />
          <div className="flex items-center gap-1.5 shrink-0 self-end pb-0.5">
            {/* Voice input button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={isVoiceRecording ? stopVoiceInput : startVoiceInput}
                disabled={loading}
                className={`p-2 rounded-lg transition-colors ${isVoiceRecording
                    ? 'bg-red-100 text-red-500 animate-pulse'
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                title={isVoiceRecording ? 'Stop recording' : 'Voice input'}
              >
                {isVoiceRecording ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
            )}
            {/* Send button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() || loading}
              className={`p-2 rounded-lg transition-all ${text.trim() && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              title="Fill form with AI"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
        </div>

        {isVoiceRecording && (
          <div className="flex items-center gap-2 mt-2 text-xs text-red-500 font-medium pl-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            Listening... speak now
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI Loader Overlay ─────────────────────────────────────────────────────
function AILoader() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Sparkles size={18} className="absolute inset-0 m-auto text-blue-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">AI is filling your form...</p>
          <p className="text-xs text-gray-400 mt-0.5">AI is analysing your idea</p>
        </div>
      </div>
    </div>
  );
}


// ─── Main Component ────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notify } = useNotifications();

  // Wizard State
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIFilling, setIsAIFilling] = useState(false);
  const [formData, setFormData] = useState({});
  // uploadedFiles: { [fieldId]: [{ name, url, type, ... }] }
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [voiceNote, setVoiceNote] = useState(null);

  // AI Bar State
  const [showAIBar, setShowAIBar] = useState(false);


  // Template Access State
  const [allowedTemplates, setAllowedTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [categories, setCategories] = useState([]);

  // Limits State
  const [limits, setLimits] = useState({ submittedCount: 0, draftCount: 0 });

  React.useEffect(() => {
    if (user?.id) {
      api.getIdeaLimits(user.id).then(setLimits).catch(console.error);
    }
  }, [user]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getTemplates();
        const allTemplates = data.templates || [];

        if (!Array.isArray(allTemplates)) return;

        // ── Admin in Employee view: see ALL templates ─────────────────────────
        // If this user's full roles include Org Admin or Central Team (Superadmin),
        // they are using the Employee view to submit ideas — give them access to
        // every template in the system, unrestricted.
        const userRoles = Array.isArray(user?.roles) ? user.roles : [];
        const isAdminInEmployeeView = userRoles.some(r => r === 'Org Admin' || r === 'Superadmin');

        if (isAdminInEmployeeView) {
          setAllowedTemplates(allTemplates);
          const cats = [...new Set(allTemplates.map(t => t.category).filter(Boolean))];
          setCategories(cats);
          return;
        }

        // ── Regular Employee: filter by org-level template access ─────────────
        const accessData = await api.getTemplateAccess();
        if (!Array.isArray(accessData)) return;

        const allowedIds = new Set();
        accessData.forEach(a => {
          if (a.hasAccess) {
            if (a.organization === 'ALL' || a.organization === user.organization) {
              allowedIds.add(a.templateId);
            }
          }
        });

        const filtered = allTemplates.filter(t => allowedIds.has(t.id));
        setAllowedTemplates(filtered);
        const cats = [...new Set(filtered.map(t => t.category).filter(Boolean))];
        setCategories(cats);
      } catch (e) {
        console.error('Failed to fetch templates', e);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    // Admins in Employee view don't need an organization to load templates
    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const isAdminInEmployeeView = userRoles.some(r => r === 'Org Admin' || r === 'Superadmin');
    if (isAdminInEmployeeView || user?.organization) fetchData();
    else setIsLoadingTemplates(false);
  }, [user]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    const initial = {};
    template.fields.forEach(f => {
      if (f.type !== 'file' && f.type !== 'voice') initial[f.id] = '';
    });
    setFormData(initial);
    setUploadedFiles({});
    setVoiceNote(null);
    setShowAIBar(false);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedTemplate(null);
    setFormData({});
    setUploadedFiles({});
    setVoiceNote(null);
    setShowAIBar(false);
  };

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  // ── AI Autofill handler ────────────────────────────────────────────────
  const handleAIAutofill = async (description) => {
    if (!selectedTemplate) return;

    // Build simple field descriptors for the API
    const fieldsPayload = selectedTemplate.fields
      .filter(f => !['file', 'voice'].includes(f.type))
      .map(f => ({ id: f.id, label: f.label, type: f.type, options: f.options || [] }));

    setIsAIFilling(true);
    try {
      const data = await api.autofillIdea(description, fieldsPayload);
      const filled = data.fields || {};

      const filledCount = Object.keys(filled).length;

      // Merge AI values into form state, never overwrite existing user edits for filled fields
      setFormData(prev => ({ ...prev, ...filled }));

      if (filledCount > 0) {
        notify({ type: 'success', title: 'Form filled!', message: `AI filled ${filledCount} field${filledCount > 1 ? 's' : ''}. Review and edit as needed.`, event: '' });
      } else {
        notify({ type: 'warning', title: 'No fields filled', message: 'AI could not extract enough info. Try describing your idea in more detail.', event: '' });
      }
    } catch (e) {
      console.error(e);
      notify({ type: 'error', title: 'AI fill failed', message: 'Could not connect to AI. Please fill the form manually.', event: '' });
    }
    setIsAIFilling(false);
  };

  // Supports multiple files per field — each file is uploaded separately and appended
  const handleFileUpload = async (fieldId, e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    for (const file of selectedFiles) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const data = await api.uploadFile(fd);
        // Store file under fieldId key for clean per-field tracking
        setUploadedFiles(prev => ({
          ...prev,
          [fieldId]: [...(prev[fieldId] || []), { ...data, name: file.name }]
        }));
      } catch (err) {
        console.error('Upload Error:', err);
        alert(`File upload failed: ${file.name} — ${err.message}`);
      }
    }
    // Reset the input so the same file can be re-added if removed
    e.target.value = '';
  };

  const handleRemoveFile = (fieldId, idx) => {
    setUploadedFiles(prev => {
      const updated = [...(prev[fieldId] || [])].filter((_, i) => i !== idx);
      return { ...prev, [fieldId]: updated };
    });
  };

  const handleSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault();
    if (!selectedTemplate) return;
    setIsSubmitting(true);

    const systemFields = ['title', 'department'];
    const extraFields = { _templateId: selectedTemplate.id, _templateName: selectedTemplate.name };

    const payload = {
      authorId: user.id,
      description: '',
      expectedImpact: '',
      supportingLink: formData.referenceLink || '',
      isDraft
    };

    if (formData.problemDescription && formData.proposedSolution) {
      payload.description = `Problem:\n${formData.problemDescription}\n\nSolution:\n${formData.proposedSolution}`;
    } else {
      payload.description = `Submitted via ${selectedTemplate.name}`;
    }

    payload.expectedImpact = formData.expectedImpact || 'N/A';

    Object.keys(formData).forEach(key => {
      if (systemFields.includes(key)) {
        payload[key] = formData[key];
      } else if (key !== 'referenceLink' && key !== 'expectedImpact') {
        extraFields[key] = formData[key];
      }
    });

    payload.extraFields = extraFields;
    // Collect ALL files from all fields + voice note
    const allFiles = Object.values(uploadedFiles).flat();
    if (voiceNote) allFiles.push(voiceNote);
    payload.files = allFiles;

    try {
      await api.submitIdea(payload);
      if (isDraft) {
        notify({ type: 'success', title: 'Draft Saved', message: 'Your idea has been saved as a draft.', event: '' });
      } else {
        notify({ type: 'success', title: 'Idea submitted!', message: 'Your idea has been sent for review.', event: 'idea_submitted' });
      }
      setFormData({});
      setSelectedTemplate(null);
      setUploadedFiles({});
      setVoiceNote(null);
      setStep(1);
      navigate('/dashboard/my-ideas');
    } catch (e) {
      console.error(e);
      notify({ type: 'error', title: isDraft ? 'Draft save failed' : 'Submission failed', message: e.message, event: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = (e) => handleSubmit(e, true);


  const inputClass = 'w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue transition-colors';

  const renderField = (field) => {
    const value = formData[field.id];
    switch (field.type) {
      case 'textarea':
        return (
          <textarea required={field.required} value={value || ''} onChange={e => handleChange(field.id, e.target.value)}
            rows="4" className={inputClass} placeholder={`Enter ${field.label.toLowerCase()}...`} />
        );
      case 'url':
        return (
          <input type="url" value={value || ''} onChange={e => handleChange(field.id, e.target.value)}
            className={inputClass} placeholder="https://..." />
        );
      case 'select':
        return (
          <select required={field.required} value={value || ''} onChange={e => handleChange(field.id, e.target.value)} className={inputClass}>
            <option value="">Select {field.label}...</option>
            {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'number':
        return (
          <input type="number" required={field.required} value={value || ''} onChange={e => handleChange(field.id, e.target.value)}
            className={inputClass} placeholder={`Enter ${field.label.toLowerCase()}`} />
        );
      case 'date':
        return (
          <input type="date" required={field.required} value={value || ''} onChange={e => handleChange(field.id, e.target.value)}
            className={inputClass} />
        );
      case 'file': {
        const fieldFiles = uploadedFiles[field.id] || [];
        return (
          <div className="space-y-2">
            {/* File input — multiple allowed */}
            <label className="flex items-center gap-2 cursor-pointer w-full border border-gray-300 rounded-md bg-gray-50 overflow-hidden hover:border-brand-blue transition-colors">
              <span className="shrink-0 py-2 px-4 bg-brand-blue text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                {fieldFiles.length === 0 ? 'Choose Files' : 'Add More'}
              </span>
              <span className="text-sm text-gray-400 px-2 truncate">
                {fieldFiles.length === 0 ? 'No files selected' : `${fieldFiles.length} file${fieldFiles.length > 1 ? 's' : ''} selected`}
              </span>
              <input
                type="file"
                multiple
                onChange={e => handleFileUpload(field.id, e)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt"
                className="hidden"
              />
            </label>

            {/* File list */}
            {fieldFiles.length > 0 && (
              <ul className="space-y-1.5">
                {fieldFiles.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-green-800 bg-green-50 border border-green-100 rounded-md px-3 py-1.5">
                    <Paperclip size={12} className="shrink-0 text-green-500" />
                    <span className="flex-1 truncate">{f.name || f.url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(field.id, idx)}
                      className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                      title="Remove file"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }
      case 'voice':
        return (
          <VoiceRecorder
            onRecorded={(data) => { setVoiceNote(data); setFormData(prev => ({ ...prev, [field.id]: data.url })); }}
            existingUrl={api.getFileUrl(voiceNote?.url)}
            onRemove={() => { setVoiceNote(null); setFormData(prev => ({ ...prev, [field.id]: '' })); }}
          />
        );
      default:
        return (
          <input type="text" required={field.required} value={value || ''} onChange={e => handleChange(field.id, e.target.value)}
            className={inputClass} placeholder={`Enter ${field.label.toLowerCase()}`} />
        );
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Disclaimer Marquee */}
      <style>{`
        @keyframes continuous-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-continuous-marquee {
          display: flex;
          width: max-content;
          animation: continuous-marquee 20s linear infinite;
        }
      `}</style>
      <div className="-mt-4 md:-mt-8 -mx-4 md:-mx-8 mb-8 bg-[#dc2626] text-white font-bold text-[13px] sm:text-[14px] tracking-wide py-1.5 shadow-sm overflow-hidden flex items-center relative z-10 border-b border-red-800">
        <div className="animate-continuous-marquee">
          {/* First Block */}
          <div className="flex shrink-0 px-2 items-center">
            <span>🚨 This platform is a digital suggestion box only. NOT for emergency use!</span>
            <span className="mx-6 text-red-300/60 font-normal">|</span>
            <span>🚨 यह प्लेटफ़ॉर्म केवल सुझाव बॉक्स है। आपातकालीन उपयोग के लिए नहीं!</span>
            <span className="mx-6 text-red-300/60 font-normal">|</span>
          </div>
          {/* Second Block (Duplicate) */}
          <div className="flex shrink-0 px-2 items-center">
            <span>🚨 This platform is a digital suggestion box only. NOT for emergency use!</span>
            <span className="mx-6 text-red-300/60 font-normal">|</span>
            <span>🚨 यह प्लेटफ़ॉर्म केवल सुझाव बॉक्स है। आपातकालीन उपयोग के लिए नहीं!</span>
            <span className="mx-6 text-red-300/60 font-normal">|</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-black">Submit New Idea</h1>
          <p className="text-gray-500 mt-1">Share your innovative ideas to improve the organization.</p>
        </div>

        {/* Limits Display */}
        <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm shrink-0 divide-x divide-gray-100 overflow-hidden">
          <div className="flex flex-col items-center px-4 py-2.5 bg-gray-50/50">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Monthly Subm.</span>
            <span className={`text-[17px] font-extrabold ${limits.submittedCount >= 5 ? 'text-red-500' : 'text-brand-blue'}`}>
              {limits.submittedCount} <span className="text-gray-400 text-sm font-medium">/ 5</span>
            </span>
          </div>
          <div className="flex flex-col items-center px-4 py-2.5 bg-gray-50/50">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Saved Drafts</span>
            <span className={`text-[17px] font-extrabold ${limits.draftCount >= 3 ? 'text-amber-500' : 'text-brand-blue'}`}>
              {limits.draftCount} <span className="text-gray-400 text-sm font-medium">/ 3</span>
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: SELECT TEMPLATE */}
      {step === 1 && (
        <div className="space-y-6">
          <p className="text-sm font-medium text-gray-700">Step 1: Select a template category that best fits your idea</p>

          {isLoadingTemplates ? (
            <div className="py-8 text-center text-gray-500">Loading templates...</div>
          ) : allowedTemplates.length === 0 ? (
            <div className="py-8 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <Boxes className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-700">No Templates Available</h3>
              <p className="text-sm mt-1">Your organization currently does not have access to any idea templates. Please contact the Central Team.</p>
            </div>
          ) : (
            categories.map(category => {
              const CatIcon = CATEGORY_ICONS[category] || FileText;
              const categoryTemplates = allowedTemplates.filter(t => t.category === category);
              if (categoryTemplates.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h2 className="text-lg font-bold text-brand-black flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-gray-100 text-brand-blue"><CatIcon size={16} /></span>
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTemplates.map((template, tIdx) => (
                      <Card
                        key={template.id}
                        id={`template-card-${category === categories[0] && tIdx === 0 ? '0' : template.id}`}
                        className="cursor-pointer hover:border-brand-blue hover:shadow-md transition duration-200 border-gray-200"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-brand-blue leading-tight truncate" title={template.name}>
                            {template.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-500 line-clamp-2" title={template.description}>
                            {template.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* STEP 2: FILL FORM */}
      {step === 2 && selectedTemplate && (
        <div className="space-y-4">
          {/* AI Autofill button (collapsed) */}
          {!showAIBar && (
            <div className="flex items-center gap-3">
              <Button
                id="ai-fill-btn"
                type="button"
                variant="outline"
                onClick={() => setShowAIBar(true)}
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 font-semibold shadow-sm"
              >
                <Sparkles size={16} className="text-blue-500" />
                Fill with AI
              </Button>
              <span className="text-xs text-gray-400">Describe your idea and AI will fill the form automatically</span>
            </div>
          )}

          {/* AI Input Bar (expanded) */}
          {showAIBar && (
            <AIAutofillBar
              fields={selectedTemplate.fields}
              onAutofill={handleAIAutofill}
              onClose={() => setShowAIBar(false)}
            />
          )}

          <Card className="border-t-4 border-t-brand-blue shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-brand-blue" /> {selectedTemplate.name}
                </CardTitle>
                <CardDescription className="mt-1">{selectedTemplate.description}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleBack} className="gap-2 shrink-0">
                <ArrowLeft size={16} /> Back to Templates
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  {/* AI Loader Overlay */}
                  {isAIFilling && <AILoader />}

                  {selectedTemplate.fields.map(field => (
                    <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label className="mb-1.5 flex flex-wrap items-center gap-1 text-sm font-semibold text-gray-700">
                        {field.label}
                        {field.id === 'attachment' && <span className="text-xs text-gray-500 font-normal">/ आप फोटो खींच कर भी अपलोड कर सकते हो</span>}
                        {(field.id === 'referenceLink' || field.id === 'supportingLink') && <span className="text-xs text-gray-500 font-normal">/ आप OneDrive का लिंक भी अपलोड कर सकते हो</span>}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}

                  {/* Voice Note — always shown at bottom */}
                  <div className="md:col-span-2">
                    <label className="mb-1.5 flex flex-wrap items-center gap-1 text-sm font-semibold text-gray-700">
                      <Mic size={14} className="text-gray-400" /> Voice Note (Optional) <span className="text-xs text-gray-500 font-normal">/ आप अपनी आवाज रिकॉर्ड करके भी भेज सकते हो</span>
                    </label>
                    <VoiceRecorder
                      onRecorded={(data) => setVoiceNote(data)}
                      existingUrl={voiceNote?.url}
                      onRemove={() => setVoiceNote(null)}
                    />
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 gap-4 mt-6">
                  <p className="text-xs text-gray-500 font-medium">Required fields are marked with <span className="text-red-500">*</span></p>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSubmitting || isAIFilling || limits.draftCount >= 3}
                      className="w-full sm:w-auto font-semibold shadow-sm hover:shadow"
                      title={limits.draftCount >= 3 ? "You can only have up to 3 drafts at a time" : ""}
                    >
                      Save as Draft
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSubmitting || isAIFilling || limits.submittedCount >= 5}
                      className="w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transition-all"
                      title={limits.submittedCount >= 5 ? "You can only submit 5 ideas per month" : ""}
                    >
                      <Send className="mr-2 h-4 w-4" /> {isSubmitting ? 'Submitting...' : 'Submit Idea for Review'}
                    </Button>
                  </div>
                </div>

                {/* Block Messages below form */}
                {(limits.submittedCount >= 5 || limits.draftCount >= 3) && (
                  <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex flex-col gap-2">
                    {limits.submittedCount >= 5 && <p className="flex items-center gap-2"><X size={16} /> <strong>Submission Limit Reached:</strong> You can only submit 5 ideas per month.</p>}
                    {limits.draftCount >= 3 && <p className="flex items-center gap-2"><X size={16} /> <strong>Draft Limit Reached:</strong> You can only have up to 3 active drafts. Please submit an existing draft to free up space.</p>}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
