import type { ChatNode } from './types'

export interface TopicCluster {
  id: string
  label: string
  terms: string[]
  nodeIds: string[]
}

const STOPWORDS = new Set([
  'a','an','and','are','as','at','be','but','by','for','from','has','have','had','he','her','his','i','if','in','into','is','it','its','me','my','not','of','on','or','our','she','so','than','that','the','their','them','then','there','these','they','this','to','too','up','was','we','were','what','when','where','which','who','why','will','with','you','your',
])

export function clusterConversationTopics(
  messages: Pick<ChatNode, 'id' | 'content'>[],
  opts?: { k?: number; maxVocab?: number; maxTermsPerLabel?: number }
): TopicCluster[] {
  const docs = messages
    .map((m) => ({ id: m.id, text: (m.content ?? '').trim() }))
    .filter((m) => m.text.length > 0)

  if (docs.length === 0) return []
  if (docs.length === 1) {
    return [{ id: 'topic-0', label: 'Topic', terms: [], nodeIds: [docs[0].id] }]
  }

  const maxVocab = opts?.maxVocab ?? 250
  const maxTermsPerLabel = opts?.maxTermsPerLabel ?? 4
  const kWanted = opts?.k ?? autoK(docs.length)
  const k = clamp(kWanted, 2, Math.min(10, docs.length))

  const tokenized = docs.map((d) => tokenize(d.text))
  const { vocab, vectors } = buildTfIdf(tokenized, maxVocab)
  const assignments = kmeansCosine(vectors, k)

  const clusters: { nodeIds: string[]; centroid: Float32Array }[] = Array.from({ length: k }, () => ({
    nodeIds: [],
    centroid: new Float32Array(vocab.length),
  }))

  // group ids
  for (let i = 0; i < docs.length; i++) {
    clusters[assignments[i]].nodeIds.push(docs[i].id)
  }

  // compute centroids
  for (let c = 0; c < k; c++) {
    const ids = clusters[c].nodeIds
    if (ids.length === 0) continue
    const sum = new Float32Array(vocab.length)
    for (let i = 0; i < docs.length; i++) {
      if (assignments[i] !== c) continue
      const v = vectors[i]
      for (let j = 0; j < v.length; j++) sum[j] += v[j]
    }
    for (let j = 0; j < sum.length; j++) sum[j] = sum[j] / ids.length
    normalize(sum)
    clusters[c].centroid = sum
  }

  // label: top weighted centroid terms
  const labeled: TopicCluster[] = clusters
    .map((c, idx) => {
      const terms = topTermsFromVector(vocab, c.centroid, maxTermsPerLabel)
      const label = terms.length ? terms.join(' · ') : `Topic ${idx + 1}`
      return { id: `topic-${idx}`, label, terms, nodeIds: c.nodeIds }
    })
    .filter((c) => c.nodeIds.length > 0)
    .sort((a, b) => b.nodeIds.length - a.nodeIds.length)

  // If k produced empties, merge by returning only non-empty clusters.
  return labeled
}

function autoK(n: number) {
  // heuristic that feels OK for chat logs
  return clamp(Math.round(Math.sqrt(n / 2)), 2, 8)
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function tokenize(text: string): string[] {
  const tokens = (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .map((t) => t.replace(/^\d+$/, ''))
    .filter((t) => t.length >= 3)
    .filter((t) => !STOPWORDS.has(t))
  return tokens
}

function buildTfIdf(tokenized: string[][], maxVocab: number) {
  const df = new Map<string, number>()
  const tf: Map<string, number>[] = []

  for (const docTokens of tokenized) {
    const counts = new Map<string, number>()
    for (const t of docTokens) counts.set(t, (counts.get(t) ?? 0) + 1)
    tf.push(counts)
    const seen = new Set(counts.keys())
    for (const term of seen) df.set(term, (df.get(term) ?? 0) + 1)
  }

  // score vocab by corpus TF * IDF
  const N = tokenized.length
  const scored = Array.from(df.entries()).map(([term, dfi]) => {
    const idf = Math.log(1 + N / (1 + dfi))
    let corpusTf = 0
    for (const m of tf) corpusTf += m.get(term) ?? 0
    return { term, score: corpusTf * idf, dfi }
  })
  scored.sort((a, b) => b.score - a.score)
  const vocab = scored.slice(0, maxVocab).map((s) => s.term)
  const index = new Map<string, number>()
  vocab.forEach((t, i) => index.set(t, i))

  const idfArr = new Float32Array(vocab.length)
  for (let i = 0; i < vocab.length; i++) {
    const term = vocab[i]
    const dfi = df.get(term) ?? 1
    idfArr[i] = Math.log(1 + N / (1 + dfi))
  }

  const vectors: Float32Array[] = tf.map((counts) => {
    const v = new Float32Array(vocab.length)
    let max = 0
    for (const [term, c] of counts.entries()) {
      const j = index.get(term)
      if (j === undefined) continue
      max = Math.max(max, c)
      v[j] = c
    }
    if (max > 0) {
      for (let j = 0; j < v.length; j++) {
        if (v[j] > 0) v[j] = (v[j] / max) * idfArr[j]
      }
    }
    normalize(v)
    return v
  })

  return { vocab, idf: idfArr, vectors }
}

function normalize(v: Float32Array) {
  let sum = 0
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i]
  const norm = Math.sqrt(sum)
  if (!norm) return
  for (let i = 0; i < v.length; i++) v[i] = v[i] / norm
}

function cosineDistance(a: Float32Array, b: Float32Array) {
  // vectors are already normalized
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return 1 - dot
}

function kmeansCosine(vectors: Float32Array[], k: number) {
  const n = vectors.length
  const dim = vectors[0].length
  const centroids: Float32Array[] = initKmeansPlusPlus(vectors, k)
  const assign = new Array<number>(n).fill(0)

  let changed = true
  let it = 0
  const MAX_ITERS = 30

  while (changed && it < MAX_ITERS) {
    changed = false
    it++

    // assign
    for (let i = 0; i < n; i++) {
      let best = 0
      let bestDist = Infinity
      for (let c = 0; c < k; c++) {
        const d = cosineDistance(vectors[i], centroids[c])
        if (d < bestDist) {
          bestDist = d
          best = c
        }
      }
      if (assign[i] !== best) {
        assign[i] = best
        changed = true
      }
    }

    // recompute centroids
    const sums: Float32Array[] = Array.from({ length: k }, () => new Float32Array(dim))
    const counts = new Array<number>(k).fill(0)
    for (let i = 0; i < n; i++) {
      const c = assign[i]
      counts[c]++
      const v = vectors[i]
      const s = sums[c]
      for (let j = 0; j < dim; j++) s[j] += v[j]
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue
      const s = sums[c]
      for (let j = 0; j < dim; j++) s[j] = s[j] / counts[c]
      normalize(s)
      centroids[c] = s
    }
  }

  return assign
}

function initKmeansPlusPlus(vectors: Float32Array[], k: number) {
  const n = vectors.length
  const centroids: Float32Array[] = []
  const seed = hashToSeed(vectors.length + ':' + vectors[0].length)
  const rand = mulberry32(seed)

  // choose first centroid randomly
  centroids.push(vectors[Math.floor(rand() * n)].slice() as Float32Array)

  const distances = new Float32Array(n)
  for (let c = 1; c < k; c++) {
    let sum = 0
    for (let i = 0; i < n; i++) {
      let best = Infinity
      for (const cen of centroids) {
        const d = cosineDistance(vectors[i], cen)
        if (d < best) best = d
      }
      const d2 = best * best
      distances[i] = d2
      sum += d2
    }
    let r = rand() * sum
    let nextIndex = 0
    for (let i = 0; i < n; i++) {
      r -= distances[i]
      if (r <= 0) {
        nextIndex = i
        break
      }
    }
    centroids.push(vectors[nextIndex].slice() as Float32Array)
  }

  return centroids
}

function topTermsFromVector(vocab: string[], v: Float32Array, maxTerms: number) {
  const scored: { term: string; w: number }[] = []
  for (let i = 0; i < vocab.length; i++) {
    const w = v[i]
    if (w > 0) scored.push({ term: vocab[i], w })
  }
  scored.sort((a, b) => b.w - a.w)
  return scored.slice(0, maxTerms).map((s) => s.term)
}

function hashToSeed(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

