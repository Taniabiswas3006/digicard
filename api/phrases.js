import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const defaultPhrases = [
  { id: '1', bengali: 'KAMON ACHO?', english: 'HOW ARE YOU?', emoji: '🌸', note: 'THE SWEETEST WAY TO GREET YOUR FAVORITE BESTIES' },
  { id: '2', bengali: 'ASCHI', english: 'I LEAVE ONLY TO RETURN', emoji: '🚶‍♀️', note: 'LITERALLY "I AM COMING"—THE BEAUTIFUL BENGALI WAY OF SAYING GOODBYE' },
  { id: '3', bengali: 'DHONNOBAD', english: 'THANK YOU', emoji: '🙏', note: 'FOR ALL THE ENDLESS LAUGHTER, COFFEE DATES, AND SWEET MEETS' },
  { id: '4', bengali: 'PRONAM', english: 'RESPECTFUL GREETING', emoji: '🙇‍♀️', note: 'A TRADITIONAL GESTURE TO SHOW DEEP RESPECT AND LOVE' },
  { id: '5', bengali: 'ABAR DEKHA HOBE', english: 'UNTIL WE MEET AGAIN', emoji: '🤝', note: 'THE HEARTFELT SEE-OFF SENTIMENT SAID WITH WARM HUGS' },
  { id: '6', bengali: 'TOMAKE KHUB MISS KORBO', english: 'I WILL MISS YOU SO MUCH', emoji: '🥺', note: 'OUR SACRED CROSS-CONTINENTAL FRIENDSHIP PROMISE' }
]

function getStoragePath() {
  return path.join('/tmp', 'bestie_phrases.json')
}

function ensureStorageFile() {
  const storagePath = getStoragePath()
  if (!fs.existsSync(storagePath)) {
    fs.writeFileSync(storagePath, JSON.stringify(defaultPhrases, null, 2), 'utf8')
  }
  return storagePath
}

function readPhrases() {
  try {
    const storagePath = ensureStorageFile()
    const raw = fs.readFileSync(storagePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : defaultPhrases
  } catch (error) {
    console.error('Failed to read shared phrases.', error)
    return defaultPhrases
  }
}

function writePhrases(phrases) {
  const storagePath = ensureStorageFile()
  fs.writeFileSync(storagePath, JSON.stringify(phrases, null, 2), 'utf8')
  return phrases
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'GET') {
    res.status(200).json(readPhrases())
    return
  }

  if (req.method === 'PUT') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
        const nextPhrases = Array.isArray(payload?.phrases) ? payload.phrases : []
        res.status(200).json(writePhrases(nextPhrases))
      } catch (error) {
        res.status(400).json({ error: 'Invalid phrases payload.' })
      }
    })
    return
  }

  res.status(404).json({ error: 'Not found.' })
}
