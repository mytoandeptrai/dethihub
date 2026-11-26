import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'

const exam = JSON.parse(
  await readFile(new URL('../../src/testing/fixtures/public-exam.json', import.meta.url), 'utf8'),
)
const pricing = {
  pointsPer1000: 10,
  minVnd: 10_000,
  maxVnd: 1_000_000,
  defaultVnd: 50_000,
  packs: [
    { vnd: 50_000, bonus: 0.1 },
    { vnd: 100_000, bonus: 0.2 },
  ],
}
const card = {
  ...exam,
  questionCount: 4,
  durationMinutes: 45,
  totalPoints: 10,
  preview: 'Ôn tập Toán lớp 9',
  ownerId: null,
  school: exam.unit,
  missingKeys: 4,
}

createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost')
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Content-Type', 'application/json')
  if (url.pathname === '/api/billing/pricing') return response.end(JSON.stringify(pricing))
  if (url.pathname === '/api/exams/community') return response.end(JSON.stringify([card]))
  if (url.pathname === `/api/exams/community/${exam.id}`) return response.end(JSON.stringify(exam))
  if (url.pathname.startsWith('/api/exams/community/')) {
    response.statusCode = 404
    return response.end(JSON.stringify({ message: 'Không tìm thấy đề.' }))
  }
  if (url.pathname === '/api/site/status')
    return response.end(
      JSON.stringify({
        features: { word: true, slide: true, board: true, online: true },
        maintenance: { on: false },
        announcements: [],
      }),
    )
  return response.end('[]')
}).listen(Number(process.env.SEO_API_PORT ?? 3302), '127.0.0.1', () =>
  console.log('SEO fixture API ready'),
)
