import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ParsedResume } from '../types'

// Light theme mirrors the profile tab structure with amber accents
const c = {
  bg:      '#ffffff',
  text:    '#1c1917',
  text2:   '#57534e',
  text3:   '#a8a29e',
  accent:  '#f59e0b',
  border:  '#e7e5e4',
  surface: '#fafaf9',
  tag:     '#fef3c7',
  tagText: '#92400e',
}

const s = StyleSheet.create({
  page: {
    backgroundColor: c.bg,
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 52,
    paddingRight: 52,
    fontFamily: 'Helvetica',
    color: c.text,
  },

  // Header
  header: { marginBottom: 24 },
  name: { fontSize: 22, fontFamily: 'Helvetica-Bold', letterSpacing: -0.4, color: c.text },
  contactRow: { flexDirection: 'row', gap: 16, marginTop: 5 },
  contactText: { fontSize: 9, color: c.text3 },
  summary: { fontSize: 10, color: c.text2, lineHeight: 1.6, marginTop: 10, maxWidth: 480 },

  // Section
  section: { marginTop: 22 },
  sectionHeading: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: c.text3,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    paddingBottom: 5,
    marginBottom: 12,
  },

  // Experience
  expItem: { marginBottom: 14 },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  expLeft: { flex: 1 },
  expRole: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: c.text },
  expCompany: { fontSize: 10, color: c.text2, marginTop: 2 },
  expPeriod: { fontSize: 9, color: c.text3, marginTop: 2 },
  bulletList: { marginTop: 5, paddingLeft: 10 },
  bullet: { fontSize: 9.5, color: c.text2, lineHeight: 1.55, marginBottom: 2 },

  // Education
  eduItem: { marginBottom: 10 },
  eduDegree: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: c.text },
  eduMeta: { fontSize: 9.5, color: c.text3, marginTop: 2 },

  // Skills
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: {
    fontSize: 9,
    color: c.tagText,
    backgroundColor: c.tag,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
  },

  // Projects
  projItem: { marginBottom: 12 },
  projName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: c.text },
  projDesc: { fontSize: 9.5, color: c.text2, lineHeight: 1.55, marginTop: 3 },
  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 },
  techTag: {
    fontSize: 8.5,
    color: c.accent,
    backgroundColor: '#fffbeb',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
})

interface Props {
  parsed: ParsedResume
}

export function ResumePDF({ parsed }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.name}>{parsed.name ?? 'Resume'}</Text>
          {(parsed.email || parsed.phone) && (
            <View style={s.contactRow}>
              {parsed.email && <Text style={s.contactText}>{parsed.email}</Text>}
              {parsed.phone && <Text style={s.contactText}>{parsed.phone}</Text>}
            </View>
          )}
          {parsed.summary && <Text style={s.summary}>{parsed.summary}</Text>}
        </View>

        {/* Experience */}
        {parsed.experience.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeading}>Experience</Text>
            {parsed.experience.map((exp, i) => (
              <View key={i} style={s.expItem}>
                <View style={s.expHeader}>
                  <View style={s.expLeft}>
                    <Text style={s.expRole}>{exp.role}</Text>
                    <Text style={s.expCompany}>{exp.company}</Text>
                  </View>
                  <Text style={s.expPeriod}>{exp.period}</Text>
                </View>
                {exp.bullets.length > 0 && (
                  <View style={s.bulletList}>
                    {exp.bullets.map((b, j) => (
                      <Text key={j} style={s.bullet}>• {b}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {parsed.education.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeading}>Education</Text>
            {parsed.education.map((edu, i) => (
              <View key={i} style={s.eduItem}>
                <Text style={s.eduDegree}>{edu.degree}</Text>
                <Text style={s.eduMeta}>{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {parsed.skills.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeading}>Skills</Text>
            <View style={s.skillsRow}>
              {parsed.skills.map((skill, i) => (
                <Text key={i} style={s.skillTag}>{skill}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {parsed.projects.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeading}>Projects</Text>
            {parsed.projects.map((proj, i) => (
              <View key={i} style={s.projItem}>
                <Text style={s.projName}>{proj.name}</Text>
                <Text style={s.projDesc}>{proj.description}</Text>
                {proj.tech && proj.tech.length > 0 && (
                  <View style={s.techRow}>
                    {proj.tech.map((t, j) => (
                      <Text key={j} style={s.techTag}>{t}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  )
}
