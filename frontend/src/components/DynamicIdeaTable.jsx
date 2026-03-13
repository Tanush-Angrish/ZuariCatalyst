import React, { useMemo } from 'react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { IDEA_TEMPLATES } from '../lib/templates';
import { FileText } from 'lucide-react';

export default function DynamicIdeaTable({ 
  ideas, 
  viewType, 
  onAction, 
  orgAdmins, 
  selectedAdmins, 
  onAdminSelect,
  onDirectAction
}) {
  // Parse extraFields if they are strings
  const parsedIdeas = useMemo(() => {
    return ideas.map(idea => ({
      ...idea,
      extra: typeof idea.extraFields === 'string' ? JSON.parse(idea.extraFields) : (idea.extraFields || {})
    }));
  }, [ideas]);

  // Group ideas by templateId
  const ideasByTemplate = useMemo(() => {
    const groups = {};
    parsedIdeas.forEach(idea => {
      // Fallback for ideas created before templates existed
      const templateId = idea.extra?._templateId || 'legacy';
      if (!groups[templateId]) {
        groups[templateId] = [];
      }
      groups[templateId].push(idea);
    });
    return groups;
  }, [parsedIdeas]);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'destructive';
      case 'Assigned to Org Admin': return 'warning';
      default: return 'secondary';
    }
  };

  if (ideas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 bg-white">
        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-brand-black">No ideas found</h3>
        <p className="text-sm">There are currently no ideas to display in this view.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.entries(ideasByTemplate).map(([templateId, templateIdeas]) => {
        // Find template definition
        const templateDef = IDEA_TEMPLATES.find(t => t.id === templateId);
        const templateName = templateDef ? templateDef.name : 'Legacy / Uncategorized Ideas';
        const fields = templateDef ? templateDef.fields : [];

        // Determine column list based on template fields
        // Title, Department, Description, Expected Impact, and extraFields map to the template fields
        // We'll trust the template definition for the order and label of columns.

        return (
          <div key={templateId} className="space-y-4">
            <h2 className="text-xl font-bold text-brand-black flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-blue-50 text-brand-blue"><FileText size={20} /></span>
              {templateName}
            </h2>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-fade-in-up delay-100">
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] pb-2">
                <table className="text-left text-sm whitespace-nowrap" style={{ minWidth: '100%', width: 'max-content' }}>
                  <thead className="bg-[#f8f9fc] border-b border-gray-200 text-gray-600 sticky top-0 z-10">
                    <tr>
                      {/* Author Column (Except for MyIdeas) */}
                      {viewType !== 'myIdeas' && (
                        <th className="px-5 py-3 font-semibold min-w-[180px]">Author</th>
                      )}

                      {/* Template Fields */}
                      {fields.length > 0 ? (
                        fields.map(field => (
                          <th key={field.id} className="px-5 py-3 font-semibold min-w-[180px]">
                            {field.label}
                          </th>
                        ))
                      ) : (
                        // Legacy columns
                        <>
                          <th className="px-5 py-3 font-semibold min-w-[200px]">Idea Title</th>
                          <th className="px-5 py-3 font-semibold min-w-[130px]">Department</th>
                          <th className="px-5 py-3 font-semibold min-w-[300px]">Description</th>
                          <th className="px-5 py-3 font-semibold min-w-[200px]">Expected Impact</th>
                          <th className="px-5 py-3 font-semibold min-w-[130px]">Supporting Link</th>
                        </>
                      )}

                      {/* Status Column */}
                      <th className="px-5 py-3 font-semibold min-w-[130px]">Status</th>

                      {/* Specific Action / Date Columns based on ViewType */}
                      {viewType === 'myIdeas' && (
                        <th className="px-5 py-3 font-semibold text-right min-w-[130px]">Submitted</th>
                      )}
                      
                      {viewType === 'team' && (
                        <th className="px-5 py-3 font-semibold text-right min-w-[130px]">Submitted</th>
                      )}

                      {viewType === 'superadmin' && (
                        <>
                          <th className="px-5 py-3 font-semibold min-w-[280px]">Assign Reviewer</th>
                          <th className="px-5 py-3 font-semibold text-right min-w-[140px]">Decision</th>
                        </>
                      )}

                      {viewType === 'orgAdmin' && (
                        <th className="px-5 py-3 font-semibold text-right min-w-[140px]">Actions</th>
                      )}
                      
                      {viewType === 'community' && (
                        <th className="px-5 py-3 font-semibold text-right min-w-[130px]">Approved On</th>
                      )}
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-gray-100">
                    {templateIdeas.map((idea) => (
                      <tr key={idea.id} className="hover:bg-brand-blue/5 transition-colors">
                        
                        {/* Author */}
                        {viewType !== 'myIdeas' && (
                          <td className="px-5 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-xs shrink-0">
                                {(idea.authorName || '?').charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-brand-black text-sm">{idea.authorName}</div>
                                {idea.authorOrganization && <div className="text-gray-400 text-xs">{idea.authorOrganization}</div>}
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Template Field Data */}
                        {fields.length > 0 ? (
                          fields.map(field => {
                            let val = '';
                            // Map base fields to system columns, rest to extra fields
                            if (field.id === 'title') val = idea.title;
                            else if (field.id === 'department') val = idea.department;
                            else if (field.id === 'expectedImpact') val = idea.expectedImpact;
                            else if (field.id === 'referenceLink' || field.id === 'supportingLink') val = idea.supportingLink;
                            else if (field.id === 'problemDescription' || field.id === 'proposedSolution') {
                              // We aggregated problem and solution into description during MVP submission
                              // To display cleanly in dynamic table, we just split them roughly or show the full description
                              val = idea.description;
                            } else {
                              val = idea.extra[field.id];
                            }

                            // Render specific types
                            if (['url', 'referenceLink', 'supportingLink'].includes(field.id) || field.type === 'url') {
                              return (
                                <td key={field.id} className="px-5 py-4 align-top max-w-[250px] whitespace-normal break-words">
                                  {val ? <a href={val} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline text-xs">View Link</a> : <span className="text-gray-300 text-xs">—</span>}
                                </td>
                              );
                            }

                            if (field.type === 'file' || field.id === 'attachment') {
                              return (
                                <td key={field.id} className="px-5 py-4 align-top max-w-[200px] whitespace-normal break-words">
                                  {val ? <span className="text-brand-blue text-xs bg-blue-50 px-2 py-1 rounded">{val}</span> : <span className="text-gray-300 text-xs">—</span>}
                                </td>
                              );
                            }

                            return (
                              <td key={field.id} className="px-5 py-4 align-top max-w-[350px] whitespace-normal break-words text-gray-600 text-sm">
                                {val || <span className="text-gray-300">—</span>}
                              </td>
                            );
                          })
                        ) : (
                          // Legacy Field Data
                          <>
                            <td className="px-5 py-4 align-top font-medium text-brand-black max-w-[200px] whitespace-normal">{idea.title}</td>
                            <td className="px-5 py-4 align-top text-gray-600 text-sm max-w-[130px] whitespace-normal">{idea.department}</td>
                            <td className="px-5 py-4 align-top max-w-[400px] whitespace-normal border-x border-dashed border-gray-100">
                              <div className="text-gray-600 text-sm" style={{ whiteSpace: 'pre-line' }}>{idea.description}</div>
                            </td>
                            <td className="px-5 py-4 align-top max-w-[300px] whitespace-normal">
                              <div className="text-gray-600 text-sm">{idea.expectedImpact}</div>
                            </td>
                            <td className="px-5 py-4 align-top max-w-[200px] whitespace-normal break-words">
                              {idea.supportingLink ? <a href={idea.supportingLink} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline text-xs">View Link</a> : <span className="text-gray-300 text-xs">—</span>}
                            </td>
                          </>
                        )}

                        {/* Status */}
                        <td className="px-5 py-4 align-top">
                          <Badge variant={getStatusBadgeVariant(idea.status)}>{idea.status}</Badge>
                        </td>

                        {/* Specific Action / Date Columns */}
                        {viewType === 'myIdeas' && (
                          <td className="px-5 py-4 align-top text-gray-500 text-right text-xs">
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </td>
                        )}

                        {viewType === 'team' && (
                          <td className="px-5 py-4 align-top text-gray-500 text-right text-xs">
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </td>
                        )}

                        {viewType === 'community' && (
                          <td className="px-5 py-4 align-top text-gray-500 text-right text-xs">
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </td>
                        )}

                        {viewType === 'superadmin' && (
                          <>
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-center gap-2">
                                <select 
                                  className="border border-gray-300 rounded-md text-sm p-1.5 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue max-w-[150px]"
                                  value={selectedAdmins[idea.id] || ''}
                                  onChange={(e) => onAdminSelect(idea.id, e.target.value)}
                                >
                                  <option value="">Select Admin...</option>
                                  {orgAdmins.map(admin => (
                                    <option key={admin.id} value={admin.id}>{admin.name}</option>
                                  ))}
                                </select>
                                <Button size="sm" onClick={() => onAction(idea.id)} className="shrink-0 text-xs py-1 h-auto">
                                  Assign
                                </Button>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 px-3 py-1 h-auto text-xs font-semibold" 
                                  onClick={() => onDirectAction(idea.id, 'Approved')}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 px-3 py-1 h-auto text-xs font-semibold" 
                                  onClick={() => onDirectAction(idea.id, 'Rejected')}>
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </>
                        )}

                        {viewType === 'orgAdmin' && (
                          <td className="px-5 py-4 align-top text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 px-3 py-1 h-auto text-xs font-semibold" 
                                onClick={() => onAction(idea.id, 'Approved')}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 px-3 py-1 h-auto text-xs font-semibold" 
                                onClick={() => onAction(idea.id, 'Rejected')}>
                                Reject
                              </Button>
                            </div>
                          </td>
                        )}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
