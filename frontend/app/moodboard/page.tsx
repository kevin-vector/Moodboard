"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Download, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import ImageGrid from "@/components/image-grid"
import SearchBar from "@/components/search-bar"
import TagSelector from "@/components/tag-selector"

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

const generateMockImages = (preserveLocked: { id: string; url: string; tag: string; isLocked: boolean; position: number } | null = null, selectedTag: string | null = null) => {
  if (preserveLocked) {
    console.log(`Searching for images similar to: ${preserveLocked.tag}`)

    return Array(7)
      .fill(null)
      .map((_, index) => {
        if (preserveLocked.position === index) {
          return preserveLocked
        }

        if (selectedTag) {
          return {
            id: `img-${Date.now()}-${index}`,
            url: `https://source.unsplash.com/random/300x300?${encodeURIComponent(selectedTag)}`,
            tag: selectedTag,
            isLocked: false,
            position: index,
          }
        }

        const relatedTags = findRelatedTags(preserveLocked.tag)
        const similarTag = relatedTags[Math.floor(Math.random() * relatedTags.length)]

        return {
          id: `img-${Date.now()}-${index}`,
          url: `https://source.unsplash.com/random/300x300?${encodeURIComponent(similarTag)}`,
          tag: similarTag,
          isLocked: false,
          position: index,
        }
      })
  }

  if (selectedTag) {
    return Array(7)
      .fill(null)
      .map((_, index) => {
        return {
          id: `img-${Date.now()}-${index}`,
          url: `https://source.unsplash.com/random/300x300?${encodeURIComponent(selectedTag)}`,
          tag: selectedTag,
          isLocked: false,
          position: index,
        }
      })
  }

  return Array(7)
    .fill(null)
    .map((_, index) => {
      const randomTag = allTags[Math.floor(Math.random() * allTags.length)]

      return {
        id: `img-${Date.now()}-${index}`,
        url: `https://source.unsplash.com/random/300x300?${encodeURIComponent(randomTag)}`,
        tag: randomTag,
        isLocked: false,
        position: index,
      }
    })
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
  const [lockedImage, setLockedImage] = useState<({ id: string; url: string; tag: string; isLocked: boolean; position: number }) | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const canvasRef = useRef(null)

  useEffect(() => {
    const initialImages = generateMockImages()
    setImages(initialImages)
    setIsLoading(false)
  }, [])

  const filteredImages = searchQuery
    ? images.filter((img) => img.tag.toLowerCase().includes(searchQuery.toLowerCase()))
    : images

  const handleKeyDown = useCallback(
    (e) => {
      if (e.code === "Space" && !e.target.classList.contains("search-input")) {
        e.preventDefault()
        refreshImages()
      }
    },
    [lockedImage, selectedTag],
  )

  const refreshImages = () => {
    setIsLoading(true)
    setTimeout(() => {
      setImages(generateMockImages(lockedImage, selectedTag))
      setIsLoading(false)
    }, 300)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSelectedTag(searchQuery)
    setIsLoading(true)
    setTimeout(() => {
      setImages(generateMockImages(lockedImage, searchQuery))
      setIsLoading(false)
    }, 300)
  }

  const toggleLock = (imageId) => {
    setImages((prevImages) => {
      const newImages = prevImages.map((img, idx) => {
        if ('id' in img && img.id === imageId) {
          const newLockedState = !img.isLocked

          if (newLockedState) {
            const imageWithPosition = { ...img, isLocked: newLockedState, position: idx }
            setLockedImage(imageWithPosition)
            return imageWithPosition
          } else {
            setLockedImage(null)
            return { ...img, isLocked: newLockedState }
          }
        }

        if ('isLocked' in img && img.isLocked && imageId !== img.id) {
          return { ...img, isLocked: false }
        }

        return img
      })

      const newlyLockedImage = newImages.find((img) => img.isLocked)

      if (newlyLockedImage) {
        setIsLoading(true)
        setTimeout(() => {
          setImages(generateMockImages(newlyLockedImage, selectedTag))
          setIsLoading(false)
        }, 300)
        return newImages
      }

      return newImages
    })
  }

  const moveImage = (dragIndex, hoverIndex) => {
    const draggedImage = images[dragIndex]
    const newImages = [...images]

    newImages.splice(dragIndex, 1)

    newImages.splice(hoverIndex, 0, draggedImage)

    const updatedImages = newImages.map((img, idx) => {
      if ('isLocked' in img && img.isLocked) {
        setLockedImage({ ...img, position: idx })
      }
      return { ...img, position: idx }
    })

    setImages(updatedImages)
  }

  const handleSave = async () => {
    if (images.length === 0 || isSaving) return

    setIsSaving(true)
    setSaveError("")

    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      
      if (!ctx) {
        console.error("Failed to get canvas context");
        return;
      }
      const cellSize = 300 // Size of each image cell
      const padding = 10 // Padding between images
      const borderWidth = 2 // Border width around each image
      const canvasWidth = cellSize * 3 + padding * 4 + borderWidth * 6
      const canvasHeight = cellSize * 3 + padding * 4 + borderWidth * 6

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      ctx.fillStyle = "#f9f5ff" // Light purple background
      if (ctx) {
        ctx.fillStyle = "#f9f5ff" // Light purple background
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      } else {
        console.error("Failed to get canvas context");
      }
      ctx.fillStyle = "#8b5cf6" // Violet color for the title
      ctx.font = "bold 24px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("MOODBOARD", canvasWidth / 2, padding * 2)

      const date = new Date().toLocaleDateString()
      ctx.fillStyle = "#6b7280" // Gray color for the date
      ctx.font = "16px sans-serif"
      ctx.fillText(date, canvasWidth / 2, padding * 4)

      const sortedImages = [...images].sort((a, b) => a.position - b.position)

      const positions = [
        { x: padding, y: padding * 6 },
        { x: cellSize + padding * 2 + borderWidth * 2, y: padding * 6 },
        { x: cellSize * 2 + padding * 3 + borderWidth * 4, y: padding * 6 },

        { x: padding, y: cellSize + padding * 7 + borderWidth * 2 },
        { x: cellSize + padding * 2 + borderWidth * 2, y: cellSize + padding * 7 + borderWidth * 2 },
        { x: cellSize * 2 + padding * 3 + borderWidth * 4, y: cellSize + padding * 7 + borderWidth * 2 },

        { x: padding, y: cellSize * 2 + padding * 8 + borderWidth * 4 },
      ]

      positions.forEach((pos, i) => {
        if (i < sortedImages.length) {
          ctx.fillStyle = sortedImages[i].isLocked ? "#8b5cf6" : "#e5e7eb"
          ctx.fillRect(pos.x - borderWidth, pos.y - borderWidth, cellSize + borderWidth * 2, cellSize + borderWidth * 2)

          ctx.fillStyle = "#f3f4f6"
          ctx.fillRect(pos.x, pos.y, cellSize, cellSize)

          ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
          ctx.fillRect(pos.x, pos.y + cellSize - 30, cellSize, 30)

          ctx.fillStyle = "#1f2937"
          ctx.font = "12px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(sortedImages[i].tag, pos.x + cellSize / 2, pos.y + cellSize - 12)
        }
      })

      const metaX = cellSize * 2 + padding * 3 + borderWidth * 4
      const metaY = cellSize * 2 + padding * 8 + borderWidth * 4

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      ctx.fillRect(metaX, metaY, cellSize, cellSize)

      ctx.fillStyle = "#6b7280"
      ctx.font = "14px sans-serif"
      ctx.textAlign = "left"

      const tags = [...new Set(sortedImages.map((img) => img.tag))].slice(0, 3)
      ctx.fillText("Tags:", metaX + padding, metaY + padding * 3)
      tags.forEach((tag, i) => {
        ctx.fillText(`• ${tag}`, metaX + padding * 2, metaY + padding * 4 + i * 20)
      })

      ctx.fillStyle = "#8b5cf6"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Created with MoodBoard", metaX + cellSize / 2, metaY + cellSize - padding * 2)

      for (let i = 0; i < sortedImages.length; i++) {
        const img = sortedImages[i]
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

          ctx.drawImage(imgElement, pos.x, pos.y, cellSize, cellSize)
        } catch (imgError) {
          console.warn(`Failed to load image ${i}:`, imgError)

          ctx.fillStyle = "#f87171" // Light red
          ctx.font = "12px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText("Image unavailable", pos.x + cellSize / 2, pos.y + cellSize / 2)
        }
      }

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

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  const handleTagSelect = (tag: string) => {
    alert("fkjsdalfjasdklf")
    setSearchQuery(tag)
    setSelectedTag(tag)
    setIsLoading(true)
    setTimeout(() => {
      setImages(generateMockImages(lockedImage, tag))
      setIsLoading(false)
    }, 300)
  }

  const isSimilaritySearchActive = lockedImage !== null

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearchSubmit={handleSearchSubmit}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              refreshImages={refreshImages}
              allTags={allTags}
            />

            <TagSelector tagCategories={tagCategories} onSelectTag={handleTagSelect} searchQuery={searchQuery} />
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center items-center h-[500px]">
              <div className="relative w-20 h-20">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-violet-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-violet-600 rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <ImageGrid images={filteredImages} toggleLock={toggleLock} moveImage={moveImage} />
            </motion.div>
          )}

          <motion.div
            className="mt-8 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={handleSave}
              disabled={isSaving || images.length === 0}
              className={`flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-6 py-3 rounded-full font-medium shadow-md hover:shadow-lg transition-all ${
                isSaving || images.length === 0 ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Save Moodboard
                </>
              )}
            </button>

            {saveError && <div className="mt-3 text-red-500 text-sm">{saveError}</div>}

            <div className="mt-3 text-xs text-gray-500 max-w-md text-center">
              Note: Due to browser security restrictions, some images may not appear in the downloaded moodboard.
            </div>
          </motion.div>

          <motion.div
            className="mt-6 text-center text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {isSimilaritySearchActive ? (
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block px-2 py-1 bg-violet-100 text-violet-800 rounded-full">
                  Similarity search active
                </span>
                <span>•</span>
                <span>Press spacebar to refresh with similar images</span>
              </div>
            ) : (
              <div>
                Press spacebar to refresh images
                {selectedTag && (
                  <span>
                    {" "}
                    with tag: <strong>{selectedTag}</strong>
                  </span>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </DndProvider>
  )
}

