import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const TIMEOUT_MS = 30_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ])
}

/** Extract plain text from a PDF File, one paragraph per page. */
export async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())

  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await withTimeout(loadingTask.promise, TIMEOUT_MS, 'PDF load')

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await withTimeout(pdf.getPage(i), TIMEOUT_MS, `Page ${i}`)
    const content = await withTimeout(page.getTextContent(), TIMEOUT_MS, `Page ${i} text`)
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (pageText) pages.push(pageText)
  }

  if (pages.length === 0) {
    throw new Error(
      'No text found in this PDF. It may be a scanned image — try copying the text manually.',
    )
  }

  return pages.join('\n\n')
}
