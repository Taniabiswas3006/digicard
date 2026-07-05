import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, 'data')
const phrasesFile = path.join(dataDir, 'phrases.json')
const defaultPhrases = [
  { id: '1', bengali: 'KAMON ACHO?', english: 'HOW ARE YOU?', emoji: '🌸', note: 'THE SWEETEST WAY TO GREET YOUR FAVORITE BESTIES' },
  { id: '2', bengali: 'ASCHI', english: 'I LEAVE ONLY TO RETURN', emoji: '🚶‍♀️', note: 'LITERALLY "I AM COMING"—THE BEAUTIFUL BENGALI WAY OF SAYING GOODBYE' },
  { id: '3', bengali: 'DHONNOBAD', english: 'THANK YOU', emoji: '🙏', note: 'FOR ALL THE ENDLESS LAUGHTER, COFFEE DATES, AND SWEET MEETS' },
  { id: '4', bengali: 'PRONAM', english: 'RESPECTFUL GREETING', emoji: '🙇‍♀️', note: 'A TRADITIONAL GESTURE TO SHOW DEEP RESPECT AND LOVE' },
  { id: '5', bengali: 'ABAR DEKHA HOBE', english: 'UNTIL WE MEET AGAIN', emoji: '🤝', note: 'THE HEARTFELT SEE-OFF SENTIMENT SAID WITH WARM HUGS' },
  { id: '6', bengali: 'TOMAKE KHUB MISS KORBO', english: 'I WILL MISS YOU SO MUCH', emoji: '🥺', note: 'OUR SACRED CROSS-CONTINENTAL FRIENDSHIP PROMISE' }
]

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(phrasesFile)) {
    fs.writeFileSync(phrasesFile, JSON.stringify(defaultPhrases, null, 2), 'utf8')
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

  res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify({ error: 'Not found.' }))
})

const port = Number(process.env.PORT || 3001)
server.listen(port, '0.0.0.0', () => {
  console.log(`Phrase sync server listening on http://0.0.0.0:${port}`)
})
