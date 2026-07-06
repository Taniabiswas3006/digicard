import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data')
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

let pool = null
let isDbActive = false

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

async function initDb() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.log('No DATABASE_URL environment variable found. Falling back to local file storage.')
    return
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      }
    })

    // Test connection and initialize tables
    const client = await pool.connect()
    console.log('Successfully connected to the PostgreSQL database.')
    
    try {
      await client.query('BEGIN')
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS phrases (
          id TEXT PRIMARY KEY,
          bengali TEXT,
          english TEXT,
          emoji TEXT,
          note TEXT
        )
      `)

      await client.query(`
        CREATE TABLE IF NOT EXISTS gallery (
          id TEXT PRIMARY KEY,
          type TEXT,
          content TEXT,
          font TEXT,
          bg TEXT,
          color TEXT,
          date TEXT,
          image TEXT,
          caption TEXT
        )
      `)

      // Seed phrases if empty
      const { rows: phraseCount } = await client.query('SELECT count(*) FROM phrases')
      if (parseInt(phraseCount[0].count) === 0) {
        console.log('Seeding default phrases into database...')
        for (const item of defaultPhrases) {
          await client.query(
            'INSERT INTO phrases (id, bengali, english, emoji, note) VALUES ($1, $2, $3, $4, $5)',
            [item.id, item.bengali, item.english, item.emoji, item.note]
          )
        }
      }

      // Seed gallery if empty
      const { rows: galleryCount } = await client.query('SELECT count(*) FROM gallery')
      if (parseInt(galleryCount[0].count) === 0) {
        console.log('Seeding default gallery items into database...')
        for (const item of defaultGalleryItems) {
          await client.query(
            'INSERT INTO gallery (id, type, content, font, bg, color, date, image, caption) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
              item.id,
              item.type || null,
              item.content || null,
              item.font || null,
              item.bg || null,
              item.color || null,
              item.date || null,
              item.image || null,
              item.caption || null
            ]
          )
        }
      }

      await client.query('COMMIT')
      isDbActive = true
      console.log('PostgreSQL database initialization completed.')
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('Failed to initialize database tables:', err)
      console.log('Falling back to local file storage.')
      pool = null
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Failed to connect to the database:', err)
    console.log('Falling back to local file storage.')
    pool = null
  }
}

async function readPhrases() {
  if (isDbActive && pool) {
    try {
      const { rows } = await pool.query('SELECT * FROM phrases ORDER BY id ASC')
      return rows
    } catch (error) {
      console.error('Failed to read phrases from DB, falling back to files.', error)
    }
  }

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

async function writePhrases(phrases) {
  if (isDbActive && pool) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM phrases')
      for (const item of phrases) {
        await client.query(
          'INSERT INTO phrases (id, bengali, english, emoji, note) VALUES ($1, $2, $3, $4, $5)',
          [item.id, item.bengali, item.english, item.emoji, item.note]
        )
      }
      await client.query('COMMIT')
      return phrases
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Failed to write phrases to DB, falling back to files.', error)
    } finally {
      client.release()
    }
  }

  ensureDataFile()
  fs.writeFileSync(phrasesFile, JSON.stringify(phrases, null, 2), 'utf8')
  return phrases
}

async function readGallery() {
  if (isDbActive && pool) {
    try {
      const { rows } = await pool.query('SELECT * FROM gallery ORDER BY id ASC')
      return rows
    } catch (error) {
      console.error('Failed to read gallery from DB, falling back to files.', error)
    }
  }

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

async function writeGallery(items) {
  if (isDbActive && pool) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM gallery')
      for (const item of items) {
        await client.query(
          'INSERT INTO gallery (id, type, content, font, bg, color, date, image, caption) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            item.id,
            item.type || null,
            item.content || null,
            item.font || null,
            item.bg || null,
            item.color || null,
            item.date || null,
            item.image || null,
            item.caption || null
          ]
        )
      }
      await client.query('COMMIT')
      return items
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Failed to write gallery to DB, falling back to files.', error)
    } finally {
      client.release()
    }
  }

  ensureDataFile()
  fs.writeFileSync(galleryFile, JSON.stringify(items, null, 2), 'utf8')
  return items
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/phrases') {
    try {
      const data = await readPhrases()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Failed to read phrases.' }))
    }
    return
  }

  if (req.method === 'PUT' && url.pathname === '/api/phrases') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body)
        const nextPhrases = Array.isArray(payload?.phrases) ? payload.phrases : []
        const updated = await writePhrases(nextPhrases)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(updated))
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid phrases payload.' }))
      }
    })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/gallery') {
    try {
      const data = await readGallery()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Failed to read gallery.' }))
    }
    return
  }

  if (req.method === 'PUT' && url.pathname === '/api/gallery') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body)
        const galleryPayload = payload?.gallery || payload?.galleryItems
        const nextGallery = Array.isArray(galleryPayload) ? galleryPayload : []
        const updated = await writeGallery(nextGallery)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(updated))
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid gallery payload.' }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found.' }))
})

// Initialize DB and start server
initDb().finally(() => {
  const port = Number(process.env.PORT || 3001)
  server.listen(port, '0.0.0.0', () => {
    console.log(`Phrase sync server listening on http://0.0.0.0:${port}`)
  })
})
