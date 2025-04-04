"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X, TagIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SearchBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleSearchSubmit: (e: React.FormEvent) => void
  selectedTag: string | null
  setSelectedTag: (tag: string | null) => void
  refreshImages: () => void
  allTags: string[]
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  selectedTag,
  setSelectedTag,
  refreshImages,
  allTags,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [filteredTags, setFilteredTags] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter tags based on search query with debounce
  useEffect(() => {
    if (localSearchQuery.trim() === "") {
      setFilteredTags([])
      setIsSearching(false)
      return
    }

    // Show searching indicator
    setIsSearching(true)

    const handler = setTimeout(() => {
      const filtered = allTags.filter((tag) => tag.toLowerCase().includes(localSearchQuery.toLowerCase())).slice(0, 6) // Limit to 6 suggestions for better UX

      setFilteredTags(filtered)
      setIsSearching(false)
      setSearchQuery(localSearchQuery)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [localSearchQuery, allTags, setSearchQuery])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const clearSearch = () => {
    setLocalSearchQuery("")
    setSearchQuery("")
    setSelectedTag(null)
    refreshImages()
    setIsFocused(false)
  }

  const handleTagSelect = (tag: string) => {
    setLocalSearchQuery(tag)
    setSearchQuery(tag)
    setSelectedTag(tag)
    setIsFocused(false)
    refreshImages()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value)
  }

  // Highlight matching text in suggestions
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
    <div className="mb-8 relative">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-violet-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="search-input block w-full pl-10 pr-10 py-3 border border-violet-100 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-gray-700 placeholder-gray-400"
          placeholder="Search by tag..."
          value={localSearchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-12 flex items-center pr-2">
          {isSearching ? (
            <div className="h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            localSearchQuery && (
              <button type="button" onClick={clearSearch}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )
          )}
        </div>
        <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs hover:bg-violet-200 transition-colors">
            Search
          </span>
        </button>
      </form>

      {/* Tag suggestions dropdown */}
      <AnimatePresence>
        {isFocused && filteredTags.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-violet-100 overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2">
              <div className="text-xs text-gray-500 px-2 py-1">Suggestions:</div>
              <div className="space-y-1">
                {filteredTags.map((tag) => (
                  <motion.button
                    key={tag}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 rounded-md flex items-center gap-2"
                    onClick={() => handleTagSelect(tag)}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TagIcon size={14} className="text-violet-400" />
                    <span>{highlightMatch(tag, localSearchQuery)}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedTag && (
        <motion.div
          className="mt-2 flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-sm text-gray-600">Active filter:</span>
          <span className="ml-2 px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-xs flex items-center">
            {selectedTag}
            <button onClick={clearSearch} className="ml-1 hover:text-violet-900">
              <X size={14} />
            </button>
          </span>
        </motion.div>
      )}
    </div>
  )
}

