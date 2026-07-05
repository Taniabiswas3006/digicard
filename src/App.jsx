import { useState, useEffect, useRef } from 'react'

const defaultPhrases = [
  { id: '1', bengali: 'KAMON ACHO?', english: 'HOW ARE YOU?', emoji: '🌸', note: 'THE SWEETEST WAY TO GREET YOUR FAVORITE BESTIES' },
  { id: '2', bengali: 'ASCHI', english: 'I LEAVE ONLY TO RETURN', emoji: '🚶‍♀️', note: 'LITERALLY "I AM COMING"—THE BEAUTIFUL BENGALI WAY OF SAYING GOODBYE' },
  { id: '3', bengali: 'DHONNOBAD', english: 'THANK YOU', emoji: '🙏', note: 'FOR ALL THE ENDLESS LAUGHTER, COFFEE DATES, AND SWEET MEETS' },
  { id: '4', bengali: 'PRONAM', english: 'RESPECTFUL GREETING', emoji: '🙇‍♀️', note: 'A TRADITIONAL GESTURE TO SHOW DEEP RESPECT AND LOVE' },
  { id: '5', bengali: 'ABAR DEKHA HOBE', english: 'UNTIL WE MEET AGAIN', emoji: '🤝', note: 'THE HEARTFELT SEE-OFF SENTIMENT SAID WITH WARM HUGS' },
  { id: '6', bengali: 'TOMAKE KHUB MISS KORBO', english: 'I WILL MISS YOU SO MUCH', emoji: '🥺', note: 'OUR SACRED CROSS-CONTINENTAL FRIENDSHIP PROMISE' }
]

function App() {
  const phrasesApiUrl = import.meta.env.VITE_API_URL || '/api/phrases'
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [heartsCount, setHeartsCount] = useState(120)
  const [isMonoFilter, setIsMonoFilter] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)

  // Drawing Pad States
  const [activeTab, setActiveTab] = useState('draw') // 'draw' | 'type'
  const [penColor, setPenColor] = useState('#5B0E1B') // default dark crimson
  const [brushSize, setBrushSize] = useState(4)
  const [strokeType, setStrokeType] = useState('normal') // 'normal' | 'brush' | 'dotted' | 'eraser'
  const [drawHistory, setDrawHistory] = useState([])
  
  // Typed Note States
  const [typedMessage, setTypedMessage] = useState('')
  const [typedFont, setTypedFont] = useState('font-cursive') // font-cursive, font-serif, font-mono, font-sans
  const [typedBg, setTypedBg] = useState('bg-[#FFFDE8]') // butter cream, light lavender, light mint
  const [typedColor, setTypedColor] = useState('text-[#5B0E1B]')

  // Gallery States (persisted in localStorage, fallback to pre-loaded memories)
  const [galleryItems, setGalleryItems] = useState(() => {
    const saved = localStorage.getItem('bestie_gallery')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error("Failed to parse gallery items from localStorage", e)
      }
    }
    return [
      {
        id: 'pre-1',
        type: 'text',
        content: 'Tania loves you guys! Have a safe flight back home! ✈️💖',
        font: 'font-cursive',
        bg: 'bg-[#eee9ff]', // lavender
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
  })

  // Synchronize gallery items changes to localStorage
  useEffect(() => {
    localStorage.setItem('bestie_gallery', JSON.stringify(galleryItems))
  }, [galleryItems])

  // Custom Dictionary States (shared across devices via a small backend)
  const [phrases, setPhrases] = useState(defaultPhrases)
  const [isPhrasesLoaded, setIsPhrasesLoaded] = useState(false)

  useEffect(() => {
    let ignore = false

    const loadPhrases = async () => {
      try {
        const response = await fetch(phrasesApiUrl)
        if (!response.ok) {
          throw new Error(`Failed to load phrases (${response.status})`)
        }

        const data = await response.json()
        if (!ignore && Array.isArray(data)) {
          setPhrases(data)
          localStorage.setItem('bestie_phrases', JSON.stringify(data))
        }
      } catch (error) {
        console.error('Failed to load shared phrases, falling back to localStorage', error)
        if (!ignore) {
          const saved = localStorage.getItem('bestie_phrases')
          if (saved) {
            try {
              const parsed = JSON.parse(saved)
              if (Array.isArray(parsed)) {
                setPhrases(parsed)
              }
            } catch (parseError) {
              console.error('Failed to parse phrases from localStorage', parseError)
            }
          }
        }
      } finally {
        if (!ignore) {
          setIsPhrasesLoaded(true)
        }
      }
    }

    loadPhrases()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!isPhrasesLoaded) {
      return
    }

    const syncPhrases = async () => {
      try {
        await fetch(phrasesApiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phrases })
        })
        localStorage.setItem('bestie_phrases', JSON.stringify(phrases))
      } catch (error) {
        console.error('Failed to sync phrases to shared storage', error)
        localStorage.setItem('bestie_phrases', JSON.stringify(phrases))
      }
    }

    syncPhrases()
  }, [phrases, isPhrasesLoaded])

  // Live clock tracker for timezone card
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Form Inputs for Adding a Phrase
  const [newBengali, setNewBengali] = useState('')
  const [newEnglish, setNewEnglish] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newEmoji, setNewEmoji] = useState('💬')
  const [isAddingPhrase, setIsAddingPhrase] = useState(false)

  const handleAddPhrase = (e) => {
    e.preventDefault()
    if (!newBengali.trim() || !newEnglish.trim()) {
      alert("Please fill in both the Bengali phrase and English translation!")
      return
    }
    const newPhraseItem = {
      id: 'phrase-' + Date.now(),
      bengali: newBengali.toUpperCase(),
      english: newEnglish.toUpperCase(),
      emoji: newEmoji,
      note: newNote ? newNote.toUpperCase() : 'ADDED SOUVENIR PHRASE'
    }
    setPhrases(prev => [...prev, newPhraseItem])
    setNewBengali('')
    setNewEnglish('')
    setNewNote('')
    setNewEmoji('💬')
    setIsAddingPhrase(false)
  }

  const handleDeletePhrase = (id) => {
    setPhrases(prev => prev.filter(p => p.id !== id))
  }

  // Canvas Drawing Refs & Logic
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const lastX = useRef(0)
  const lastY = useRef(0)

  // Initialize official 30-second preview audio stream
  const [audio] = useState(() => new Audio('https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/53/82/c1/5382c1d4-ddba-aa2b-90df-57268895fac9/mzaf_8926201202931541051.plus.aac.p.m4a'))

  useEffect(() => {
    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
    }
  }, [audio])

  // Canvas context setups
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      // Handle high DPI screens
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
  }, [activeTab])

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(err => console.log("Audio playback failed:", err))
    }
    setIsPlaying(!isPlaying)
  }

  const handleTakeSnap = () => {
    setIsFlashing(true)
    setTimeout(() => {
      setIsFlashing(false)
    }, 600)
  }

  // Draw handlers
  const startDrawing = (e) => {
    isDrawing.current = true
    if (canvasRef.current) {
      // Capture the state before the stroke starts to track undo steps
      const currentState = canvasRef.current.toDataURL()
      setDrawHistory(prev => [...prev, currentState])
    }
    const { x, y } = getCoord(e)
    lastX.current = x
    lastY.current = y
  }

  const draw = (e) => {
    if (!isDrawing.current || !canvasRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoord(e)

    // Smooth curves using midpoint quadratic interpolation
    ctx.beginPath()
    ctx.moveTo(lastX.current, lastY.current)
    
    const midX = (lastX.current + x) / 2
    const midY = (lastY.current + y) / 2
    ctx.quadraticCurveTo(lastX.current, lastY.current, midX, midY)
    
    ctx.strokeStyle = penColor
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Configure stroke style properties depending on strokeType
    if (strokeType === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.setLineDash([])
      ctx.shadowBlur = 0
    } else if (strokeType === 'brush') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.setLineDash([])
      ctx.shadowColor = penColor
      ctx.shadowBlur = brushSize > 4 ? 2.5 : 1.2
    } else if (strokeType === 'dotted') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.setLineDash([1, brushSize * 2.2])
      ctx.shadowBlur = 0
    } else {
      // Normal Pen
      ctx.globalCompositeOperation = 'source-over'
      ctx.setLineDash([])
      ctx.shadowBlur = 0
    }
    
    ctx.stroke()

    // Reset shadow values, composite modes & line dash for next drawings to keep context clean
    ctx.shadowBlur = 0
    ctx.setLineDash([])
    ctx.globalCompositeOperation = 'source-over'

    lastX.current = x
    lastY.current = y
  }

  const stopDrawing = () => {
    isDrawing.current = false
  }

  const clearCanvas = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Save clear action to history so it can be undone
    const currentState = canvas.toDataURL()
    setDrawHistory(prev => [...prev, currentState])

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleUndo = () => {
    if (drawHistory.length === 0 || !canvasRef.current) return
    
    const historyCopy = [...drawHistory]
    const prevStateData = historyCopy.pop() // Get the last saved state
    setDrawHistory(historyCopy)
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Load and render the previous state image onto the canvas
    const img = new Image()
    img.src = prevStateData
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
    }
  }

  const getCoord = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    let clientX = 0
    let clientY = 0

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    // Scale coordinates accurately matching actual internal dimensions vs CSS visual bounding dimensions
    const x = (clientX - rect.left) * (canvas.width / rect.width)
    const y = (clientY - rect.top) * (canvas.height / rect.height)

    return { x, y }
  }

  const saveDoodle = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL()
    
    // Check if canvas is empty before saving
    const buffer = new Uint32Array(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.buffer)
    const isCanvasEmpty = !buffer.some(color => color !== 0)
    if (isCanvasEmpty) {
      alert("Draw something before saving!")
      return
    }

    const newItem = {
      id: 'doodle-' + Date.now(),
      type: 'drawing',
      image: dataUrl,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      caption: 'drawn note 🌸'
    }

    setGalleryItems(prev => [newItem, ...prev])
    clearCanvas()
  }

  const saveTypedNote = () => {
    if (!typedMessage.trim()) {
      alert("Type a message before saving!")
      return
    }

    const newItem = {
      id: 'text-' + Date.now(),
      type: 'text',
      content: typedMessage,
      font: typedFont,
      bg: typedBg,
      color: typedColor,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    setGalleryItems(prev => [newItem, ...prev])
    setTypedMessage('')
  }

  const deleteGalleryItem = (id) => {
    setGalleryItems(prev => prev.filter(item => item.id !== id))
  }

  const photos = [
    {
      id: 'Pou Hing',
      src: '/styled_meet1.jpg',
      rawSrc: '/meet1.jpg',
      caption: 'cozy corners & lantern light 🏮',
      tapeColor: 'washi-tape-lavender',
      rotation: 'rotate-[-4deg] md:rotate-[-6deg]',
      shadow: 'shadow-[6px_6px_0px_0px_#E8DFFF]',
      note: "Kathryn, thank you for sharing your journey with me. From exploring local spots to exchanging life talks. Your spiritual stories and life lessons mesmerized me and make me more knowledgeable about Jishu. Have the safest flight back to the US! 💖 - Tania",
      date: 'June 20, 2026'
    },
    {
      id: 'CC1',
      src: '/styled_meet2.jpg',
      rawSrc: '/meet2.jpg',
      caption: '1st meet 🌸',
      tapeColor: 'washi-tape-mint',
      rotation: 'rotate-[4deg] md:rotate-[5deg]',
      shadow: 'shadow-[6px_6px_0px_0px_#F5F5DC]',
      note: "Natalee, thank you for being such a bright, sweet soul. Exchanging our cultural stories and learning about each other's worlds has been a beautiful gift. I absolutely adore all your gorgeous OOTDs—you always look so chic—and your mehendi looks absolutely stunning! Have the safest flight back to the US. I will miss you so much! 💖 - Tania",
      date: 'June 12, 2026'
    },
    {
      id: 'Ind Coffee House',
      src: '/styled_meet3.jpg',
      rawSrc: '/meet3.jpg',
      caption: 'sunflower souls & retro halls 🌻',
      tapeColor: 'washi-tape-lavender',
      rotation: 'rotate-[-2deg] md:rotate-[-3deg]',
      shadow: 'shadow-[6px_6px_0px_0px_#E8DFFF]',
      note: "A sweet celebration for the best memories. Wishing both of you a beautiful, safe journey back home to the US. I'll miss you guys so much! ✨ - Tania",
      date: 'July 4, 2026'
    }
  ]

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center p-3 sm:p-4 md:p-8 pb-2 sm:pb-4 bg-[#fafcfb] overflow-x-hidden select-none font-sans">
      
      {/* --- Camera Flash Overlay --- */}
      {isFlashing && (
        <div className="fixed inset-0 z-50 pointer-events-none flash-active" />
      )}

      {/* --- Stark Brutalist Grid Mesh Overlay --- */}
      <div className="absolute inset-0 grid-overlay z-0 opacity-80 pointer-events-none" />

      {/* --- Dreamy Pastel Moving Background Blobs (Cream and Lavender Dominant) --- */}
      <div className="absolute top-[-5%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-pastel-purple/50 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[75vw] h-[75vw] rounded-full bg-pastel-beige/70 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-15%] w-[55vw] h-[55vw] rounded-full bg-pastel-purple/40 blur-[110px] pointer-events-none z-0" />

      {/* Retro Stickers Floating In Background */}
      <div className="absolute top-[12%] left-[6%] text-4xl opacity-25 select-none pointer-events-none z-0">🌿</div>
      <div className="absolute top-[35%] right-[8%] text-3xl opacity-20 select-none pointer-events-none z-0">🌸</div>
      <div className="absolute bottom-[30%] left-[4%] text-4xl opacity-25 select-none pointer-events-none z-0">☕</div>
      <div className="absolute bottom-[10%] right-[10%] text-3xl opacity-20 select-none pointer-events-none z-0">🎀</div>

      {/* --- Header Section (Brutalist Sticker Box) --- */}
      <header className="relative w-full max-w-4xl text-center mt-3 sm:mt-6 mb-4 sm:mb-8 flex flex-col items-center z-10">
        
        {/* Floating Badges (Cream and Lavender) */}
        <div className="absolute top-2 right-[8%] md:right-[18%] bg-pastel-beige border-2 border-black px-3 py-1 text-[10px] font-bold shadow-brutalist-sm rotate-[6deg] font-mono">
          SAFE TRAVELS 🌸
        </div>

        {/* Iridescent Monospace Header */}
        <div className="border-4 border-black bg-[#FFFDE8] p-4 sm:p-6 md:p-8 shadow-brutalist max-w-3xl w-full relative">
          
          {/* Accent corners */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-black" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-black" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-black" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-black" />

          {/* Hand-drawn Flower Accents on Title Box */}
          <img src="/pictures/purple_lily.svg" className="absolute -top-12 -right-10 w-24 h-auto pointer-events-none select-none drop-shadow-sm hidden sm:block" alt="lily" />
          <img src="/pictures/red_rose.svg" className="absolute -bottom-12 -left-10 w-24 h-auto pointer-events-none select-none drop-shadow-sm hidden sm:block" alt="rose" />

          {/* Sunflowers flanking the text */}
          <img src="/pictures/sunflower.svg" className="absolute left-6 top-1/2 -translate-y-1/2 w-20 h-auto pointer-events-none select-none hidden lg:block" alt="sunflower left" />
          <img src="/pictures/sunflower_2.svg" className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-auto pointer-events-none select-none hidden lg:block" alt="sunflower right" />

          {/* Sparkles */}
          <span className="absolute top-2 left-2 text-lg text-purple-400">✦</span>
          <span className="absolute bottom-2 right-2 text-lg text-emerald-400">✦</span>

          {/* Title Header - Allura Cursive */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-cursive text-[#5B0E1B] normal-case leading-tight py-3 sm:py-4 px-2 sm:px-12">
            To cozy restaurant addas and the sweetest of memories—wishing you gentle skies home, Kathryn & Natalee
          </h1>
          
          <p className="mt-2 sm:mt-4 text-[9px] md:text-xs tracking-widest text-neutral-600 font-bold font-mono">
            TILL WE MEET AGAIN
          </p>
        </div>

        {/* Send Love Button */}
        <button 
          onClick={() => setHeartsCount(prev => prev + 1)}
          className="mt-3 sm:mt-6 px-4 sm:px-5 py-2.5 bg-[#F5F5DC] hover:bg-pastel-purple text-black border-2 border-black font-extrabold text-[11px] sm:text-xs tracking-wider shadow-brutalist hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex flex-wrap items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <span>SEND HUGS & LOVE 💖</span>
          <span className="bg-black text-white px-2 py-0.5 text-[9px] font-mono">{heartsCount}</span>
        </button>
      </header>

      {/* --- Marquee Banner (Lavender Background) --- */}
      <div className="w-full border-y-2 border-black bg-pastel-purple/90 text-black py-2.5 overflow-hidden z-10 font-bold text-[9px] sm:text-xs tracking-widest font-mono relative select-none">
        <div className="whitespace-nowrap animate-marquee flex gap-8">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="inline-block flex items-center gap-2">
              <span>SAFE TRAVELS KATHRYN & NATALEE</span>
              <span className="text-purple-600">✦</span>
              <span>WE WILL MISS YOU SO MUCH</span>
              <span className="text-emerald-400">✦</span>
              <span>VISIT AGAIN SOON</span>
              <span className="text-purple-600">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* --- Decorative Vine Divider 1 --- */}
      <div className="w-full max-w-xl mx-auto my-2 sm:my-4 z-10 pointer-events-none select-none">
        <img src="/pictures/vine_horizontal.svg" className="w-full h-6 sm:h-8 object-contain" alt="vine divider" />
      </div>

      {/* --- Main Scrapbook Collage Area --- */}
      <main className="relative w-full max-w-6xl flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-stretch justify-center my-2 sm:my-4 z-10 px-1 sm:px-2">
        
        {/* COLUMN 1: Photo booth strip section (lg:col-span-4) */}
        <div className="w-full lg:col-span-4 flex flex-col items-center gap-4 relative">
          
          {/* Fern branch sticker flanking left */}
          <img src="/pictures/fern_vertical.svg" className="absolute -left-12 top-10 w-16 h-auto pointer-events-none select-none opacity-40 hidden xl:block" alt="fern left" />

          <div className="bg-white border-4 border-black p-4 shadow-brutalist max-w-[280px] w-full flex flex-col items-center relative">
            
            {/* Flower sticker on the booth */}
            <img src="/pictures/pink_blossom.svg" className="absolute -top-8 -right-6 w-12 h-auto pointer-events-none select-none" alt="blossom sticker" />

            {/* Header info */}
            <div className="w-full text-center border-b border-black pb-2 mb-3 font-mono">
              <p className="text-[9px] font-bold text-neutral-500">SOUVENIR PHOTOSTRIP</p>
              <p className="text-xs font-black tracking-tighter">BOOTH // KOL-TRIP-01</p>
            </div>

            {/* 3 Vertically Stacked Photos */}
            <div className="flex flex-col gap-3 w-full">
              {photos.map((p) => (
                <div key={p.id} className="border border-black overflow-hidden bg-neutral-50 relative aspect-[4/3] group">
                  <img 
                    src={p.rawSrc} 
                    alt={p.caption} 
                    className={`w-full h-full object-cover transition-all duration-300 ${isMonoFilter ? 'grayscale contrast-125' : ''}`}
                  />
                  <div className="absolute bottom-1 right-1 bg-black text-white px-1.5 py-0.5 text-[7px] font-bold uppercase font-mono">
                    {p.id}
                  </div>
                </div>
              ))}
            </div>

            {/* Ticket Footer / Barcode */}
            <div className="w-full mt-4 pt-3 border-t-2 border-dashed border-neutral-300 text-center flex flex-col items-center">
              <p className="font-cursive text-3xl text-black leading-none">K + N + T</p>
              <p className="text-[7px] text-neutral-500 font-bold uppercase mt-2 font-mono">JULY 2026 // BESTIES FOREVER</p>
              
              {/* Retro Barcode representation */}
              <div className="flex gap-[1px] h-6 w-full max-w-[140px] mt-2.5 overflow-hidden justify-center bg-black/5 p-1">
                {[...Array(24)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-black h-full" 
                    style={{ width: i % 3 === 0 ? '3px' : i % 5 === 0 ? '1px' : '2px' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Photobooth Shutter & Filter Controls */}
          <div className="flex flex-col gap-2 w-full max-w-[280px]">
            <button 
              onClick={handleTakeSnap}
              className="w-full py-2.5 bg-black text-[#F5F5DC] border-2 border-black font-extrabold text-xs tracking-wider shadow-brutalist hover:bg-[#F5F5DC] hover:text-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-200 cursor-pointer"
            >
              TAKE FAREWELL SNAP 📸
            </button>
            <button 
              onClick={() => setIsMonoFilter(!isMonoFilter)}
              className="w-full py-2 bg-[#F5F5DC] text-black border-2 border-black font-extrabold text-[10px] tracking-wider shadow-brutalist hover:bg-pastel-purple hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-200 cursor-pointer"
            >
              {isMonoFilter ? "SWITCH TO PASTEL COLOR 🌸" : "SWITCH TO MONO B&W 🖤"}
            </button>
          </div>
        </div>

        {/* COLUMN 2: Scattered Polaroids (lg:col-span-5) */}
        <div className="w-full lg:col-span-5 relative flex flex-col items-center justify-center min-h-[auto] lg:min-h-[460px] lg:h-[540px] mt-2 lg:mt-0">
          <p className="mb-4 lg:mb-0 lg:absolute lg:top-2 text-center text-[9px] font-bold text-neutral-400 bg-white/40 border border-black/10 px-2.5 py-1 uppercase tracking-wider select-none font-mono">
            ✦ CLICK POLAROIDS TO READ MEMORY LETTERS ✦
          </p>

          <div className="flex flex-col items-center gap-4 w-full lg:block">
            {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className={`relative w-full max-w-[220px] lg:absolute cursor-pointer transition-all duration-300 hover:z-30 hover:scale-105 active:scale-95 ${photo.rotation}`}
              style={{
                top: `${index * 13 + 14}%`,
                left: index === 0 ? '5%' : index === 1 ? 'auto' : '15%',
                right: index === 1 ? '5%' : 'auto',
                maxWidth: '200px',
                width: '100%'
              }}
            >
              {/* Plaid Gingham Washi Tape Overlay */}
              <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-6 ${photo.tapeColor} opacity-95 rotate-[-2deg] z-10`} />

              {/* Polaroid Frame */}
              <div className={`bg-white p-3.5 pb-2 border-2 border-black shadow-brutalist ${photo.shadow} flex flex-col items-center`}>
                <div className="w-full h-36 overflow-hidden bg-neutral-50 border border-black mb-3 relative group">
                  <img 
                    src={photo.src} 
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                
                {/* Caption in Allura script */}
                <p className="font-cursive text-4xl text-black leading-none mb-1">
                  {photo.caption}
                </p>
                <p className="text-[8px] text-gray-500 font-bold mt-0.5 font-mono">{photo.date}</p>
              </div>
            </div>
            ))}
          </div>

        </div>

        {/* COLUMN 3: Widgets (Convo + Music) (lg:col-span-3) */}
        <div className="w-full lg:col-span-3 flex flex-col gap-6 items-center justify-center relative">
          
          {/* Fern branch sticker flanking right */}
          <img src="/pictures/fern_vertical_2.svg" className="absolute -right-12 bottom-10 w-16 h-auto pointer-events-none select-none opacity-40 hidden xl:block" alt="fern right" />

          {/* --- Stark Brutalist Convo Widget --- */}
          <div className="glass-panel-heavy-brutalist w-full max-w-[280px] flex flex-col select-none relative">
            
            {/* Flower sticker */}
            <img src="/pictures/orange_rose.svg" className="absolute -top-10 -left-6 w-12 h-auto pointer-events-none select-none" alt="orange rose sticker" />

            {/* Widget Bar - Group Name from Screenshot */}
            <div className="flex items-center justify-between bg-pastel-purple text-black px-3 py-2 border-b-2 border-black font-mono">
              <div className="flex items-center gap-1.5 text-[8px] font-bold tracking-wider">
                <span>KoUs ❤️🌻 (Kolkata × US)</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500 border border-black"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500 border border-black"></div>
                <div className="w-2 h-2 rounded-full bg-green-500 border border-black"></div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-3 flex flex-col gap-3.5 max-h-[300px] overflow-y-auto bg-white/40 text-[10px] leading-snug">
              
              {/* Message 1: Kathryn US */}
              <div className="flex flex-col max-w-[90%] self-start">
                <span className="text-[7px] font-bold text-neutral-500 mb-0.5 ml-1 font-mono">KATHRYN [3:24 PM]</span>
                <div className="bg-white border-2 border-black px-2.5 py-1 font-bold shadow-brutalist-sm leading-snug">
                  Hi girls!!!
                </div>
              </div>

              {/* Message 2: Kathryn US Photo Share */}
              <div className="flex flex-col max-w-[90%] self-start relative">
                <span className="text-[7px] font-bold text-neutral-500 mb-0.5 ml-1 font-mono">KATHRYN [3:24 PM]</span>
                <div className="bg-white border-2 border-black p-1.5 shadow-brutalist-sm flex flex-col gap-1 relative">
                  <div className="w-28 h-20 bg-neutral-100 border border-neutral-300 overflow-hidden">
                    <img src="/meet3.jpg" className="w-full h-full object-cover grayscale-0" alt="meeting preview" />
                  </div>
                  {/* Heart reaction badge */}
                  <span className="absolute -bottom-2 -right-1 bg-white border border-black rounded-full px-1 py-0.5 text-[8px]">❤️</span>
                </div>
              </div>

              {/* Message 3: Tania */}
              <div className="flex flex-col max-w-[90%] self-end">
                <span className="text-[7px] font-bold text-neutral-500 mb-0.5 mr-1 text-right font-mono">TANIA 🩰 [3:58 PM]</span>
                <div className="bg-pastel-purple border-2 border-black px-2.5 py-1 font-bold shadow-brutalist-sm leading-snug">
                  Hellow!!! 🫶🏻
                </div>
              </div>

              {/* Message 4: Tania */}
              <div className="flex flex-col max-w-[90%] self-end">
                <span className="text-[7px] font-bold text-neutral-500 mb-0.5 mr-1 text-right font-mono">TANIA 🩰 [3:58 PM]</span>
                <div className="bg-pastel-purple border-2 border-black px-2.5 py-1 font-bold shadow-brutalist-sm leading-snug">
                  I got my train but had to run to catch that😀
                </div>
              </div>

              {/* System Note: Group Name Change */}
              <div className="bg-neutral-100/90 border border-neutral-400 self-center py-1 px-2 text-[7px] font-bold text-neutral-600 font-mono text-center leading-tight shadow-brutalist-sm max-w-[95%]">
                You changed the group name to "KoUs ❤️🌻 (Kolkata × US)"
              </div>

              {/* Message 5: Tania */}
              <div className="flex flex-col max-w-[90%] self-end">
                <span className="text-[7px] font-bold text-neutral-500 mb-0.5 mr-1 text-right font-mono">TANIA 🩰 [3:59 PM]</span>
                <div className="bg-pastel-purple border-2 border-black px-2.5 py-1 font-bold shadow-brutalist-sm leading-snug">
                  How is the group name? 😀
                </div>
              </div>
            </div>
          </div>

          {/* --- Retro Music Player Widget --- */}
          <div className="glass-panel-brutalist w-full max-w-[280px] p-4 flex flex-col gap-3 select-none">
            <div className="flex items-center gap-3">
              
              {/* Spinning Vinyl Cover */}
              <div 
                className={`w-12 h-12 rounded-full bg-neutral-900 border-2 border-black relative flex items-center justify-center cursor-pointer shadow-brutalist-sm overflow-hidden flex-shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}
                onClick={togglePlay}
              >
                <div className="absolute inset-0.5 rounded-full border border-neutral-700/60" />
                
                {/* Album cover */}
                <div className="w-4 h-4 rounded-full bg-pastel-purple border border-black overflow-hidden z-10">
                  <img src="/cake.png" className="w-full h-full object-cover" />
                </div>
                <div className="absolute w-1 h-1 rounded-full bg-white z-20" />
              </div>

              {/* Music Details */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <span className="text-[7px] font-bold text-neutral-500 uppercase tracking-widest font-mono">AUDIO PLAYER</span>
                <span className="text-[10px] font-extrabold text-black truncate leading-tight uppercase font-serif">Until I Found You</span>
                <span className="text-[8px] text-gray-500 font-bold font-mono">Stephen Sanchez</span>

                {/* Animated waves */}
                <div className="h-3 flex items-center gap-0.5 mt-0.5">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-[1.5px] bg-black rounded-full transition-all duration-300"
                      style={{ 
                        height: isPlaying ? `${Math.floor(Math.random() * 10) + 3}px` : '2px',
                        animation: isPlaying ? `pulse-slow 0.8s ease-in-out infinite alternate` : 'none',
                        animationDelay: `${i * 0.12}s`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <button 
                onClick={togglePlay}
                className="w-8 h-8 rounded-none bg-pastel-purple hover:bg-black hover:text-white border-2 border-black text-black flex items-center justify-center shadow-brutalist-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-200 cursor-pointer flex-shrink-0"
              >
                {isPlaying ? (
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* --- Decorative Vine Divider 2 --- */}
      <div className="w-full max-w-xl mx-auto my-2 sm:my-4 z-10 pointer-events-none select-none">
        <img src="/pictures/vine_horizontal.svg" className="w-full h-6 sm:h-8 object-contain rotate-180" alt="vine divider" />
      </div>

      {/* ================================================================= */}
      {/*   INTERACTIVE DOODLE DRAWING PAD & NOTE EDITOR SECTION           */}
      {/* ================================================================= */}
      <section className="w-full max-w-5xl z-10 px-4 mb-8">
        <div className="border-4 border-black bg-white shadow-brutalist p-5 md:p-8 relative">
          
          {/* Hand-drawn Red Rose Accents on Doodle Section Corners */}
          <img src="/pictures/red_rose.svg" className="absolute -top-12 -left-10 w-20 h-auto pointer-events-none select-none drop-shadow-sm z-20 hidden sm:block" alt="red rose corner left" />
          <img src="/pictures/red_rose.svg" className="absolute -bottom-12 -right-10 w-20 h-auto pointer-events-none select-none scale-x-[-1] drop-shadow-sm z-20 hidden sm:block" alt="red rose corner right" />

          {/* Corner accents */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-black" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-black" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-black" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-black" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6 border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              <h2 className="text-sm md:text-base font-black tracking-tighter uppercase font-serif">
                DOODLE BOARD & NOTE PAD
              </h2>
            </div>
            <span className="sm:ml-auto text-[8px] font-bold text-neutral-500 bg-pastel-purple/30 border border-black px-2 py-0.5 font-mono self-start sm:self-auto">
              LEAVE A NOTE
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* COLUMN A: Editor Canvas / Notepad (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-4 border-2 border-black p-4 bg-[#fafcfb] relative">
              
              {/* Mode Tabs */}
              <div className="flex flex-col sm:flex-row gap-2 border-b-2 border-black pb-3">
                <button 
                  onClick={() => setActiveTab('draw')}
                  className={`px-4 py-1.5 text-xs font-bold border-2 border-black shadow-brutalist-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer ${activeTab === 'draw' ? 'bg-pastel-purple text-black' : 'bg-white text-neutral-600'}`}
                >
                  DRAW A DOODLE ✏️
                </button>
                <button 
                  onClick={() => setActiveTab('type')}
                  className={`px-4 py-1.5 text-xs font-bold border-2 border-black shadow-brutalist-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer ${activeTab === 'type' ? 'bg-[#FFFDE8] text-black' : 'bg-white text-neutral-600'}`}
                >
                  TYPE A NOTE 📝
                </button>
              </div>

              {activeTab === 'draw' ? (
                /* DRAW TAB */
                <div className="flex flex-col gap-4">
                  {/* Drawing Area */}
                  <div className="relative border-2 border-black bg-white shadow-brutalist-sm overflow-hidden aspect-[4/3] w-full">
                    
                    {/* Grid paper background effect */}
                    <div className="absolute inset-0 grid-overlay z-0 opacity-40 pointer-events-none" />
                    
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none"
                    />
                  </div>

                  {/* Draw Controls */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    {/* Pastel Shade Pens Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono">PASTEL PENS:</span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { color: '#5B0E1B', name: 'Dark Crimson' },
                          { color: '#DDA0DD', name: 'Lavender Plum' },
                          { color: '#4CAF50', name: 'Mint Green' },
                          { color: '#FFB6C1', name: 'Rose Pink' },
                          { color: '#F5D547', name: 'Sunflower Yellow' }
                        ].map((item) => (
                          <button
                            key={item.color}
                            onClick={() => setPenColor(item.color)}
                            title={item.name}
                            className={`w-6 h-6 rounded-full border-2 border-black transition-all cursor-pointer ${penColor === item.color ? 'scale-110 ring-2 ring-purple-400' : 'opacity-85'}`}
                            style={{ backgroundColor: item.color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Pen Brush Sizes */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold font-mono">PEN SIZE:</span>
                      <div className="flex gap-1.5">
                        {[2, 4, 8, 12].map((size) => (
                          <button
                            key={size}
                            onClick={() => setBrushSize(size)}
                            className={`w-6 h-6 border-2 border-black flex items-center justify-center font-bold text-[9px] cursor-pointer ${brushSize === size ? 'bg-black text-white' : 'bg-white text-black'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pen Stroke Types */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold font-mono">PEN STYLE:</span>
                      <div className="flex gap-1.5">
                        {[
                          { id: 'normal', label: 'Normal 🖋️' },
                          { id: 'brush', label: 'Brush 🖌️' },
                          { id: 'dotted', label: 'Dotted ⵗ' },
                          { id: 'eraser', label: 'Eraser 🧽' }
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setStrokeType(type.id)}
                            className={`px-2.5 py-1 border-2 border-black text-[9px] font-bold cursor-pointer transition-all ${strokeType === type.id ? 'bg-black text-white' : 'bg-white text-black'}`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Canvas Action Buttons */}
                  <div className="flex flex-wrap gap-2 justify-start sm:justify-end mt-2">
                    <button
                      onClick={handleUndo}
                      disabled={drawHistory.length === 0}
                      className={`px-4 py-2 border-2 border-black text-xs font-bold shadow-brutalist-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer ${drawHistory.length === 0 ? 'opacity-40 cursor-not-allowed' : 'bg-[#eee9ff] hover:bg-pastel-purple text-black'}`}
                    >
                      UNDO ↩️
                    </button>
                    <button
                      onClick={clearCanvas}
                      className="px-4 py-2 border-2 border-black text-xs font-bold bg-[#fafcfb] hover:bg-neutral-100 shadow-brutalist-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                    >
                      CLEAR CANVAS
                    </button>
                    <button
                      onClick={saveDoodle}
                      className="px-4 py-2 border-2 border-black text-xs font-bold bg-pastel-purple text-black shadow-brutalist hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                    >
                      SAVE TO GALLERY ✦
                    </button>
                  </div>
                </div>
              ) : (
                /* TYPE TAB */
                <div className="flex flex-col gap-4">
                  {/* Textarea Card Preview */}
                  <div className={`border-2 border-black p-5 shadow-brutalist-sm min-h-[160px] flex items-center justify-center relative ${typedBg}`}>
                    <div className="absolute inset-0 grid-overlay z-0 opacity-20 pointer-events-none" />
                    
                    <textarea
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      placeholder="Type your message here for Kathryn and Natalee..."
                      className={`w-full bg-transparent border-none text-center resize-none outline-none z-10 text-base sm:text-xl font-bold tracking-wide leading-relaxed placeholder-black/35 ${typedFont} ${typedColor}`}
                      rows={4}
                    />
                  </div>

                  {/* Font and Colors Customization */}
                  <div className="flex flex-col gap-3.5 border-t border-dashed border-black/20 pt-4">
                    
                    {/* Font Selectors */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold font-mono">SELECT FONT:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'font-cursive', label: 'Cursive' },
                          { id: 'font-serif', label: 'Classic Serif' },
                          { id: 'font-mono', label: 'Retro Mono' },
                          { id: 'font-sans', label: 'Sans Normal' }
                        ].map((font) => (
                          <button
                            key={font.id}
                            onClick={() => setTypedFont(font.id)}
                            className={`px-2.5 py-1 border-2 border-black text-[9px] font-bold cursor-pointer transition-all ${typedFont === font.id ? 'bg-black text-white' : 'bg-white text-black'}`}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Pastel Background Selectors */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold font-mono">CARD COLOR:</span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { color: 'bg-[#FFFDE8]', name: 'Butter Cream' },
                          { color: 'bg-[#eee9ff]', name: 'Lavender' },
                          { color: 'bg-[#e2f5ee]', name: 'Mint Cream' },
                          { color: 'bg-[#ffd6e0]', name: 'Soft Pink' },
                          { color: 'bg-white', name: 'Plain White' }
                        ].map((bg) => (
                          <button
                            key={bg.color}
                            onClick={() => setTypedBg(bg.color)}
                            title={bg.name}
                            className={`w-5 h-5 rounded-none border-2 border-black transition-all cursor-pointer ${typedBg === bg.color ? 'scale-110 ring-2 ring-purple-400' : 'opacity-85'}`}
                            style={{
                              backgroundColor: bg.color === 'bg-[#FFFDE8]' ? '#FFFDE8' :
                                               bg.color === 'bg-[#eee9ff]' ? '#eee9ff' :
                                               bg.color === 'bg-[#e2f5ee]' ? '#e2f5ee' :
                                               bg.color === 'bg-[#ffd6e0]' ? '#ffd6e0' : '#ffffff'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Text Color Selectors */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold font-mono">TEXT COLOR:</span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { color: 'text-[#5B0E1B]', name: 'Dark Crimson' },
                          { color: 'text-black', name: 'Black' },
                          { color: 'text-[#5D8A4E]', name: 'Eucalyptus' },
                          { color: 'text-purple-700', name: 'Deep Purple' }
                        ].map((txt) => (
                          <button
                            key={txt.color}
                            onClick={() => setTypedColor(txt.color)}
                            title={txt.name}
                            className={`w-5 h-5 rounded-none border-2 border-black flex items-center justify-center font-bold text-[8px] cursor-pointer transition-all ${typedColor === txt.color ? 'ring-2 ring-purple-400 scale-110' : 'opacity-70'}`}
                            style={{
                              color: txt.color === 'text-[#5B0E1B]' ? '#5B0E1B' :
                                     txt.color === 'text-black' ? '#000000' :
                                     txt.color === 'text-[#5D8A4E]' ? '#5D8A4E' : '#7e22ce'
                            }}
                          >
                            Aa
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Save note button */}
                  <div className="flex justify-start sm:justify-end mt-2">
                    <button
                      onClick={saveTypedNote}
                      className="px-4 py-2 border-2 border-black text-xs font-bold bg-[#FFFDE8] text-black shadow-brutalist hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                    >
                      SAVE NOTE CARD ✦
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN B: Saved Gallery (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-4 border-2 border-black p-4 bg-[#FEFAD4]/10 min-h-[300px]">
              
              <div className="border-b border-black pb-2">
                <span className="text-[10px] font-bold font-mono text-neutral-500">SAVED NOTES & DOODLES GALLERY ({galleryItems.length})</span>
              </div>

              {galleryItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-black/35 bg-white/40">
                  <span className="text-xl">🏜️</span>
                  <p className="text-[10px] font-bold text-neutral-400 mt-2 uppercase font-mono">The gallery is empty.<br />Write or draw something above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[360px] p-1">
                  {galleryItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white p-2 pb-1 border border-black shadow-brutalist-sm flex flex-col relative group hover:scale-[1.02] transition-transform duration-200"
                    >
                      {/* Delete button (displays on hover) */}
                      <button
                        onClick={() => deleteGalleryItem(item.id)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-700 text-white border border-black w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                        title="Delete note"
                      >
                        ×
                      </button>

                      {item.type === 'drawing' ? (
                        /* Drawn Polaroid */
                        <div className="flex flex-col items-center">
                          <div className="w-full aspect-[4/3] border border-black bg-[#fafcfb] overflow-hidden p-1 flex items-center justify-center relative">
                            <img src={item.image} className="w-full h-full object-contain" alt="drawing note" />
                          </div>
                          <p className="text-[8px] font-bold font-mono mt-1 text-center truncate w-full text-neutral-500">
                            {item.caption}
                          </p>
                        </div>
                      ) : (
                        /* Typed Polaroid */
                        <div className={`w-full aspect-[4/3] border border-black p-2 flex flex-col justify-between overflow-hidden relative ${item.bg}`}>
                          <p className={`text-[8px] font-bold text-center leading-normal ${item.font} ${item.color}`}>
                            "{item.content}"
                          </p>
                          <span className="text-[6px] font-bold font-mono text-neutral-400 text-center mt-1 block">
                            {item.date}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-center mt-1 border-t border-dashed border-neutral-200 pt-1">
                        <span className="text-[6px] font-bold text-neutral-400 uppercase font-mono">{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- Section: Bengali Phrases Dictionary --- */}
      <section className="w-full max-w-5xl z-10 px-2 sm:px-4 mb-4 sm:mb-8">
        <div className="border-4 border-black bg-white shadow-brutalist p-3 sm:p-5 md:p-8 relative">

          {/* Sunflower decal in Dictionary */}
          <img src="/pictures/sunflower.svg" className="absolute -top-10 -right-6 w-16 h-auto pointer-events-none select-none hidden sm:block" alt="sunflower" />

          {/* Corner accents */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-black" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-black" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-black" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-black" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5 border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗣️</span>
              <h2 className="text-base font-serif font-bold tracking-tight uppercase">
                BENGALI PHRASES DICTIONARY
              </h2>
            </div>
            <span className="sm:ml-auto text-[8px] font-bold text-neutral-500 bg-pastel-purple/30 border border-black px-2 py-0.5 font-mono self-start sm:self-auto">
              BENGALI → ENGLISH SOUVENIR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {phrases.map((item) => (
              <div key={item.id} className="bg-pastel-beige/50 border-2 border-black p-3 shadow-brutalist-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-200 relative group">
                {/* Delete Phrase Button */}
                <button
                  onClick={() => handleDeletePhrase(item.id)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-700 text-white border border-black w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                  title="Remove phrase"
                >
                  ×
                </button>

                <div className="flex items-start gap-2">
                  <span className="text-lg">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1 font-mono">
                      <span className="text-[10px] font-black bg-pastel-purple border border-black px-1.5 py-0.5">
                        "{item.bengali}"
                      </span>
                      <span className="text-[9px] font-bold text-neutral-400">→</span>
                      <span className="text-[10px] font-black bg-[#F5F5DC] border border-black px-1.5 py-0.5">
                        "{item.english}"
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-neutral-600 leading-snug">
                      {item.note}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Phrase Form Controls */}
          <div className="border-t-2 border-dashed border-black/25 pt-4">
            {!isAddingPhrase ? (
              <button
                onClick={() => setIsAddingPhrase(true)}
                className="px-4 py-2 border-2 border-black text-xs font-bold bg-[#FFFDE8] text-black shadow-brutalist-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>ADD NEW PHRASE TO LEARN ➕</span>
              </button>
            ) : (
              <form onSubmit={handleAddPhrase} className="bg-neutral-50 border-2 border-black p-4 flex flex-col gap-3 max-w-xl">
                <div className="flex items-center justify-between border-b border-black/20 pb-1.5 mb-1">
                  <span className="text-[10px] font-bold font-mono">NEW PHRASE SOUVENIR</span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingPhrase(false)}
                    className="text-xs font-bold hover:text-red-500 cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold font-mono">BENGALI PHRASE:</label>
                    <input 
                      type="text" 
                      value={newBengali}
                      onChange={(e) => setNewBengali(e.target.value)}
                      placeholder="e.g. Kamon Acho?"
                      className="border border-black px-2 py-1.5 bg-white text-xs font-bold font-mono uppercase"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold font-mono">ENGLISH MEANING:</label>
                    <input 
                      type="text" 
                      value={newEnglish}
                      onChange={(e) => setNewEnglish(e.target.value)}
                      placeholder="e.g. How are you?"
                      className="border border-black px-2 py-1.5 bg-white text-xs font-bold font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[9px] font-bold font-mono">EMOJI:</label>
                    <select 
                      value={newEmoji}
                      onChange={(e) => setNewEmoji(e.target.value)}
                      className="border border-black px-2 py-1.5 bg-white text-xs font-bold font-mono cursor-pointer"
                    >
                      {['💬', '🌸', '🤝', '🙏', '🙇‍♀️', '✨', '☕', '🍲', '🏮', '🌻'].map(em => (
                        <option key={em} value={em}>{em}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-9 flex flex-col gap-1">
                    <label className="text-[9px] font-bold font-mono">MEMORY CONTEXT NOTE:</label>
                    <input 
                      type="text" 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="e.g. Learned at Indian Coffee House"
                      className="border border-black px-2 py-1.5 bg-white text-xs font-bold font-mono uppercase"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="mt-2 self-start px-4 py-2 border-2 border-black text-xs font-bold bg-pastel-purple text-black shadow-brutalist hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                >
                  ADD TO DICTIONARY ✦
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* --- Section: Timezone Friendship Note --- */}
      <section className="w-full max-w-5xl z-10 px-2 sm:px-4 mb-4 sm:mb-8">
        <div className="border-4 border-black bg-pastel-purple/20 shadow-brutalist p-3 sm:p-5 md:p-6 text-center relative">
          
          {/* Anemone flower sticker */}
          <img src="/pictures/white_anemone.svg" className="absolute -bottom-10 -right-6 w-16 h-auto pointer-events-none select-none hidden sm:block" alt="anemone" />
          
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-black" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-black" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-black" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-black" />

          <p className="text-[10px] font-bold text-neutral-500 tracking-widest mb-2 font-mono">TIMEZONE MATH ⏰</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 mb-3 font-mono">
            <div className="bg-white border-2 border-black px-4 py-2 shadow-brutalist-sm w-full sm:min-w-[120px] max-w-[220px] md:max-w-none">
              <p className="text-[8px] font-bold text-neutral-500">🇮🇳 KOLKATA (IST)</p>
              <p className="text-sm font-black text-purple-700 mt-1">
                {currentDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black text-purple-600">+9.5 HRS AHEAD</p>
              <p className="text-base">↔️</p>
            </div>
            <div className="bg-white border-2 border-black px-4 py-2 shadow-brutalist-sm min-w-[120px]">
              <p className="text-[8px] font-bold text-neutral-500">🇺🇸 USA (EST)</p>
              <p className="text-sm font-black text-emerald-700 mt-1">
                {currentDate.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
          <p className="text-xs font-semibold text-neutral-800 bg-[#F5F5DC] border border-black inline-block px-3 py-1.5">
            "YOUR 3AM IS MY 12:30PM — BUT I'LL ALWAYS PICK UP 💌"
          </p>
        </div>
      </section>

      {/* --- Interactive Polaroid Letter Overlay (Modal) --- */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white border-4 border-black p-6 max-w-sm w-full shadow-brutalist-lg relative flex flex-col items-center text-center animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Plaid Gingham tape */}
            <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 ${selectedPhoto.tapeColor} opacity-95 rotate-[1deg]`} />

            {/* Note Frame */}
            <div className="w-20 h-20 rounded-none overflow-hidden bg-neutral-50 border-2 border-black shadow-brutalist-sm mb-4 mt-2">
              <img src={selectedPhoto.src} className="w-full h-full object-cover" />
            </div>

            <h3 className="text-2xl font-serif font-bold text-black tracking-tight uppercase mb-0.5">
              {selectedPhoto.caption}
            </h3>
            <p className="text-[9px] text-gray-500 font-bold mb-4 font-mono">{selectedPhoto.date}</p>

            <p className="text-xs font-medium text-neutral-800 leading-relaxed bg-pastel-purple/15 p-4 border-2 border-dashed border-black">
              "{selectedPhoto.note}"
            </p>

            <button
              onClick={() => setSelectedPhoto(null)}
              className="mt-6 px-5 py-2.5 bg-black hover:bg-pastel-purple hover:text-black text-white font-extrabold border-2 border-black text-xs transition-all duration-200 shadow-brutalist hover:shadow-none hover:translate-x-1 hover:translate-y-1 cursor-pointer"
            >
              CLOSE LETTER ✦
            </button>
          </div>
        </div>
      )}

      {/* --- Footer & Stark Call To Action --- */}
      <footer className="relative w-full text-center mt-4 sm:mt-8 mb-3 sm:mb-6 flex flex-col items-center justify-center z-10 font-sans">
        
        {/* Floating pill link */}
        <div className="relative inline-flex items-center gap-4 justify-center">
          <img src="/pictures/pink_blossom.svg" className="w-10 h-auto pointer-events-none select-none hidden sm:block" alt="left blossom" />
          
          <a 
            href="https://digibouquet.vercel.app/bouquet/7e761783-5736-47d4-803c-eed06bf248de"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-[#FFFDE8] text-black border-2 border-black font-extrabold tracking-wider hover:bg-black hover:text-[#FFFDE8] transition-all duration-300 shadow-brutalist hover:shadow-none hover:translate-x-1 hover:translate-y-1 group z-20 text-xs sm:text-sm text-center"
          >
            <span>OPEN OUR DIGIBOUQUET 🌸</span>
          </a>

          <img src="/pictures/pink_blossom.svg" className="w-10 h-auto pointer-events-none select-none scale-x-[-1] hidden sm:block" alt="right blossom" />
        </div>

        {/* Watermark */}
        <p className="text-[9px] text-neutral-500 font-bold mt-2 sm:mt-5 tracking-widest uppercase font-mono">
          MADE FOR K & N BY TANIA
        </p>
      </footer>
    </div>
  )
}

export default App
