import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, 'data')
const phrasesFile = path.join(dataDir, 'phrases.json')
const galleryFile = path.join(dataDir, 'gallery.json')
const defaultPhrases = [
  { id: '1', bengali: 'KAMON ACHO?', english: 'HOW ARE YOU?', emoji: '🌸', note: 'THE SWEETEST WAY TO GREET YOUR FAVORITE BESTIES' },
  { id: '2', bengali: 'ASCHI', english: 'I LEAVE ONLY TO RETURN', emoji: '🚶‍♀️', note: 'LITERALLY "I AM COMING"—THE BEAUTIFUL BENGALI WAY OF SAYING GOODBYE' },
  { id: '3', bengali: 'DHONNOBAD', english: 'THANK YOU', emoji: '🙏', note: 'FOR ALL THE ENDLESS LAUGHTER, COFFEE DATES, AND SWEET MEETS' },
  { id: '4', bengali: 'PRONAM', english: 'RESPECTFUL GREETING', emoji: '🙇‍♀️', note: 'A TRADITIONAL GESTURE TO SHOW DEEP RESPECT AND LOVE' },
  { id: '5', bengali: 'ABAR DEKHA HOBE', english: 'UNTIL WE MEET AGAIN', emoji: '🤝', note: 'THE HEARTFELT SEE-OFF SENTIMENT SAID WITH WARM HUGS' },
  { id: '6', bengali: 'TOMAKE KHUB MISS KORBO', english: 'I WILL MISS YOU SO MUCH', emoji: '🥺', note: 'OUR SACRED CROSS-CONTINENTAL FRIENDSHIP PROMISE' }
]
const defaultGalleryItems = [
  {
    id: 'pre-1',
    type: 'text',
    content: 'Tania loves you guys! Have a safe flight back home! ✈️💖',
    font: 'font-cursive',
    bg: 'bg-[#eee9ff]',
    color: 'text-black',
    date: 'July 5, 2026'
  },
  {
    id: 'pre-2',
    type: 'drawing',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><path d="M50 50 C50 20, 80 20, 100 45 C120 20, 150 20, 150 50 C150 80, 100 110, 100 110 C100 110, 50 80, 50 50 Z" fill="%23ffd6e0" stroke="%23333" stroke-width="3"/></svg>',
    date: 'July 5, 2026',
    caption: 'Besties Forever! 🎀'
  }
]

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(phrasesFile)) {
    fs.writeFileSync(phrasesFile, JSON.stringify(defaultPhrases, null, 2), 'utf8')
  }

  if (!fs.existsSync(galleryFile)) {
    fs.writeFileSync(galleryFile, JSON.stringify(defaultGalleryItems, null, 2), 'utf8')
  }
}

function readPhrases() {
  ensureDataFile()
  const raw = fs.readFileSync(phrasesFile, 'utf8')
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : defaultPhrases
  } catch (error) {
    console.error('Failed to parse phrases data, using defaults.', error)
    return defaultPhrases
  }
}

function writePhrases(phrases) {
  ensureDataFile()
  fs.writeFileSync(phrasesFile, JSON.stringify(phrases, null, 2), 'utf8')
}

function readGallery() {
  ensureDataFile()
  const raw = fs.readFileSync(galleryFile, 'utf8')
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : defaultGalleryItems
  } catch (error) {
    console.error('Failed to parse gallery data, using defaults.', error)
    return defaultGalleryItems
  }
}

function writeGallery(items) {
  ensureDataFile()
  fs.writeFileSync(galleryFile, JSON.stringify(items, null, 2), 'utf8')
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')

  if (req.method === 'GET' && url.pathname === '/api/phrases') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify(readPhrases()))
    return
  }

  if (req.method === 'PUT' && url.pathname === '/api/phrases') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
        const nextPhrases = Array.isArray(payload?.phrases) ? payload.phrases : []
        writePhrases(nextPhrases)
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
        res.end(JSON.stringify(nextPhrases))
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
        res.end(JSON.stringify({ error: 'Invalid phrases payload.' }))
      }
    })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/gallery') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify(readGallery()))
    return
  }

  if (req.method === 'PUT' && url.pathname === '/api/gallery') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
        const galleryPayload = payload?.gallery || payload?.galleryItems
        const nextGallery = Array.isArray(galleryPayload) ? galleryPayload : []
        writeGallery(nextGallery)
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
        res.end(JSON.stringify(nextGallery))
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
        res.end(JSON.stringify({ error: 'Invalid gallery payload.' }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify({ error: 'Not found.' }))
})

const port = Number(process.env.PORT || 3001)
server.listen(port, '0.0.0.0', () => {
  console.log(`Phrase sync server listening on http://0.0.0.0:${port}`)
})
