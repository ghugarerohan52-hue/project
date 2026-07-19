import { useState, useEffect } from 'react'
import { Star, ChevronRight } from 'lucide-react'
import type { Movie } from './types'
import MovieCard from './MovieCard'

interface HomePageProps {
  onNavigate: (page: string, param?: string) => void
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [featured, setFeatured] = useState<Movie[]>([])
  const [trending, setTrending] = useState<Movie[]>([])
  const [newReleases, setNewReleases] = useState<Movie[]>([])
  const [stats, setStats] = useState({ movieCount: 0, reviewCount: 0, genreCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/featured').then(r => r.json()),
      fetch('/api/movies?sort=year&limit=8').then(r => r.json()),
      fetch('/api/movies?sort=rating&limit=8').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ]).then(([featuredData, newReleasesData, trendingData, statsData]) => {
      setFeatured(featuredData.movies || [])
      setNewReleases(newReleasesData.movies || [])
      setTrending(trendingData.movies || [])
      setStats(statsData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const heroMovie = featured[0]

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-[70vh] min-h-[500px] max-h-[700px] bg-gray-900 overflow-hidden">
        {heroMovie && (
          <>
            <img
              src={heroMovie.backdropUrl || heroMovie.posterUrl || ''}
              alt={heroMovie.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-[#121212]/30" />

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 bg-emerald-500 text-black px-3 py-1 rounded font-bold text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    {heroMovie.avgRating.toFixed(1)}
                  </div>
                  <span className="text-gray-400 text-sm">{heroMovie.ratingCount.toLocaleString()} ratings</span>
                </div>
                <h1 className="text-white text-4xl md:text-6xl font-bold mb-3 drop-shadow-lg">
                  {heroMovie.title}
                </h1>
                <p className="text-gray-300 text-base md:text-lg max-w-2xl mb-4 line-clamp-3">
                  {heroMovie.overview}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-5">
                  <span>{heroMovie.year}</span>
                  <span>·</span>
                  <span>{Math.floor(heroMovie.runtime / 60)}h {heroMovie.runtime % 60}m</span>
                  <span>·</span>
                  <span>{heroMovie.genres?.map(mg => mg.genre.name).join(', ')}</span>
                </div>
                <button
                  onClick={() => onNavigate('movie', heroMovie.slug)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  View Details <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
        {!heroMovie && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">No movies available</p>
          </div>
        )}
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          {[
            { label: 'Movies', value: stats.movieCount, color: 'text-emerald-500' },
            { label: 'Reviews', value: stats.reviewCount, color: 'text-green-400' },
            { label: 'Genres', value: stats.genreCount, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-gray-800/50">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Top Rated */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-500" />
              Top Rated
            </h2>
            <button
              onClick={() => onNavigate('top250')}
              className="text-emerald-500 text-sm hover:underline flex items-center gap-1"
            >
              View Top 250 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-gray-800 rounded-lg" />
                  <div className="h-4 bg-gray-800 rounded mt-2 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {trending.slice(0, 4).map((movie) => (
                <MovieCard key={movie.id} movie={movie} onClick={(slug) => onNavigate('movie', slug)} />
              ))}
            </div>
          )}
        </section>

        {/* Latest Releases */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-bold">Latest Releases</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-gray-800 rounded-lg" />
                  <div className="h-4 bg-gray-800 rounded mt-2 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {newReleases.slice(0, 8).map((movie) => (
                <MovieCard key={movie.id} movie={movie} onClick={(slug) => onNavigate('movie', slug)} />
              ))}
            </div>
          )}
        </section>

        {/* Browse by Genre */}
        <section>
          <h2 className="text-white text-xl font-bold mb-4">Browse by Genre</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller', 'Horror', 'Romance', 'Animation', 'Crime', 'Adventure'].map(genre => (
              <button
                key={genre}
                onClick={() => onNavigate('genre', genre.toLowerCase())}
                className="bg-[#1a1a1a] hover:bg-gray-800 border border-gray-800/50 hover:border-emerald-500/30 rounded-lg p-4 text-center transition-all group"
              >
                <span className="text-gray-300 group-hover:text-emerald-500 font-medium text-sm transition-colors">{genre}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
