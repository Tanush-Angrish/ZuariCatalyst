import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// ─── Font imports via Vite asset pipeline ─────────────────────────────────────
// Vite resolves these TTF imports to hashed, absolute-path URLs that are
// accessible from any fetch() context — this is the reliable way to embed
// local fonts in @react-pdf/renderer for Vite apps.
import NotoSansRegular        from '../assets/fonts/NotoSans-Regular.ttf';
import NotoSansBold           from '../assets/fonts/NotoSans-Bold.ttf';
import NotoSansDevanagariReg  from '../assets/fonts/NotoSansDevanagari-Regular.ttf';
import NotoSansDevanagariBold from '../assets/fonts/NotoSansDevanagari-Bold.ttf';

// ─── Register Unicode-capable fonts ───────────────────────────────────────────
Font.register({
  family: 'NotoSans',
  fonts: [
    { src: NotoSansRegular, fontWeight: 400 },
    { src: NotoSansBold,    fontWeight: 700 },
  ],
});

Font.register({
  family: 'NotoSansDevanagari',
  fonts: [
    { src: NotoSansDevanagariReg,  fontWeight: 400 },
    { src: NotoSansDevanagariBold, fontWeight: 700 },
  ],
});

// Disable hyphenation — critical for Devanagari words
Font.registerHyphenationCallback(word => [word]);

// ─── Corporate Color Palette ──────────────────────────────────────────────────
const NAVY       = '#1A2B5F';
const STEEL      = '#344467';
const BODY       = '#1F2937';
const MUTED      = '#6B7280';
const ACCENT     = '#3B5998';
const LIGHT_BG   = '#F1F4FA';
const DIVIDER    = '#D1D9EF';
const WHITE      = '#FFFFFF';
const SUCCESS_BG = '#ECFDF5';
const SUCCESS_FG = '#065F46';
const PENDING_BG = '#FFFBEB';
const PENDING_FG = '#92400E';
const REVIEW_BG  = '#EFF6FF';
const REVIEW_FG  = '#1E40AF';
const REJECT_BG  = '#FEF2F2';
const REJECT_FG  = '#991B1B';

// ─── Detect Devanagari ────────────────────────────────────────────────────────
const isDevanagari = (text) =>
  typeof text === 'string' && /[\u0900-\u097F]/.test(text);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    backgroundColor: WHITE,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },

  // Header banner
  headerBanner: { backgroundColor: NAVY, paddingVertical: 22, paddingHorizontal: 36 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  companyName:  { color: '#93C5FD', fontSize: 7.5, fontFamily: 'NotoSans', fontWeight: 700, letterSpacing: 1.5 },
  docType:      { color: '#93C5FD', fontSize: 7.5, fontFamily: 'NotoSans', letterSpacing: 1 },
  ideaTitle:    { color: WHITE, fontSize: 17, fontFamily: 'NotoSans',          fontWeight: 700, lineHeight: 1.4, marginBottom: 12, maxWidth: '85%' },
  ideaTitleDev: { color: WHITE, fontSize: 17, fontFamily: 'NotoSansDevanagari', fontWeight: 700, lineHeight: 1.7, marginBottom: 12, maxWidth: '85%' },

  // Metadata
  metaStrip:   { flexDirection: 'row', flexWrap: 'wrap' },
  metaChip:    { marginRight: 18, marginBottom: 3 },
  metaLabel:   { color: '#93C5FD', fontSize: 6.5, fontFamily: 'NotoSans', fontWeight: 700, letterSpacing: 0.8, marginBottom: 1 },
  metaValue:   { color: WHITE,     fontSize: 8.5, fontFamily: 'NotoSans',          fontWeight: 700 },
  metaValueDev:{ color: WHITE,     fontSize: 8.5, fontFamily: 'NotoSansDevanagari', fontWeight: 700 },

  // Status badge
  statusBadge: { paddingVertical: 3, paddingHorizontal: 7, borderRadius: 3, alignSelf: 'flex-start' },
  statusText:  { fontSize: 7, fontFamily: 'NotoSans', fontWeight: 700, letterSpacing: 0.4 },

  // Body
  body: { paddingHorizontal: 36, paddingTop: 18 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 18 },
  sectionAccent: { width: 3, height: 12, backgroundColor: NAVY, borderRadius: 2, marginRight: 7 },
  sectionTitle:  { color: STEEL, fontSize: 7.5, fontFamily: 'NotoSans', fontWeight: 700, letterSpacing: 1.2 },

  // Field rows (table layout)
  fieldRow:         { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: DIVIDER, paddingVertical: 7, alignItems: 'flex-start' },
  fieldRowAlt:      { backgroundColor: LIGHT_BG },
  fieldLabel:       { width: '28%', paddingRight: 10 },
  fieldLabelText:   { color: MUTED, fontSize: 7, fontFamily: 'NotoSans', fontWeight: 700, letterSpacing: 0.3 },
  fieldValue:       { flex: 1 },
  fieldValueText:   { color: BODY, fontSize: 9.5, fontFamily: 'NotoSans',          lineHeight: 1.55 },
  fieldValueTextDev:{ color: BODY, fontSize: 10,  fontFamily: 'NotoSansDevanagari', lineHeight: 1.85 },
  emptyValue:       { color: '#D1D5DB', fontSize: 8.5, fontFamily: 'NotoSans' },

  // AI summary
  aiBox:     { backgroundColor: LIGHT_BG, borderLeftWidth: 3, borderLeftColor: ACCENT, padding: 11, borderRadius: 3, marginTop: 4 },
  aiLabel:   { color: ACCENT, fontSize: 6.5, fontFamily: 'NotoSans', fontWeight: 700, letterSpacing: 0.8, marginBottom: 4 },
  aiText:    { color: STEEL, fontSize: 9.5, fontFamily: 'NotoSans',          lineHeight: 1.6 },
  aiTextDev: { color: STEEL, fontSize: 10,  fontFamily: 'NotoSansDevanagari', lineHeight: 1.9 },

  // Rejection
  rejectBox:   { backgroundColor: REJECT_BG, borderLeftWidth: 3, borderLeftColor: REJECT_FG, padding: 10, borderRadius: 3, marginTop: 8 },
  rejectLabel: { color: REJECT_FG, fontSize: 6.5, fontFamily: 'NotoSans', fontWeight: 700, letterSpacing: 0.5, marginBottom: 3 },
  rejectText:  { color: REJECT_FG, fontSize: 9.5, fontFamily: 'NotoSans', lineHeight: 1.55 },
  rejectTextDev: { color: REJECT_FG, fontSize: 10, fontFamily: 'NotoSansDevanagari', lineHeight: 1.85 },

  // Footer
  footer:      { position: 'absolute', bottom: 14, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:  { color: '#9CA3AF', fontSize: 7, fontFamily: 'NotoSans' },
  footerBrand: { color: NAVY,      fontSize: 7, fontFamily: 'NotoSans', fontWeight: 700 },
});

// ─── Status badge colors ──────────────────────────────────────────────────────
function statusStyle(status) {
  if (status === 'Approved')     return { bg: SUCCESS_BG, fg: SUCCESS_FG };
  if (status === 'Rejected')     return { bg: REJECT_BG,  fg: REJECT_FG  };
  if (status === 'Under Review') return { bg: REVIEW_BG,  fg: REVIEW_FG  };
  return { bg: PENDING_BG, fg: PENDING_FG };
}

// ─── Field value extractor ────────────────────────────────────────────────────
function fieldVal(fieldId, idea) {
  if (fieldId === 'title')           return idea.title || '';
  if (fieldId === 'department')      return idea.department || '';
  if (fieldId === 'expectedImpact')  return idea.expectedImpact || '';
  if (fieldId === 'referenceLink' || fieldId === 'supportingLink') return idea.supportingLink || '';
  if (fieldId === 'problemDescription') {
    if (idea.extra?.problemDescription) return idea.extra.problemDescription;
    const m = idea.description?.match(/Problem:\n([\s\S]*?)(?=\n\nSolution:|$)/i);
    return m ? m[1].trim() : (idea.description || '');
  }
  if (fieldId === 'proposedSolution') {
    if (idea.extra?.proposedSolution) return idea.extra.proposedSolution;
    const m = idea.description?.match(/Solution:\n([\s\S]*)/i);
    return m ? m[1].trim() : '';
  }
  return idea.extra?.[fieldId] ?? '';
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return String(d); }
}

// ─── PDF Document Export ──────────────────────────────────────────────────────
export function IdeaPDFDocument({ idea, templateDef }) {
  const sc = statusStyle(idea.status);
  const displayStatus = idea.status === 'Rejected' ? 'Declined' : (idea.status || 'Submitted');
  const titleDev = isDevanagari(idea.title || '');

  // Only show non-binary fields
  const fields = (templateDef?.fields ?? []).filter(
    f => !['file', 'voice', 'attachment'].includes(f.type)
  );

  // Parse file attachments for listing
  const fileList = (() => {
    try {
      const r = typeof idea.files === 'string' ? JSON.parse(idea.files) : (idea.files || []);
      return Array.isArray(r) ? r.filter(f => f.type === 'file') : [];
    } catch { return []; }
  })();

  return (
    <Document
      title={`Idea: ${idea.title || 'Untitled'}`}
      author={idea.authorName || 'Catalyst'}
      subject="Idea Submission Report"
      creator="Catalyst Innovation Platform"
    >
      <Page size="A4" style={s.page}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <View style={s.headerBanner} fixed>
          <View style={s.headerTopRow}>
            <Text style={s.companyName}>CATALYST · ADVENTZ INNOVATION PLATFORM</Text>
            <Text style={s.docType}>IDEA SUBMISSION REPORT</Text>
          </View>

          <Text style={titleDev ? s.ideaTitleDev : s.ideaTitle}>
            {idea.title || 'Untitled Idea'}
          </Text>

          <View style={s.metaStrip}>
            <View style={s.metaChip}>
              <Text style={s.metaLabel}>SUBMITTED BY</Text>
              <Text style={s.metaValue}>{idea.authorName || '—'}</Text>
            </View>
            <View style={s.metaChip}>
              <Text style={s.metaLabel}>DATE</Text>
              <Text style={s.metaValue}>{fmtDate(idea.createdAt)}</Text>
            </View>
            {!!idea.department && (
              <View style={s.metaChip}>
                <Text style={s.metaLabel}>DEPARTMENT</Text>
                <Text style={isDevanagari(idea.department) ? s.metaValueDev : s.metaValue}>
                  {idea.department}
                </Text>
              </View>
            )}
            {!!idea.authorOrganization && (
              <View style={s.metaChip}>
                <Text style={s.metaLabel}>ORGANIZATION</Text>
                <Text style={s.metaValue}>{idea.authorOrganization}</Text>
              </View>
            )}
            <View style={s.metaChip}>
              <Text style={s.metaLabel}>TEMPLATE</Text>
              <Text style={s.metaValue}>{idea.extra?._templateName || templateDef?.name || 'General'}</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: sc.bg, marginTop: 1 }]}>
              <Text style={[s.statusText, { color: sc.fg }]}>{displayStatus}</Text>
            </View>
          </View>
        </View>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <View style={s.body}>

          {/* AI Summary */}
          {!!idea.aiSummary && (
            <View style={s.aiBox}>
              <Text style={s.aiLabel}>AI-GENERATED SUMMARY</Text>
              <Text style={isDevanagari(idea.aiSummary) ? s.aiTextDev : s.aiText}>
                {idea.aiSummary}
              </Text>
            </View>
          )}

          {/* Rejection reason */}
          {idea.status === 'Rejected' && !!idea.rejectionReason && (
            <View style={s.rejectBox}>
              <Text style={s.rejectLabel}>REVIEWER FEEDBACK — REASON FOR DECLINING</Text>
              <Text style={isDevanagari(idea.rejectionReason) ? s.rejectTextDev : s.rejectText}>
                {idea.rejectionReason}
              </Text>
            </View>
          )}

          {/* Idea Details section */}
          <View style={s.sectionHeader}>
            <View style={s.sectionAccent} />
            <Text style={s.sectionTitle}>IDEA DETAILS</Text>
          </View>

          {fields.length > 0 ? (
            fields.map((field, idx) => {
              const value = fieldVal(field.id, idea);
              const dev = isDevanagari(value);
              return (
                <View key={field.id} style={[s.fieldRow, idx % 2 === 1 ? s.fieldRowAlt : {}]} wrap={false}>
                  <View style={s.fieldLabel}>
                    <Text style={s.fieldLabelText}>{(field.label || field.id).toUpperCase()}</Text>
                  </View>
                  <View style={s.fieldValue}>
                    {value
                      ? <Text style={dev ? s.fieldValueTextDev : s.fieldValueText}>{value}</Text>
                      : <Text style={s.emptyValue}>Not provided</Text>}
                  </View>
                </View>
              );
            })
          ) : (
            // Fallback when template definition not found
            [
              { id: 'problemDescription', label: 'PROBLEM DESCRIPTION' },
              { id: 'proposedSolution',   label: 'PROPOSED SOLUTION'   },
              { id: 'expectedImpact',     label: 'EXPECTED IMPACT'     },
              { id: 'supportingLink',     label: 'SUPPORTING LINK'     },
            ].map((item, idx) => {
              const val = fieldVal(item.id, idea);
              if (!val) return null;
              return (
                <View key={item.id} style={[s.fieldRow, idx % 2 === 1 ? s.fieldRowAlt : {}]} wrap={false}>
                  <View style={s.fieldLabel}>
                    <Text style={s.fieldLabelText}>{item.label}</Text>
                  </View>
                  <View style={s.fieldValue}>
                    <Text style={isDevanagari(val) ? s.fieldValueTextDev : s.fieldValueText}>{val}</Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Attachments */}
          {fileList.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <View style={s.sectionAccent} />
                <Text style={s.sectionTitle}>ATTACHED FILES</Text>
              </View>
              {fileList.map((f, idx) => (
                <View key={idx} style={[s.fieldRow, idx % 2 === 1 ? s.fieldRowAlt : {}]} wrap={false}>
                  <View style={s.fieldLabel}>
                    <Text style={s.fieldLabelText}>FILE {idx + 1}</Text>
                  </View>
                  <View style={s.fieldValue}>
                    <Text style={s.fieldValueText}>{f.name || f.url || '—'}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generated on {fmtDate(new Date().toISOString())} · Confidential</Text>
          <Text style={s.footerBrand}>Catalyst · Adventz Innovation Platform</Text>
        </View>

      </Page>
    </Document>
  );
}
