import fs from 'node:fs'
import path from 'node:path'

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

function getStoragePath() {
  return path.join('/tmp', 'bestie_gallery.json')
}

function ensureStorageFile() {
  const storagePath = getStoragePath()
  if (!fs.existsSync(storagePath)) {
    fs.writeFileSync(storagePath, JSON.stringify(defaultGalleryItems, null, 2), 'utf8')
  }
  return storagePath
}

function readGalleryItems() {
  try {
    const storagePath = ensureStorageFile()
    const raw = fs.readFileSync(storagePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : defaultGalleryItems
  } catch (error) {
    console.error('Failed to read shared gallery items.', error)
    return defaultGalleryItems
  }
}

function writeGalleryItems(items) {
  const storagePath = ensureStorageFile()
  fs.writeFileSync(storagePath, JSON.stringify(items, null, 2), 'utf8')
  return items
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
    res.status(200).json(readGalleryItems())
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
        const galleryPayload = payload?.gallery || payload?.galleryItems
        const nextItems = Array.isArray(galleryPayload) ? galleryPayload : []
        res.status(200).json(writeGalleryItems(nextItems))
      } catch (error) {
        res.status(400).json({ error: 'Invalid gallery payload.' })
      }
    })
    return
  }

  res.status(404).json({ error: 'Not found.' })
}
