import type { ParsedResume } from '../types'

export async function downloadResumePdf(parsed: ParsedResume, filename = 'resume.pdf') {
  const [{ pdf }, { ResumePDF }, React] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/ResumePDF'),
    import('react'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(ResumePDF, { parsed }) as any
  const blob = await pdf(element).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
