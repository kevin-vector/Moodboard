"use client"

import { useRef } from "react"
import { useDrag, useDrop } from "react-dnd"
import { Lock, Unlock } from "lucide-react"
import { motion } from "framer-motion"

interface Image {
  id: string
  url: string
  tag: string
  isLocked: boolean
}

interface ImageCardProps {
  image: Image
  index: number
  toggleLock: (id: string) => void
  moveImage: (dragIndex: number, hoverIndex: number) => void
}

export default function ImageCard({ image, index, toggleLock, moveImage }: ImageCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: "IMAGE",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  // Set up drop functionality
  const [, drop] = useDrop({
    accept: "IMAGE",
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return
      }

      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Move the card
      moveImage(dragIndex, hoverIndex)

      // Update the index for the dragged item
      item.index = hoverIndex
    },
  })

  // Connect drag and drop refs
  drag(drop(ref))

  return (
    <div
      ref={ref}
      className={`relative rounded-xl overflow-hidden border transition-all duration-200 ${
        isDragging ? "opacity-50" : "opacity-100"
      } hover:shadow-lg bg-white ${
        image.isLocked ? "ring-2 ring-violet-500 border-violet-200" : "border-gray-100 hover:border-violet-200"
      }`}
      style={{ height: "300px" }}
    >
      <div className="absolute top-2 right-2 z-10">
        <motion.button
          onClick={() => toggleLock(image.id)}
          className={`p-2 rounded-full shadow-md ${
            image.isLocked
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
              : "bg-white/90 text-gray-700 hover:bg-white"
          }`}
          title={image.isLocked ? "Unlock (currently finding similar images)" : "Lock to find similar images"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {image.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
        </motion.button>
      </div>

      <div className="h-[240px] overflow-hidden">
        <img
          src={image.url || "/placeholder.svg"}
          alt={image.tag}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      <div className="p-3 bg-white">
        <span className="text-sm font-medium text-gray-800 block truncate">{image.tag}</span>
        <span className="text-xs text-gray-500 block mt-1">
          {image.isLocked ? "🔍 Finding similar images" : "Click to lock • Drag to reorder"}
        </span>
      </div>
    </div>
  )
}

