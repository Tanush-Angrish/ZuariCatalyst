import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Send, FileText, ArrowLeft, Lightbulb, Boxes, Building, FileSpreadsheet, Mic, Square, Play, Trash2, Upload, Paperclip } from 'lucide-react';

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
        // Upload
        setUploading(true);
        try {
          const fd = new FormData();
          fd.append('voice', blob, 'voice-note.webm');
          const res = await fetch('/api/upload/voice', { method: 'POST', body: fd });
          const data = await res.json();
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

  const handleRemove = () => {
    setAudioUrl(null);
    onRemove?.();
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
          <audio controls src={audioUrl} className="h-8 flex-1" />
          <button type="button" onClick={handleRemove} className="text-red-400 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]); // { name, url, type }
  const [voiceNote, setVoiceNote] = useState(null); // { name, url, type }

  // Template Access State
  const [allowedTemplates, setAllowedTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [categories, setCategories] = useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch templates from API
        const tplRes = await fetch('/api/templates');
        const allTemplates = await tplRes.json();

        // Fetch access rules
        const accessRes = await fetch('/api/templates/access');
        const accessData = await accessRes.json();
        
        // Find which template IDs the user's org has access to, or ALL
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

        // Extract unique categories
        const cats = [...new Set(filtered.map(t => t.category))];
        setCategories(cats);
      } catch (e) {
        console.error('Failed to fetch templates', e);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    if (user?.organization) {
      fetchData();
    } else {
      setIsLoadingTemplates(false);
    }
  }, [user]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    const initial = {};
    template.fields.forEach(f => {
      if (f.type !== 'file' && f.type !== 'voice') {
        initial[f.id] = '';
      }
    });
    setFormData(initial);
    setUploadedFiles([]);
    setVoiceNote(null);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedTemplate(null);
    setFormData({});
    setUploadedFiles([]);
    setVoiceNote(null);
  };

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload = async (fieldId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload/file', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setUploadedFiles(prev => [...prev, data]);
        setFormData(prev => ({ ...prev, [fieldId]: data.url }));
      } else {
        alert('Upload failed: ' + data.error);
      }
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

    if (formData.expectedImpact) {
      payload.expectedImpact = formData.expectedImpact;
    } else {
      payload.expectedImpact = 'N/A';
    }

    Object.keys(formData).forEach(key => {
      if (systemFields.includes(key)) {
        payload[key] = formData[key];
      } else if (key !== 'referenceLink' && key !== 'expectedImpact') {
        extraFields[key] = formData[key];
      }
    });

    payload.extraFields = extraFields;

    // Compile files array (file uploads + voice note)
    const allFiles = [...uploadedFiles];
    if (voiceNote) allFiles.push(voiceNote);
    payload.files = allFiles;

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFormData({});
        setSelectedTemplate(null);
        setUploadedFiles([]);
        setVoiceNote(null);
        setStep(1);
        alert('Idea submitted successfully!');
        navigate('/dashboard/my-ideas');
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting idea');
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
            onRecorded={(data) => {
              setVoiceNote(data);
              setFormData(prev => ({ ...prev, [field.id]: data.url }));
            }}
            existingUrl={voiceNote?.url}
            onRemove={() => {
              setVoiceNote(null);
              setFormData(prev => ({ ...prev, [field.id]: '' }));
            }}
          />
        );
      default: // text
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
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
                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full md:w-64 shadow-md hover:shadow-lg transition-all">
                  <Send className="mr-2 h-4 w-4" /> {isSubmitting ? 'Submitting...' : 'Submit Idea for Review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
