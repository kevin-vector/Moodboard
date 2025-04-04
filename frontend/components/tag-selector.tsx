"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronDown, ChevronUp } from "lucide-react"

interface TagSelectorProps {
  tagCategories: Record<string, string[]>
  onSelectTag: (tag: string) => void
  searchQuery: string
}

export default function TagSelector({ tagCategories, onSelectTag, searchQuery }: TagSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [filteredCategories, setFilteredCategories] = useState<Record<string, string[]>>(tagCategories)
  const [hasSearchResults, setHasSearchResults] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Filter tags based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(tagCategories)
      setHasSearchResults(false)
      return
    }

    const filtered: Record<string, string[]> = {}
    let hasResults = false

    Object.entries(tagCategories).forEach(([category, tags]) => {
      const matchingTags = tags.filter((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      if (matchingTags.length > 0) {
        filtered[category] = matchingTags
        hasResults = true

        // Auto-expand categories with matching results
        setExpandedCategories((prev) => ({
          ...prev,
          [category]: true,
        }))
      }
    })

    setFilteredCategories(filtered)
    setHasSearchResults(hasResults)

    // If we have search results, clear the active category to show all matches
    if (hasResults && activeCategory) {
      setActiveCategory(null)
    }
  }, [searchQuery, tagCategories])

  const toggleCategory = (category: string) => {
    if (searchQuery) {
      // When searching, toggle expansion instead of active state
      setExpandedCategories((prev) => ({
        ...prev,
        [category]: !prev[category],
      }))
    } else {
      // Normal behavior when not searching
      setActiveCategory(activeCategory === category ? null : category)
    }
  }

  // Highlight matching text in tags
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
              <span key={i} className="bg-violet-100 text-violet-800 font-medium">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </>
      )
    } catch (e) {
      // Fallback in case of regex issues
      return text
    }
  }

  return (
    <div className="mb-6">
      {searchQuery && hasSearchResults && (
        <div className="mb-3 text-sm text-violet-600 flex items-center">
          <Search size={14} className="mr-1" />
          <span>Showing results for "{searchQuery}"</span>
        </div>
      )}

      {searchQuery && !hasSearchResults && (
        <div className="mb-3 text-sm text-gray-500">No tags found matching "{searchQuery}"</div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(filteredCategories).map((category, index) => (
          <motion.button
            key={category}
            onClick={() => toggleCategory(category)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
              activeCategory === category || (searchQuery && expandedCategories[category])
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
            {searchQuery && (expandedCategories[category] ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {Object.entries(filteredCategories).map(([category, tags]) => {
          // Show category if it's active or if we're searching and the category is expanded
          const shouldShow = activeCategory === category || (searchQuery && expandedCategories[category])

          return (
            shouldShow && (
              <motion.div
                key={category}
                className="bg-white p-4 rounded-xl shadow-sm border border-violet-100 mb-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                  <span>{category} Tags:</span>
                  {searchQuery && (
                    <span className="text-xs text-violet-500">
                      {tags.length} {tags.length === 1 ? "result" : "results"}
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
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
                      {searchQuery ? highlightMatch(tag, searchQuery) : tag}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )
          )
        })}
      </AnimatePresence>
    </div>
  )
}

