import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Send, FileText, ArrowLeft, Lightbulb, Boxes, Building, FileSpreadsheet } from 'lucide-react';
import { IDEA_CATEGORIES, IDEA_TEMPLATES } from '../../lib/templates';

const CATEGORY_ICONS = {
  'GENERAL': Lightbulb,
  'MANUFACTURING': Boxes,
  'EPC': Building,
  'EXCEL AUTOMATION': FileSpreadsheet
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Wizard State
  const [step, setStep] = useState(1); // 1 = Select Template, 2 = Fill Form
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  // Template Access State
  const [allowedTemplates, setAllowedTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  React.useEffect(() => {
    const fetchAccess = async () => {
      try {
        const res = await fetch('/api/templates/access');
        const accessData = await res.json();
        
        // Find which template IDs the user's organization has access to
        const allowedIds = accessData
          .filter(a => a.organization === user.organization && a.hasAccess)
          .map(a => a.templateId);

        // Filter master list
        const filtered = IDEA_TEMPLATES.filter(t => allowedIds.includes(t.id));
        setAllowedTemplates(filtered);
      } catch (e) {
        console.error('Failed to fetch template access', e);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    if (user?.organization) {
      fetchAccess();
    } else {
      setIsLoadingTemplates(false);
    }
  }, [user]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    // Initialize form data with empty strings based on template fields
    const initial = {};
    template.fields.forEach(f => {
      initial[f.id] = f.type === 'file' ? null : '';
    });
    setFormData(initial);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedTemplate(null);
    setFormData({});
  };

  const handleChange = (fieldId, value, type) => {
    if (type === 'file') {
      // For MVP file upload simulation: store the file object's name
      const file = value.target.files[0];
      setFormData(prev => ({ ...prev, [fieldId]: file ? file.name : null }));
    } else {
      setFormData(prev => ({ ...prev, [fieldId]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    
    setIsSubmitting(true);

    // Map template fields to Backend payload
    const systemFields = ['title', 'department']; // Must always match DB exactly
    const extraFields = { _templateId: selectedTemplate.id, _templateName: selectedTemplate.name };
    
    const payload = { 
      authorId: user.id,
      description: '', // Built dynamically
      expectedImpact: '', // Built dynamically
      supportingLink: formData.referenceLink || ''
    };

    // Build the description from the problem and solution
    if (formData.problemDescription && formData.proposedSolution) {
      payload.description = `Problem:\n${formData.problemDescription}\n\nSolution:\n${formData.proposedSolution}`;
    } else {
      // Fallback
      payload.description = `Submitted via ${selectedTemplate.name}`;
    }

    // Set expectedImpact
    if (formData.expectedImpact) {
      payload.expectedImpact = formData.expectedImpact;
    } else {
      payload.expectedImpact = 'N/A';
    }

    // Copy exact system fields and push rest to extraFields
    Object.keys(formData).forEach(key => {
      if (systemFields.includes(key)) {
        payload[key] = formData[key];
      } else if (key !== 'problemDescription' && key !== 'proposedSolution' && key !== 'referenceLink' && key !== 'expectedImpact') {
        extraFields[key] = formData[key];
      }
    });

    payload.extraFields = extraFields;

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFormData({});
        setSelectedTemplate(null);
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
          <div className="flex border border-gray-300 rounded-md overflow-hidden bg-gray-50">
            <input type="file" required={field.required} onChange={e => handleChange(field.id, e, 'file')}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-700 transition" />
          </div>
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
            IDEA_CATEGORIES.map(category => {
              const CatIcon = CATEGORY_ICONS[category] || FileText;
              // Filter against allowedTemplates instead of all templates
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
