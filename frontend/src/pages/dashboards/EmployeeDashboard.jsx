import React, { useState, useRef } from 'react';
import { api } from '../../services/api';

import { useAuth } from '../../context/AuthContext';
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
            <p className="text-[11px] text-blue-500 leading-none mt-0.5">Describe your idea and Gemini will fill the form</p>
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
                className={`p-2 rounded-lg transition-colors ${
                  isVoiceRecording
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
              className={`p-2 rounded-lg transition-all ${
                text.trim() && !loading
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
          <p className="text-xs text-gray-400 mt-0.5">Gemini is analysing your idea</p>
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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [voiceNote, setVoiceNote] = useState(null);

  // AI Bar State
  const [showAIBar, setShowAIBar] = useState(false);

  // Template Access State
  const [allowedTemplates, setAllowedTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [categories, setCategories] = useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getTemplates();
        const allTemplates = data.templates || [];

        const accessData = await api.getTemplateAccess();


        if (!Array.isArray(allTemplates) || !Array.isArray(accessData)) return;

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
    if (user?.organization) fetchData();
    else setIsLoadingTemplates(false);
  }, [user]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    const initial = {};
    template.fields.forEach(f => {
      if (f.type !== 'file' && f.type !== 'voice') initial[f.id] = '';
    });
    setFormData(initial);
    setUploadedFiles([]);
    setVoiceNote(null);
    setShowAIBar(false);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedTemplate(null);
    setFormData({});
    setUploadedFiles([]);
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
        notify({ type: 'warning', title: 'No fields filled', message: 'Gemini could not extract enough info. Try describing your idea in more detail.', event: '' });
      }
    } catch (e) {
      console.error(e);
      notify({ type: 'error', title: 'AI fill failed', message: 'Could not connect to Gemini. Please fill the form manually.', event: '' });
    }
    setIsAIFilling(false);
  };

  const handleFileUpload = async (fieldId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const data = await api.uploadFile(fd);
      setUploadedFiles(prev => [...prev, data]);
      setFormData(prev => ({ ...prev, [fieldId]: data.url }));
    } catch (err) {
      console.error('Upload Error:', err);
      alert('File upload failed: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setIsSubmitting(true);

    const systemFields = ['title', 'department'];
    const extraFields = { _templateId: selectedTemplate.id, _templateName: selectedTemplate.name };

    const payload = {
      authorId: user.id,
      description: '',
      expectedImpact: '',
      supportingLink: formData.referenceLink || ''
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
    const allFiles = [...uploadedFiles];
    if (voiceNote) allFiles.push(voiceNote);
    payload.files = allFiles;

    try {
      await api.submitIdea(payload);
      notify({ type: 'success', title: 'Idea submitted!', message: 'Your idea has been sent for review.', event: 'idea_submitted' });
      setFormData({});
      setSelectedTemplate(null);
      setUploadedFiles([]);
      setVoiceNote(null);
      setStep(1);
      navigate('/dashboard/my-ideas');
    } catch (e) {
      console.error(e);
      notify({ type: 'error', title: 'Submission failed', message: e.message, event: '' });
    } finally {
      setIsSubmitting(false);
    }
  };


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
      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex border border-gray-300 rounded-md overflow-hidden bg-gray-50">
              <input type="file" onChange={e => handleFileUpload(field.id, e)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-700 transition" />
            </div>
            {value && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-1.5">
                <Paperclip size={13} />
                <span className="truncate">File uploaded successfully</span>
              </div>
            )}
          </div>
        );
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">Submit New Idea</h1>
        <p className="text-gray-500">Share your innovative ideas to improve the organization.</p>
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
                    {categoryTemplates.map(template => (
                      <Card
                        key={template.id}
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
                type="button"
                variant="outline"
                onClick={() => setShowAIBar(true)}
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 font-semibold shadow-sm"
              >
                <Sparkles size={16} className="text-blue-500" />
                Fill with AI
              </Button>
              <span className="text-xs text-gray-400">Describe your idea and Gemini will fill the form automatically</span>
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
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700 flex items-center gap-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}

                  {/* Voice Note — always shown at bottom */}
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Mic size={14} className="text-gray-400" /> Voice Note (Optional)
                    </label>
                    <VoiceRecorder
                      onRecorded={(data) => setVoiceNote(data)}
                      existingUrl={voiceNote?.url}
                      onRemove={() => setVoiceNote(null)}
                    />
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div className="flex justify-between items-center px-2">
                  <p className="text-xs text-gray-400">Required fields are marked with <span className="text-red-500 text-sm">*</span></p>
                  <Button type="submit" disabled={isSubmitting || isAIFilling} size="lg" className="w-full md:w-64 shadow-md hover:shadow-lg transition-all">
                    <Send className="mr-2 h-4 w-4" /> {isSubmitting ? 'Submitting...' : 'Submit Idea for Review'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
