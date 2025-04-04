"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface TagSelectorProps {
  tagCategories: Record<string, string[]>
  onSelectTag: (tag: string) => void
}

export default function TagSelector({ tagCategories, onSelectTag }: TagSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(tagCategories).map((category, index) => (
          <motion.button
            key={category}
            onClick={() => setActiveCategory(activeCategory === category ? null : category)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              activeCategory === category
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
                : "bg-white text-gray-700 hover:bg-violet-50 border border-violet-100"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
          >
            {category}
          </motion.button>
        ))}
      </div>

      {activeCategory && (
        <motion.div
          className="bg-white p-4 rounded-xl shadow-sm border border-violet-100"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-medium text-gray-700 mb-3">{activeCategory} Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {tagCategories[activeCategory].map((tag, index) => (
              <motion.button
                key={tag}
                onClick={() => onSelectTag(tag)}
                className="px-3 py-1.5 text-xs bg-violet-50 border border-violet-100 rounded-full hover:bg-violet-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.01 }}
              >
                {tag}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

