import { useState, useEffect } from 'react'
import { Star, ArrowUpDown, Search } from 'lucide-react'
import type { Movie, Genre } from './types'
import MovieCard from './MovieCard'

interface BrowsePageProps {
  onNavigate: (page: string, param?: string) => void
  initialGenre?: string
}

export default function BrowsePage({ onNavigate, initialGenre }: BrowsePageProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [genres, setGenres] = useState<(Genre & { _count: { movies: number } })[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('avgRating')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/genres')
      .then(r => r.json())
      .then(data => setGenres(data.genres || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ sort: sortBy, page: String(page), limit: '24' })
    if (selectedGenre) params.set('genre', selectedGenre)
    if (searchQuery) params.set('search', searchQuery)

    fetch(`/api/movies?${params}`)
      .then(r => r.json())
      .then(data => {
        setMovies(data.movies || [])
        setTotalPages(data.totalPages || 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedGenre, sortBy, page, searchQuery])

  useEffect(() => {
    setSelectedGenre(initialGenre || '')
    setPage(1)
  }, [initialGenre])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-white text-2xl font-bold mb-6">
        {selectedGenre
          ? `${genres.find(g => g.slug === selectedGenre)?.name || selectedGenre} Movies`
          : 'Browse All Movies'}
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar - Genres */}
        <div className="w-full md:w-56 shrink-0">
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800/50">
            <h3 className="text-white font-semibold text-sm mb-3">Genres</h3>
            <div className="space-y-0.5">
              <button
                onClick={() => { setSelectedGenre(''); setPage(1) }}
                className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                  !selectedGenre ? 'bg-emerald-500/10 text-emerald-500' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                All Genres
              </button>
              {genres.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => { setSelectedGenre(genre.slug); setPage(1) }}
                  className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                    selectedGenre === genre.slug
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {genre.name}
                  <span className="text-gray-600 ml-1">({genre._count.movies})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search & Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </form>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1) }}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="avgRating">Top Rated</option>
              <option value="year">Newest</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>

          {/* Movies Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-gray-800 rounded-lg" />
                  <div className="h-4 bg-gray-800 rounded mt-2 w-3/4" />
                </div>
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg mb-2">No movies found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {movies.map(movie => (
                <MovieCard key={movie.id} movie={movie} onClick={(slug) => onNavigate('movie', slug)} showOverview />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-[#1a1a1a] border border-gray-700 rounded text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm bg-[#1a1a1a] border border-gray-700 rounded text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
