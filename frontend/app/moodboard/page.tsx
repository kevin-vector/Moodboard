"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, ExternalLink, Lock, Plus, X, Unlock, GripVertical } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Gallery from "react-photo-gallery";

// Tag categories structure
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

const generateMockImages = async (searchQuery = "", count) => {
  let fetchedImages = [];

  try {
    console.log(`Searching for images with query: ${searchQuery}`);
    
    const url = `${window.location.origin}/api/search?query=${searchQuery}&count=${count}`.replace('3000', '8000')

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
          content: 'none',
          tag: randomTag,
          isLocked: false,
          position: index,
          width: 0,
          height: 0,
        }
      })
    }
    fetchedImages = result.images.map((url: {url: String, content: String, width: number, height: number}, index: number) => ({
      id: `img-${Date.now()}-${index}`,
      url: url.url,
      content: url.content,
      tag: searchQuery,
      isLocked: false,
      position: index,
      width: url.width || 0,
      height: url.height || 0,
    }));
    console.log("fetchedImages", fetchedImages);
    return fetchedImages.slice(0, count);
  } catch (error) {
    console.log("Error fetching images:", error);
    return Array(7)
    .fill(null)
    .map((_, index) => {
      const randomTag = allTags[Math.floor(Math.random() * allTags.length)]

      return {
        id: `img-${Date.now()}-${index}`,
        url: `sample${index + 1}.png`,
        content: 'none',
        tag: randomTag,
        isLocked: false,
        position: index,
        width: 0,
        height: 0,
      }
    })
  }
}

export default function MoodboardGenerator() {
  const [images, setImages] = useState<
    ({ id: string; url: string; content: string; tag: string; isLocked: boolean; position: number; width: number, height: number; })[]
  >([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [filteredTags, setFilteredTags] = useState<string[]>([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [draggedImage, setDraggedImage] = useState<({ id: string; url: string; content:string; tag: string; isLocked: boolean; position: number; width: number, height: number; } | null)>()
  const [draggedOverImage, setDraggedOverImage] = useState<({ id: string; url: string; content:string; tag: string; isLocked: boolean; position: number; width: number, height: number; } | null)>()

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTags([])
      return
    }

    const filtered = allTags.filter((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6) // Limit to 6 suggestions

    setFilteredTags(filtered)
  }, [searchQuery])

  useEffect(() => {
    (async () => {
      const initialImages = await generateMockImages("", 7)
      setImages(initialImages)
      console.log("initialImages", initialImages)
      setIsLoading(false)
      try{
        const url = `${window.location.origin}/api/unlock`.replace('3000', '8000')
  
        const response = await fetch(url, {
          method: "GET",
        });
        const data = await response.json();
        if (data.status === "unlocked") {
          console.log(data.message);
        } else {
          console.error(data.message);
          alert(`Failed to unlock image: ${data.message}`);
        }
      }catch (error) {
        console.error("Error calling /api/unlock:", error);
        alert("Network error while unlocking image. Please try again.");
      }
    })()
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
      }
    },
    [searchQuery, images],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  const refreshImages = ( ) => {
    setIsLoading(true)

    setTimeout(async () => {
      const newImages = await generateMockImages(searchQuery, images.length);

      const updatedImages = images.map((img, index) => {
        return img.isLocked ? img : newImages[index]
      })
      setImages(updatedImages)
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

  const toggleLock = async (id: string) => {
    const image = images.find((img) => img.id === id);
    if (!image) {
      console.error(`Image with id ${id} not found`);
      return;
    }
    const newLockedState = !image.isLocked;
    setImages((prevImages) => prevImages.map((img) => (img.id === id ? { ...img, isLocked: !img.isLocked } : img)))
    if(newLockedState){
      try {
        const response = await fetch(`${window.location.origin}/api/lock`.replace('3000', '8000'), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_path: image.url}),
        });
        const data = await response.json();
        if (data.status === "locked") {
          console.log(data.message);
        } else {
          console.error(data.message);
          setImages((prevImages) =>
            prevImages.map((img) =>
              img.id === id ? { ...img, isLocked: !newLockedState } : img
            )
          );
          alert(`Failed to lock image: ${data.message}`);
        }
      }catch (error) {
        console.error("Error calling /api/lock:", error);
        setImages((prevImages) =>
          prevImages.map((img) =>
            img.id === id ? { ...img, isLocked: !newLockedState } : img
          )
        );
        alert("Network error while locking image. Please try again.");
      }
    }
    else{
      try{
        const url = `${window.location.origin}/api/unlock`.replace('3000', '8000')

        const response = await fetch(url, {
          method: "GET",
        });
        const data = await response.json();
        if (data.status === "unlocked") {
          console.log(data.message);
        } else {
          console.error(data.message);
          setImages((prevImages) =>
            prevImages.map((img) =>
              img.id === id ? { ...img, isLocked: !newLockedState } : img
            )
          );
          alert(`Failed to unlock image: ${data.message}`);
        }
      }catch (error) {
        console.error("Error calling /api/unlock:", error);
        setImages((prevImages) =>
          prevImages.map((img) =>
            img.id === id ? { ...img, isLocked: !newLockedState } : img
          )
        );
        alert("Network error while unlocking image. Please try again.");
      }
    }
  }

  const addImage = () => {
    if (images.length >= 12) {
      return
    }

    setIsLoading(true)
    setTimeout(async() => {
      const newImage = await generateMockImages(searchQuery, 1)
      setImages((prevImages) => [...prevImages, newImage[0]])
      setIsLoading(false)
    }, 300)
  }

  const removeImage = (id: string) => {
    if (images.length <= 1) {
      return
    }

    setImages((prevImages) => prevImages.filter((img) => img.id !== id))
  }
  const galleryRef = useRef<HTMLDivElement>(null);
  
  const handleExport = async () => {
    if (images.length === 0 || isSaving) return;

    setIsSaving(true);
    setSaveError("");

    try {
      // Wait for the DOM to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get all image elements inside the gallery
      const galleryEl = galleryRef.current;
      if (!galleryEl) throw new Error("Gallery not found");

      const imgEls = Array.from(galleryEl.querySelectorAll("img"));

      // Calculate bounding box of all images
      const rects = imgEls.map(img => img.getBoundingClientRect());
      const minX = Math.min(...rects.map(r => r.left));
      const minY = Math.min(...rects.map(r => r.top));
      const maxX = Math.max(...rects.map(r => r.right));
      const maxY = Math.max(...rects.map(r => r.bottom));
      const width = Math.round(maxX - minX);
      const height = Math.round(maxY - minY);

      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      // Draw each image at its DOM position
      for (let i = 0; i < imgEls.length; i++) {
        const imgEl = imgEls[i];
        const rect = rects[i];
        // Find the corresponding image data
        const imgData = images.find(img => img.content === imgEl.src || imgEl.src.endsWith(img.url));
        if (!imgData) continue;

        // Load image
        await new Promise((resolve, reject) => {
          const tempImg = new window.Image();
          tempImg.crossOrigin = "anonymous";
          tempImg.onload = () => {
            ctx.drawImage(
              tempImg,
              rect.left - minX,
              rect.top - minY,
              rect.width,
              rect.height
            );
            // Optionally draw lock icon, etc. here
            resolve(null);
          };
          tempImg.onerror = reject;
          tempImg.src = imgEl.src;
        });
      }

      // Add watermark or overlay if needed
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("Generated with Moodboard", width - 10, height - 10);

      // Export
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `moodboard-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error saving moodboard:", error);
      setSaveError("There was an error saving your moodboard. CORS restrictions may prevent loading some images.");
    } finally {
      setIsSaving(false);
    }
  };

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

  const photos = images.map(img => ({
    src: img.content || "/placeholder.svg",
    width: img.width || 1,
    height: img.height || 1,
    alt: img.tag,
  }));

  function MoodboardImage({ 
    photo,
    margin,
    image,
    toggleLock,
    addImage,
    removeImage,
    draggedImage,
    draggedOverImage,
  }:any) {
    return (
      <motion.div
        key={image.id}
        style={{
          margin,
          width: photo.width,
          height: photo.height,
          position: "relative",
          overflow: "hidden",
          borderRadius: "0.375rem",
          background: "#222",
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: draggedImage && draggedImage.id === image.id ? 0.6 : 1,
          scale:
            draggedImage && draggedImage.id === image.id
              ? 0.95
              : draggedOverImage && draggedOverImage.id === image.id
              ? 1.05
              : 1,
          transition: { duration: 0.2 },
        }}
        transition={{ duration: 0.3 }}
      >
        <img
          src={image.content || "/placeholder.svg"}
          alt={image.tag}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "all 0.3s",
            ...(draggedOverImage && draggedOverImage.id === image.id ? { filter: "brightness(1.1)" } : {}),
          }}
          loading="eager"
        />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/40 z-10">
          <div className="flex gap-3">
            <button
              className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center text-orange-500 hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                toggleLock(image.id);
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

        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-end">
          <div className="p-2 w-full transform translate-y-full hover:translate-y-0 transition-transform">
            <div className="text-xs text-white/80">{image.tag}</div>
          </div>
        </div>

        {image.isLocked && (
          <div className="absolute top-2 left-2 bg-black/70 text-orange-500 p-1 rounded-full">
            <Lock size={14} />
          </div>
        )}
      </motion.div>
    );
  }
  
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <header className="h-16 px-4 flex items-center justify-between border-b border-border">
        <div className="relative w-72" style={{ zIndex: 50 }}>
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
          <motion.div
            className="absolute left-1/2 transform -translate-x-1/2 text-sm text-orange-500 uppercase tracking-wider"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Press space to generate moodboards
          </motion.div>
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

      {isLoading ?
        Array(images.length || 7).fill(null).map((_, index) => (
          <div
            key={`loading-${index}`}
            className={`image-${index + 1} bg-secondary animate-pulse rounded-sm`}
          ></div>
        )) :
        <div ref={galleryRef}>
          <Gallery
            photos={photos}
            direction="row"
            margin={8}
            targetRowHeight={Math.floor(window.innerHeight / 2)}
            renderImage={(props) => {
              const image = images.find(img => img.content === props.photo.src);
              return (
                <MoodboardImage
                  key={props.photo.key || props.photo.src}
                  {...props}
                  image={image}
                  toggleLock={toggleLock}
                  addImage={addImage}
                  removeImage={removeImage}
                  draggedImage={draggedImage}
                  draggedOverImage={draggedOverImage}
                />
              );
            }}
          />
        </div> 
      }

      {!isLoading && images.length < 12 && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={addImage}
            className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
            title="Add new image"
            style={{ boxShadow: "0 0 10px rgba(0,0,0,0.3)" }}
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