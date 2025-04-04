"use client"

import { motion } from "framer-motion"
import ImageCard from "./image-card"

interface Image {
  id: string
  url: string
  tag: string
  isLocked: boolean
}

interface ImageGridProps {
  images: Image[]
  toggleLock: (id: string) => void
  moveImage: (dragIndex: number, hoverIndex: number) => void
}

export default function ImageGrid({ images, toggleLock, moveImage }: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <ImageCard image={image} index={index} toggleLock={toggleLock} moveImage={moveImage} />
        </motion.div>
      ))}
    </div>
  )
}

