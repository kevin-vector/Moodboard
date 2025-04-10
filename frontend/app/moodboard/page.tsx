"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, ExternalLink, Lock, Plus, X, Unlock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const tagCategories = {
  Mediums: [
    "illustration",
    "collage",
    "3D render",
    "motion graphics",
    "animation",
    "painting",
    "drawing",
    "sculpture",
    "printmaking",
    "installation art",
    "AR/VR",
    "AI-generated",
    "cinematography",
    "fashion design",
    "product design",
    "industrial design",
    "UI design",
    "architecture",
    "interior design",
  ],
  "Composition/Elements": ["layout", "grid system", "negative space", "balance", "asymmetry", "overlap", "depth"],
  "Symbolic/Semiotic": ["iconography", "diagram", "map", "infographic", "emoji", "logomark", "pictogram"],
  Techniques: [
    "double exposure",
    "halftone",
    "glitch",
    "pixel art",
    "datamoshing",
    "silhouette",
    "line art",
    "scanography",
    "hand-drawn",
  ],
  "Texture/Material": [
    "metal",
    "glass",
    "concrete",
    "plastic",
    "paper",
    "fabric",
    "wood",
    "skin",
    "fur",
    "water",
    "fire",
    "smoke",
    "dust",
    "mirror",
  ],
  "Color Families": [
    "black & white",
    "monochrome",
    "neon",
    "pastel",
    "primary colors",
    "complementary",
    "analogous",
    "duotone",
    "CMYK",
    "RGB",
  ],
  "Color Temperatures": ["warm", "cool", "neutral", "vivid", "muted"],
  "Color Keywords": [
    "earth tones",
    "sunset tones",
    "underwater tones",
    "futuristic palette",
    "natural palette",
    "nostalgic palette",
    "psychedelic colors",
    "vaporwave palette",
    "minimal palette",
    "high contrast",
  ],
  "Style/Aesthetic": [
    "brutalism",
    "minimalism",
    "maximalism",
    "cyberpunk",
    "solarpunk",
    "biophilic",
    "memphis",
    "bauhaus",
    "de stijl",
    "baroque",
    "vintage",
    "retro-futurism",
    "Y2K",
    "new ugly",
    "editorial",
    "high fashion",
    "corporate memphis",
    "dada",
    "surrealism",
    "art deco",
    "modernist",
  ],
  "Mood/Vibe": [
    "dreamy",
    "gritty",
    "ethereal",
    "industrial",
    "romantic",
    "playful",
    "melancholy",
    "serene",
    "bold",
    "mysterious",
    "chaotic",
    "clinical",
    "organic",
    "eerie",
    "luxurious",
  ],
  Contextual: [
    "editorial layout",
    "poster design",
    "book cover",
    "packaging",
    "social post",
    "web landing page",
    "billboard",
    "pitch deck",
    "logo system",
    "ad campaign",
  ],
}

const allTags = Object.values(tagCategories).flat()

const generateMockImages = async (searchQuery = "", count = 7) => {
  let fetchedImages = [];

  try {
    console.log(`Searching for images with query: ${searchQuery}`);
    
    const url = `${window.location.origin}/api/search?query=${searchQuery}`.replace('3000', '8000')

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Images fetched successfully:", result.images.length);
    if(result.images.length === 0){
      return Array(7)
      .fill(null)
      .map((_, index) => {
        const randomTag = allTags[Math.floor(Math.random() * allTags.length)]

        return {
          id: `img-${Date.now()}-${index}`,
          url: `sample${index + 1}.png`,
          tag: randomTag,
          isLocked: false,
          position: index,
        }
      })
    }
    fetchedImages = result.images.map((url: string, index: number) => ({
      id: `img-${Date.now()}-${index}`,
      url: url,
      tag: searchQuery,
      isLocked: false,
      position: index,
    }));

    console.log("fetchedImages", fetchedImages);
    return fetchedImages;
  } catch (error) {
    console.log("Error fetching images:", error);
    return Array(7)
    .fill(null)
    .map((_, index) => {
      const randomTag = allTags[Math.floor(Math.random() * allTags.length)]

      return {
        id: `img-${Date.now()}-${index}`,
        url: `sample${index + 1}.png`,
        tag: randomTag,
        isLocked: false,
        position: index,
      }
    })
  }
}

const findRelatedTags = (tag: string) => {
  let tagCategory: string | null = null
  for (const [category, tags] of Object.entries(tagCategories)) {
    if (tags.includes(tag)) {
      tagCategory = category
      break
    }
  }

  if (tagCategory) {
    return tagCategories[tagCategory as keyof typeof tagCategories].filter((t) => t !== tag)
  }

  return allTags.filter((t) => t !== tag).slice(0, 10)
}

export default function MoodboardGenerator() {
  const [images, setImages] = useState<
    ({ id: string; url: string; tag: string; isLocked: boolean; position: number })[]
  >([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [showSpacebarHint, setShowSpacebarHint] = useState(true)
  const [filteredTags, setFilteredTags] = useState<string[]>([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    (async () => {
      const initialImages = await generateMockImages("", 7)
      setImages(initialImages)
      console.log("initialImages", initialImages)
      setIsLoading(false)
    })()
    const timer = setTimeout(() => {
      setShowSpacebarHint(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTags([])
      return
    }

    const filtered = allTags.filter((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6) // Limit to 6 suggestions

    setFilteredTags(filtered)
  }, [searchQuery])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.code === "Space" && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        refreshImages()
        console.log("backspace clicked")
      }
    },
    [searchQuery],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  const refreshImages = ( ) => {
    setIsLoading(true)
    setShowSpacebarHint(false)

    setTimeout(async () => {
      const lockedImages = images.filter((img) => img.isLocked);
    
      const currentCount = images.length;
      const newImagesCount = currentCount - lockedImages.length;
      console.log("newImagesCount", newImagesCount);
    
      const newImages = await generateMockImages(searchQuery, newImagesCount);
    
      setImages([...lockedImages, ...newImages]);
      setIsLoading(false);
    }, 300);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    refreshImages()
    setIsSearchFocused(false)
  }

  const handleTagSelect = (tag: string) => {
    setSearchQuery(tag)
    setIsSearchFocused(false)
    refreshImages()
  }

  const toggleLock = (id: string) => {
    setImages((prevImages) => prevImages.map((img) => (img.id === id ? { ...img, isLocked: !img.isLocked } : img)))
  }

  const addImage = () => {
    if (images.length >= 12) {
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      const newImage = generateMockImages(searchQuery, 1)[0]
      setImages((prevImages) => [...prevImages, newImage])
      setIsLoading(false)
    }, 300)
  }

  const removeImage = (id: string) => {
    if (images.length <= 1) {
      return
    }

    setImages((prevImages) => prevImages.filter((img) => img.id !== id))
  }

  const handleExport = async () => {
    if (images.length === 0 || isSaving) return

    setIsSaving(true)
    setSaveError("")

    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      const canvasWidth = 1200
      const canvasHeight = 800

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      if (!ctx) {
        console.error("Failed to get canvas context");
        return;
      }

      ctx.fillStyle = "#121212" // Dark background
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      let positions: { x: number; y: number; width: number; height: number }[] = []

      if (images.length <= 3) {
        const width = canvasWidth / images.length
        positions = images.map((_, i) => ({
          x: i * width,
          y: 0,
          width: width,
          height: canvasHeight,
        }))
      } else if (images.length === 4) {
        const width = canvasWidth / 2
        const height = canvasHeight / 2
        positions = [
          { x: 0, y: 0, width, height },
          { x: width, y: 0, width, height },
          { x: 0, y: height, width, height },
          { x: width, y: height, width, height },
        ]
      } else if (images.length <= 6) {
        const width = canvasWidth / 3
        const height = canvasHeight / 2
        positions = Array(6)
          .fill(null)
          .map((_, i) => ({
            x: (i % 3) * width,
            y: Math.floor(i / 3) * height,
            width,
            height,
          }))
      } else if (images.length <= 9) {
        const width = canvasWidth / 3
        const height = canvasHeight / 3
        positions = Array(9)
          .fill(null)
          .map((_, i) => ({
            x: (i % 3) * width,
            y: Math.floor(i / 3) * height,
            width,
            height,
          }))
      } else {
        const width = canvasWidth / 4
        const height = canvasHeight / 3
        positions = Array(12)
          .fill(null)
          .map((_, i) => ({
            x: (i % 4) * width,
            y: Math.floor(i / 4) * height,
            width,
            height,
          }))
      }

      for (let i = 0; i < Math.min(images.length, positions.length); i++) {
        const img = images[i]
        const pos = positions[i]

        try {
          const imgElement = new Image()

          await new Promise((resolve, reject) => {
            imgElement.onload = resolve
            imgElement.onerror = reject

            imgElement.crossOrigin = "anonymous"
            imgElement.src = img.url

            setTimeout(() => reject(new Error("Image load timeout")), 5000)
          })

          ctx.drawImage(imgElement, pos.x, pos.y, pos.width, pos.height)

          if (img.isLocked) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
            ctx.beginPath()
            ctx.arc(pos.x + 20, pos.y + 20, 15, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = "#ff9800"
            ctx.font = "bold 14px sans-serif"
            ctx.textAlign = "center"
            ctx.fillText("🔒", pos.x + 20, pos.y + 24)
          }
        } catch (imgError) {
          console.warn(`Failed to load image ${i}:`, imgError)

          ctx.fillStyle = "#2a2a2a"
          ctx.fillRect(pos.x, pos.y, pos.width, pos.height)

          ctx.fillStyle = "#ffffff"
          ctx.font = "16px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText("Image unavailable", pos.x + pos.width / 2, pos.y + pos.height / 2)
        }
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "right"
      ctx.fillText("Generated with Moodboard", canvasWidth - 10, canvasHeight - 10)

      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `moodboard-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error saving moodboard:", error)
      setSaveError("There was an error saving your moodboard. CORS restrictions may prevent loading some images.")
    } finally {
      setIsSaving(false)
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text

    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(`(${escapedQuery})`, "gi")
      const parts = text.split(regex)

      return (
        <>
          {parts.map((part, i) =>
            regex.test(part) ? (
              <span key={i} className="bg-primary/20 text-primary-foreground font-medium">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </>
      )
    } catch (e) {
      return text
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <header className="h-16 px-4 flex items-center justify-between border-b border-border">
        <div className="relative w-72">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input block w-full pl-10 pr-3 py-2 bg-secondary rounded-md border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="/imagine"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              autoComplete="off"
            />
          </form>

          <AnimatePresence>
            {isSearchFocused && filteredTags.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                className="absolute z-10 mt-1 w-full bg-card rounded-md shadow-lg border border-border overflow-hidden"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-1">
                  <div className="space-y-0.5">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary rounded-sm flex items-center gap-2"
                        onClick={() => handleTagSelect(tag)}
                      >
                        <span>{highlightMatch(tag, searchQuery)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showSpacebarHint && (
            <motion.div
              className="absolute left-1/2 transform -translate-x-1/2 text-sm text-orange-500 uppercase tracking-wider"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Press space to generate moodboards
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleExport}
          disabled={isSaving || images.length === 0}
          className={`text-sm text-orange-500 uppercase tracking-wider flex items-center gap-1 hover:text-orange-400 transition-colors ${
            isSaving || images.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSaving ? (
            <>
              <div className="h-3 w-3 border border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              Exporting...
            </>
          ) : (
            <>
              Export
              <ExternalLink size={14} />
            </>
          )}
        </button>
      </header>

      {/* Moodboard Grid */}
      <div className={`moodboard-grid images-${images.length} p-2`}>
        {isLoading
          ? // Loading state
            Array(images.length || 7)
              .fill(null)
              .map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className={`image-${index + 1} bg-secondary animate-pulse rounded-sm`}
                ></div>
              ))
          : // Images
            images.map((image, index) => (
              <motion.div
                key={image.id}
                className={`image-${index + 1} overflow-hidden rounded-sm relative`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={image.tag}
                  className="w-full h-full object-cover"
                  loading="eager"
                />

                {/* Image hover controls */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/40 z-10">
                  <div className="flex gap-3">
                    <button
                      className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center text-orange-500 hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLock(image.id)
                      }}
                      title={image.isLocked ? "Unlock image" : "Lock image"}
                    >
                      {image.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>

                    <button
                      className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center text-green-500 hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation()
                        addImage()
                      }}
                      title="Add new image"
                      disabled={images.length >= 12}
                      style={{ opacity: images.length >= 12 ? 0.5 : 1 }}
                    >
                      <Plus size={18} />
                    </button>

                    <button
                      className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center text-red-500 hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(image.id)
                      }}
                      title="Remove image"
                      disabled={images.length <= 1}
                      style={{ opacity: images.length <= 1 ? 0.5 : 1 }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Optional: Tag overlay on hover */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-end">
                  <div className="p-2 w-full transform translate-y-full hover:translate-y-0 transition-transform">
                    <div className="text-xs text-white/80">{image.tag}</div>
                  </div>
                </div>

                {/* Lock indicator */}
                {image.isLocked && (
                  <div className="absolute top-2 left-2 bg-black/70 text-orange-500 p-1 rounded-full">
                    <Lock size={14} />
                  </div>
                )}
              </motion.div>
            ))}
      </div>

      {/* Add image button at the bottom */}
      {!isLoading && images.length < 12 && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={addImage}
            className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
            title="Add new image"
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* Error message */}
      {saveError && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm">
          {saveError}
        </div>
      )}
    </main>
  )
}
