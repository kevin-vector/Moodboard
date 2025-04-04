"use client"

import type React from "react"

import { Search, X } from "lucide-react"
import { motion } from "framer-motion"

interface SearchBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleSearchSubmit: (e: React.FormEvent) => void
  selectedTag: string | null
  setSelectedTag: (tag: string | null) => void
  refreshImages: () => void
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  selectedTag,
  setSelectedTag,
  refreshImages,
}: SearchBarProps) {
  const clearSearch = () => {
    setSearchQuery("")
    setSelectedTag(null)
    refreshImages()
  }

  return (
    <div className="mb-8">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-violet-400" />
        </div>
        <input
          type="text"
          className="search-input block w-full pl-10 pr-10 py-3 border border-violet-100 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-gray-700 placeholder-gray-400"
          placeholder="Search by tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" onClick={clearSearch} className="absolute inset-y-0 right-12 flex items-center pr-2">
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs hover:bg-violet-200 transition-colors">
            Search
          </span>
        </button>
      </form>

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

