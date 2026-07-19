import { useState, useEffect } from 'react'
import { Star, Trophy, ArrowUpDown } from 'lucide-react'
import type { Movie } from './types'
import MovieCard from './MovieCard'
import { cn } from '@/lib/cn'

interface Top250Props {
  onNavigate: (page: string, param?: string) => void
}

export default function Top250Page({ onNavigate }: Top250Props) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('list')

  useEffect(() => {
    fetch('/api/top250')
      .then(r => r.json())
      .then(data => {
        setMovies(data.movies || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="text-white text-2xl font-bold">Top 250 Movies</h1>
            <p className="text-gray-400 text-sm">The highest rated movies of all time</p>
          </div>
        </div>
        <div className="flex gap-1 bg-[#1a1a1a] rounded-lg p-1 border border-gray-800/50">
          <button
            onClick={() => setView('list')}
            className={cn(
              'px-3 py-1.5 text-sm rounded transition-colors',
              view === 'list' ? 'bg-emerald-500 text-black font-medium' : 'text-gray-400 hover:text-white'
            )}
          >
            List
          </button>
          <button
            onClick={() => setView('grid')}
            className={cn(
              'px-3 py-1.5 text-sm rounded transition-colors',
              view === 'grid' ? 'bg-emerald-500 text-black font-medium' : 'text-gray-400 hover:text-white'
            )}
          >
            Grid
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse bg-[#1a1a1a] rounded-lg p-4 flex gap-4">
              <div className="w-8 h-8 bg-gray-800 rounded" />
              <div className="w-16 h-24 bg-gray-800 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-800 rounded w-1/3" />
                <div className="h-3 bg-gray-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movies.map((movie, i) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={(slug) => onNavigate('movie', slug)}
              rank={i + 1}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {movies.map((movie, i) => (
            <button
              key={movie.id}
              onClick={() => onNavigate('movie', movie.slug)}
              className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-gray-800/50 hover:border-gray-700/50 rounded-lg p-3 flex items-center gap-4 transition-all text-left group"
            >
              {/* Rank */}
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0',
                i < 3 ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-400'
              )}>
                {i + 1}
              </div>

              {/* Poster */}
              <div className="w-14 h-20 rounded overflow-hidden bg-gray-800 shrink-0">
                <img
                  src={movie.posterUrl || `https://placehold.co/100x150/1a1a1a/666?text=${i + 1}`}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/100x150/1a1a1a/666?text=${i + 1}`
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-emerald-500 fill-emerald-500 shrink-0" />
                  <span className="text-emerald-500 font-bold text-sm">{movie.avgRating.toFixed(1)}</span>
                </div>
                <h3 className="text-white font-semibold group-hover:text-emerald-500 transition-colors truncate">
                  {movie.title}
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  {movie.year} · {movie.director} · {movie.ratingCount.toLocaleString()} ratings
                </p>
              </div>

              {/* Arrow */}
              <div className="text-gray-600 group-hover:text-emerald-500 transition-colors shrink-0">
                <span className="text-lg">›</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
