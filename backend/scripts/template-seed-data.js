// Hardcoded template definitions for one-time seed migration into the database.
// After first run, the Super Admin manages templates from the UI.

const baseFields = [
  { id: 'title', label: 'Title', type: 'text', required: true },
  { id: 'department', label: 'Department', type: 'select', options: ['HR', 'IT', 'Finance', 'Operations', 'Engineering', 'Manufacturing', 'Procurement', 'Sales'], required: true },
  { id: 'problemDescription', label: 'Problem Description', type: 'textarea', required: true },
  { id: 'proposedSolution', label: 'Proposed Solution', type: 'textarea', required: true },
  { id: 'expectedImpact', label: 'Estimated Benefit / Impact', type: 'textarea', required: true },
  { id: 'attachment', label: 'Attachment', type: 'file', required: false },
  { id: 'referenceLink', label: 'Reference Link', type: 'url', required: false },
];

const IDEA_TEMPLATES = [
  {
    id: 'general-process-improvement',
    category: 'GENERAL',
    name: 'Process Improvement Idea',
    description: 'Suggest improvements to existing workflows or business processes.',
    fields: [
      ...baseFields,
      { id: 'currentProcess', label: 'Current Process Details', type: 'textarea', required: true },
      { id: 'timeSaved', label: 'Estimated Time Saved (Hours/Week)', type: 'number', required: false },
    ]
  },
  {
    id: 'general-tool-request',
    category: 'GENERAL',
    name: 'Tool / Software Request',
    description: 'Request new tools, software, or licenses to improve productivity.',
    fields: [
      ...baseFields,
      { id: 'toolName', label: 'Proposed Tool/Software Name', type: 'text', required: true },
      { id: 'toolCost', label: 'Estimated Cost (₹)', type: 'number', required: false },
    ]
  },
  {
    id: 'general-cost-saving',
    category: 'GENERAL',
    name: 'Cost Saving Idea',
    description: 'Propose ideas to reduce operational or material costs.',
    fields: [
      ...baseFields,
      { id: 'costSavingCategory', label: 'Saving Category', type: 'select', options: ['Material', 'Labor', 'Energy', 'Software', 'Other'], required: true },
      { id: 'estimatedSavings', label: 'Estimated Annual Savings (₹)', type: 'number', required: true },
    ]
  },
  {
    id: 'mfg-downtime-reduction',
    category: 'MANUFACTURING',
    name: 'Production Downtime Reduction',
    description: 'Ideas to minimize machine downtime and increase OEE.',
    fields: [
      ...baseFields,
      { id: 'machineLine', label: 'Machine / Production Line', type: 'text', required: true },
      { id: 'downtimeCause', label: 'Primary Cause of Downtime', type: 'text', required: true },
    ]
  },
  {
    id: 'mfg-quality-defect',
    category: 'MANUFACTURING',
    name: 'Quality Defect Reduction',
    description: 'Propose solutions to reduce scrap and improve product quality.',
    fields: [
      ...baseFields,
      { id: 'defectType', label: 'Type of Defect', type: 'text', required: true },
      { id: 'defectRate', label: 'Current Defect Rate (%)', type: 'number', required: false },
    ]
  },
  {
    id: 'mfg-material-opt',
    category: 'MANUFACTURING',
    name: 'Material / Inventory Optimization',
    description: 'Ideas to reduce waste, optimize raw materials, or improve inventory flow.',
    fields: [
      ...baseFields,
      { id: 'materialName', label: 'Material / Component', type: 'text', required: true },
    ]
  },
  {
    id: 'epc-engineering-design',
    category: 'EPC',
    name: 'Engineering Design Improvement',
    description: 'Suggest improvements to engineering designs, drawings, or specifications.',
    fields: [
      ...baseFields,
      { id: 'projectCode', label: 'Project Code / Name', type: 'text', required: true },
      { id: 'designDiscipline', label: 'Engineering Discipline', type: 'select', options: ['Civil', 'Mechanical', 'Electrical', 'Instrumentation', 'Piping'], required: true },
    ]
  },
  {
    id: 'epc-procurement-vendor',
    category: 'EPC',
    name: 'Procurement / Vendor Improvement',
    description: 'Ideas related to vendor sourcing, procurement workflows, or logistics.',
    fields: [
      ...baseFields,
      { id: 'vendorName', label: 'Vendor Name (if applicable)', type: 'text', required: false },
    ]
  },
  {
    id: 'epc-construction-method',
    category: 'EPC',
    name: 'Construction Method Statement Idea',
    description: 'Propose safer, faster, or more efficient construction methods.',
    fields: [
      ...baseFields,
      { id: 'siteLocation', label: 'Site / Location', type: 'text', required: true },
    ]
  },
  {
    id: 'excel-report-auto',
    category: 'EXCEL AUTOMATION',
    name: 'Excel Report Automation',
    description: 'Request automation for repetitive manual Excel reports.',
    fields: [
      ...baseFields,
      { id: 'reportName', label: 'Report Name', type: 'text', required: true },
      { id: 'frequency', label: 'Current Frequency', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'Quarterly'], required: true },
      { id: 'manualHours', label: 'Manual Hours Spent per Run', type: 'number', required: true },
    ]
  },
  {
    id: 'excel-formula-fix',
    category: 'EXCEL AUTOMATION',
    name: 'Excel Formula / Calculation Fix',
    description: 'Get help fixing complex formulas or optimizing heavy calculations.',
    fields: [
      ...baseFields,
      { id: 'formulaIssue', label: 'Describe the Formula Issue', type: 'textarea', required: true },
    ]
  },
  {
    id: 'excel-dashboard-req',
    category: 'EXCEL AUTOMATION',
    name: 'Excel Dashboard Request',
    description: 'Request a visual interactive dashboard built from raw data.',
    fields: [
      ...baseFields,
      { id: 'dataSource', label: 'Data Source(s)', type: 'text', required: true },
      { id: 'keyMetrics', label: 'Key Metrics to Display', type: 'textarea', required: true },
    ]
  }
];

module.exports = { IDEA_TEMPLATES };
