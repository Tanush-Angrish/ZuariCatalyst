import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Save, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export default function TemplateAccess() {
  const [organizations, setOrganizations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [accessMap, setAccessMap] = useState({}); // { "templateId_orgName": boolean }
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch templates from API
      const tplRes = await fetch('/api/templates');
      const data = await tplRes.json();
      setTemplates(data.templates || []);

      // 2. Fetch unique organizations from Users
      const orgRes = await fetch('/api/templates/organizations');
      const orgs = await orgRes.json();
      setOrganizations(orgs);

      // 3. Fetch existing access map
      const accessRes = await fetch('/api/templates/access');
      const accessData = await accessRes.json();

      const loadedMap = {};
      accessData.forEach(record => {
        const key = `${record.templateId}_${record.organization}`;
        loadedMap[key] = record.hasAccess;
      });

      setAccessMap(loadedMap);
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error('Error fetching template access logic:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (templateId, org) => {
    const key = `${templateId}_${org}`;
    setAccessMap(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasUnsavedChanges(true);
  };

  const isAllEnabled = (templateId) => {
    return !!accessMap[`${templateId}_ALL`];
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const mapping = [];

      templates.forEach(template => {
        // Include ALL pseudo-org
        const allKey = `${template.id}_ALL`;
        mapping.push({
          templateId: template.id,
          organization: 'ALL',
          hasAccess: accessMap[allKey] || false
        });

        organizations.forEach(org => {
          const key = `${template.id}_${org}`;
          const hasAccess = accessMap[key] || false;
          mapping.push({
            templateId: template.id,
            organization: org,
            hasAccess
          });
        });
      });

      const res = await fetch('/api/templates/access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping })
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
        await fetchData();
      } else {
        const data = await res.json();
        alert('Failed to save template access: ' + data.error);
      }
    } catch (e) {
      console.error('Error saving template access', e);
    } finally {
      setIsSaving(false);
    }
  };

  const allOrgs = ['ALL', ...organizations];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-black">Template Access</h1>
          <p className="text-gray-500 mt-1">Manage which organizations can utilize specific idea templates.</p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="gap-2 shrink-0"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Apply Changes'}
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              Access Matrix
              {hasUnsavedChanges && <Badge variant="warning" className="ml-2 text-xs font-normal py-0">Unsaved Changes</Badge>}
            </CardTitle>
            <CardDescription>Rows are templates, columns are organizations. Enable "ALL" to grant universal access.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading matrix...</div>
          ) : (
            <div className="overflow-x-auto">
              {organizations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                  <AlertCircle className="w-10 h-10 mb-2 text-gray-300" />
                  <p>No organizations found.</p>
                  <p className="text-sm">Organizations will appear as columns automatically when new users are created.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-[#f8f9fc] border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="px-6 py-4 font-semibold min-w-[300px] border-r border-gray-200">
                        Template
                      </th>
                      {allOrgs.map(org => (
                        <th key={org} className={`px-6 py-4 font-semibold text-center border-r border-gray-100 last:border-r-0 ${org === 'ALL' ? 'bg-blue-50 text-brand-blue' : ''}`}>
                          {org === 'ALL' ? '🌐 ALL' : org}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {templates.map(template => {
                      const allEnabled = isAllEnabled(template.id);
                      return (
                        <tr key={template.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 border-r border-gray-200">
                            <div className="font-medium text-brand-black">{template.name}</div>
                            <div className="text-xs text-gray-500">{template.category}</div>
                          </td>
                          {allOrgs.map(org => {
                            const key = `${template.id}_${org}`;
                            const isChecked = !!accessMap[key];
                            const isDisabled = org !== 'ALL' && allEnabled;

                            return (
                              <td key={org} className={`px-6 py-4 text-center border-r border-gray-100 last:border-r-0 ${org === 'ALL' ? 'bg-blue-50/30' : ''} ${isDisabled ? 'opacity-40' : ''}`}>
                                <label className="flex items-center justify-center w-full h-full cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isDisabled ? true : isChecked}
                                    disabled={isDisabled}
                                    onChange={() => handleToggle(template.id, org)}
                                    className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue transition-all cursor-pointer disabled:cursor-not-allowed"
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
        <div className="text-sm text-brand-blue">
          <p className="font-semibold mb-1">How this works</p>
          <p>
            <strong>🌐 ALL</strong> — When enabled for a template, every organization automatically gets access (individual org checkboxes are overridden).
            <br />When "ALL" is disabled, access is controlled per organization using the checkboxes.
            <br />New organizations appear as columns automatically when new users are created. By default, new organizations have <strong>no access</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
