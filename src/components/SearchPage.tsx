import { useState, useEffect } from 'react'
import { Search, Film, X } from 'lucide-react'
import type { Movie } from './types'
import MovieCard from './MovieCard'

interface SearchPageProps {
  query: string
  onNavigate: (page: string, param?: string) => void
}

export default function SearchPage({ query, onNavigate }: SearchPageProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => {
    setSearchInput(query)
    if (query) {
      setLoading(true)
      fetch(`/api/movies?search=${encodeURIComponent(query)}&limit=50`)
        .then(r => r.json())
        .then(data => {
          setMovies(data.movies || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      onNavigate('search', searchInput.trim())
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Box */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search movies, directors, actors..."
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-full pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-lg"
            autoFocus
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); onNavigate('search', '') }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Results */}
      {query && (
        <div className="mb-4">
          <h2 className="text-white text-lg font-semibold">
            {loading ? 'Searching...' : `Search results for "${query}"`}
          </h2>
          {!loading && (
            <p className="text-gray-500 text-sm mt-1">
              {movies.length} {movies.length === 1 ? 'movie' : 'movies'} found
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-gray-800 rounded-lg" />
              <div className="h-4 bg-gray-800 rounded mt-2 w-3/4" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-20">
          <Film className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {query ? `No results found for "${query}"` : 'Search for your favorite movies'}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Try searching by title, director, or actor name
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={(slug) => onNavigate('movie', slug)}
              showOverview
            />
          ))}
        </div>
      )}
    </div>
  )
}
