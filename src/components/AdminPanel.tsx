import { useState, useEffect, useCallback } from 'react'
import {
  Film, Trash2, Edit3, Plus, Search, Star, MessageSquare, Users,
  BarChart3, ChevronLeft, ChevronRight, X, Save, Eye, AlertTriangle,
  Monitor, ExternalLink, Tv
} from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Movie, Review, Genre } from './types'

type Tab = 'dashboard' | 'movies' | 'reviews' | 'users' | 'streaming'

interface AdminStats {
  movieCount: number
  reviewCount: number
  genreCount: number
  userCount: number
}

interface ActorForm {
  name: string
  photo: string
}

const emptyActor: ActorForm = { name: '', photo: '' }

const emptyMovie = {
  title: '', year: 2024, runtime: 120, rated: 'PG-13',
  posterUrl: '', backdropUrl: '', trailerUrl: '',
  director: '', writers: '', cast: '', overview: '', tagline: '',
  language: 'English', country: 'USA',
  genreIds: [] as string[],
  actors: [] as ActorForm[],
  photos: [] as string[],
  streamingPlatforms: [] as { platformId: string; url: string }[],
}

export default function AdminPanel({ onNavigate }: { onNavigate: (page: string, param?: string) => void }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<AdminStats>({ movieCount: 0, reviewCount: 0, genreCount: 0, userCount: 0 })

  // Movies state
  const [movies, setMovies] = useState<(Movie & { _count: { reviews: number } })[]>([])
  const [moviePage, setMoviePage] = useState(1)
  const [movieTotal, setMovieTotal] = useState(0)
  const [movieSearch, setMovieSearch] = useState('')
  const [movieLoading, setMovieLoading] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<(Review & { movie: { id: string; title: string; slug: string } })[]>([])
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewTotal, setReviewTotal] = useState(0)
  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  // Genres (for forms)
  const [genres, setGenres] = useState<Genre[]>([])

  // Streaming platforms state
  const [streamPlatforms, setStreamPlatforms] = useState<{ id: string; name: string; logo: string; website: string }[]>([])
  const [showPlatformForm, setShowPlatformForm] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [platformForm, setPlatformForm] = useState({ name: '', logo: '', website: '' })
  const [platformLoading, setPlatformLoading] = useState(false)
  const [confirmDeletePlatform, setConfirmDeletePlatform] = useState<{ id: string; name: string } | null>(null)

  // Users state
  const [users, setUsers] = useState<{ id: string; username: string; email: string; phone: string; avatar: string; createdAt: string }[]>([])
  const [userPage, setUserPage] = useState(1)
  const [userTotal, setUserTotal] = useState(0)
  const [userSearch, setUserSearch] = useState('')
  const [userLoading, setUserLoading] = useState(false)

  // Movie form
  const [showMovieForm, setShowMovieForm] = useState(false)
  const [editingMovie, setEditingMovie] = useState<string | null>(null)
  const [movieForm, setMovieForm] = useState(emptyMovie)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'movie' | 'review'; id: string; name: string } | null>(null)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats')
    const data = await res.json()
    setStats(data)
  }, [])

  const fetchMovies = useCallback(async (page = 1, search = '') => {
    setMovieLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '15' })
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/movies?${params}`)
    const data = await res.json()
    setMovies(data.movies || [])
    setMovieTotal(data.totalPages || 1)
    setMoviePage(data.page || 1)
    setMovieLoading(false)
  }, [])

  const fetchReviews = useCallback(async (page = 1, search = '') => {
    setReviewLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '15' })
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/reviews?${params}`)
    const data = await res.json()
    setReviews(data.reviews || [])
    setReviewTotal(data.totalPages || 1)
    setReviewPage(data.page || 1)
    setReviewLoading(false)
  }, [])

  const fetchGenres = useCallback(async () => {
    const res = await fetch('/api/admin/genres')
    const data = await res.json()
    setGenres(data.genres || [])
  }, [])

  const fetchPlatforms = useCallback(async () => {
    setPlatformLoading(true)
    const res = await fetch('/api/admin/platforms')
    const data = await res.json()
    setStreamPlatforms(data.platforms || [])
    setPlatformLoading(false)
  }, [])

  const fetchUsers = useCallback(async (page = 1, search = '') => {
    setUserLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    const res = await fetch('/api/auth/users?' + params)
    const data = await res.json()
    setUsers(data.users || [])
    setUserTotal(data.totalPages || 1)
    setUserPage(data.page || 1)
    setUserLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    fetchGenres()
    fetchPlatforms()
  }, [fetchStats, fetchGenres, fetchPlatforms])

  useEffect(() => {
    if (tab === 'movies') fetchMovies(1, movieSearch)
    if (tab === 'reviews') fetchReviews(1, reviewSearch)
    if (tab === 'users') fetchUsers(1, userSearch)
    if (tab === 'streaming') fetchPlatforms()
  }, [tab])

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...movieForm,
      actorPhotos: movieForm.actors.length ? JSON.stringify(movieForm.actors) : null,
      photos: movieForm.photos.length ? JSON.stringify(movieForm.photos) : null,
      streamingPlatforms: movieForm.streamingPlatforms,
    }

    try {
      if (editingMovie) {
        const res = await fetch(`/api/admin/movies/${editingMovie}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to update movie' }))
          alert(err.error || 'Failed to update movie')
          setSaving(false)
          return
        }
      } else {
        const res = await fetch('/api/admin/movies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to create movie' }))
          alert(err.error || 'Failed to create movie')
          setSaving(false)
          return
        }
      }

      setShowMovieForm(false)
      setEditingMovie(null)
      setMovieForm(emptyMovie)
      fetchMovies(1, movieSearch)
      fetchStats()
    } catch (err) {
      alert('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const endpoint = confirmDelete.type === 'movie'
      ? `/api/admin/movies/${confirmDelete.id}`
      : `/api/admin/reviews/${confirmDelete.id}`

    await fetch(endpoint, { method: 'DELETE' })
    setConfirmDelete(null)

    if (confirmDelete.type === 'movie') fetchMovies(moviePage, movieSearch)
    else fetchReviews(reviewPage, reviewSearch)
    fetchStats()
  }

  const startEditMovie = (movie: Movie) => {
    setEditingMovie(movie.id)
    let parsedActors: ActorForm[] = []
    let parsedPhotos: string[] = []
    try { parsedActors = movie.actorPhotos ? JSON.parse(movie.actorPhotos) : [] } catch {}
    try { parsedPhotos = movie.photos ? JSON.parse(movie.photos) : [] } catch {}
    setMovieForm({
      title: movie.title,
      year: movie.year,
      runtime: movie.runtime,
      rated: movie.rated,
      posterUrl: movie.posterUrl || '',
      backdropUrl: movie.backdropUrl || '',
      trailerUrl: movie.trailerUrl || '',
      director: movie.director,
      writers: movie.writers || '',
      cast: movie.cast || '',
      overview: movie.overview,
      tagline: movie.tagline || '',
      language: movie.language || 'English',
      country: movie.country || 'USA',
      genreIds: movie.genres?.map(mg => mg.genre.id) || [],
      actors: parsedActors,
      photos: parsedPhotos,
      streamingPlatforms: (movie as any).streaming?.map((s: any) => ({ platformId: s.platformId, url: s.url || '' })) || [],
    })
    setShowMovieForm(true)
  }

  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPlatform) {
      await fetch(`/api/admin/platforms/${editingPlatform}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platformForm),
      })
    } else {
      await fetch('/api/admin/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platformForm),
      })
    }
    setShowPlatformForm(false)
    setEditingPlatform(null)
    setPlatformForm({ name: '', logo: '', website: '' })
    fetchPlatforms()
    fetchStats()
  }

  const handleDeletePlatform = async () => {
    if (!confirmDeletePlatform) return
    await fetch(`/api/admin/platforms/${confirmDeletePlatform.id}`, { method: 'DELETE' })
    setConfirmDeletePlatform(null)
    fetchPlatforms()
    fetchStats()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-500" />
          Admin Panel
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#1a1a1a] rounded-lg p-1 mb-6 border border-gray-800/50">
        {([
          { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
          { id: 'movies' as Tab, label: 'Movies', icon: Film },
          { id: 'reviews' as Tab, label: 'Reviews', icon: MessageSquare },
          { id: 'users' as Tab, label: 'Users', icon: Users },
          { id: 'streaming' as Tab, label: 'Streaming', icon: Monitor },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1 justify-center',
              tab === t.id
                ? 'bg-emerald-500 text-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Movies', value: stats.movieCount, icon: Film, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Total Reviews', value: stats.reviewCount, icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-400/10' },
              { label: 'Total Users', value: stats.userCount, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { label: 'Streaming Platforms', value: streamPlatforms.length, icon: Monitor, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-lg p-6 border border-gray-800/50', s.bg)}>
                <div className="flex items-center gap-3 mb-3">
                  <s.icon className={cn('w-5 h-5', s.color)} />
                  <span className="text-gray-400 text-sm">{s.label}</span>
                </div>
                <div className={cn('text-3xl font-bold', s.color)}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800/50">
            <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setTab('movies'); setEditingMovie(null); setMovieForm(emptyMovie); setShowMovieForm(true) }}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Movie
              </button>
              <button
                onClick={() => setTab('movies')}
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Film className="w-4 h-4" /> Manage Movies
              </button>
              <button
                onClick={() => setTab('reviews')}
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Manage Reviews
              </button>
              <button
                onClick={() => setTab('users')}
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Manage Users
              </button>
              <button
                onClick={() => setTab('streaming')}
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" /> Manage Streaming
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movies Tab */}
      {tab === 'movies' && (
        <div className="space-y-4">
          {/* Search + Add */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search movies..."
                value={movieSearch}
                onChange={e => setMovieSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchMovies(1, movieSearch) }}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              onClick={() => { setEditingMovie(null); setMovieForm(emptyMovie); setShowMovieForm(true) }}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Movie
            </button>
          </div>

          {/* Movies Table */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Movie</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Year</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Director</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Rating</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Reviews</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movieLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse w-1/3" />
                        </td>
                      </tr>
                    ))
                  ) : movies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No movies found</td>
                    </tr>
                  ) : (
                    movies.map(movie => (
                      <tr key={movie.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-12 rounded overflow-hidden bg-gray-800 shrink-0">
                              <img
                                src={movie.posterUrl || ''}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => onNavigate('movie', movie.slug)}
                                className="text-white font-medium hover:text-emerald-500 text-left"
                              >
                                {movie.title}
                              </button>
                              <div className="text-gray-500 text-xs mt-0.5">{movie.genres?.map(mg => mg.genre.name).join(', ')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{movie.year}</td>
                        <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{movie.director}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="flex items-center justify-center gap-1 text-emerald-500 font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            {movie.avgRating.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-400 hidden md:table-cell">{movie._count.reviews}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEditMovie(movie)}
                              className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-gray-800 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ type: 'movie', id: movie.id, name: movie.title })}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {movieTotal > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => fetchMovies(moviePage - 1, movieSearch)}
                disabled={moviePage <= 1}
                className="p-2 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm">Page {moviePage} of {movieTotal}</span>
              <button
                onClick={() => fetchMovies(moviePage + 1, movieSearch)}
                disabled={moviePage >= movieTotal}
                className="p-2 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews by author, headline, or content..."
              value={reviewSearch}
              onChange={e => setReviewSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchReviews(1, reviewSearch) }}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Author</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Movie</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Rating</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Review</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Helpful</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse w-1/3" />
                        </td>
                      </tr>
                    ))
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No reviews found</td>
                    </tr>
                  ) : (
                    reviews.map(review => (
                      <tr key={review.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{review.author}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onNavigate('movie', review.movie.slug)}
                            className="text-emerald-500 hover:underline text-left"
                          >
                            {review.movie.title}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-emerald-500 font-bold">{review.rating.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                          <span className="line-clamp-1">{review.headline ? `${review.headline} — ` : ''}{review.content}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-400 hidden md:table-cell">👍 {review.helpful}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => setConfirmDelete({ type: 'review', id: review.id, name: `${review.author}'s review` })}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {reviewTotal > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => fetchReviews(reviewPage - 1, reviewSearch)}
                disabled={reviewPage <= 1}
                className="p-2 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm">Page {reviewPage} of {reviewTotal}</span>
              <button
                onClick={() => fetchReviews(reviewPage + 1, reviewSearch)}
                disabled={reviewPage >= reviewTotal}
                className="p-2 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchUsers(1, userSearch) }}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {userLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse w-1/3" />
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No users registered yet</td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar || ''} alt="" className="w-8 h-8 rounded-full bg-gray-800" />
                            <span className="text-white font-medium">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{user.email}</td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{user.phone}</td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {userTotal > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => fetchUsers(userPage - 1, userSearch)}
                disabled={userPage <= 1}
                className="p-2 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm">Page {userPage} of {userTotal}</span>
              <button
                onClick={() => fetchUsers(userPage + 1, userSearch)}
                disabled={userPage >= userTotal}
                className="p-2 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Streaming Platforms Tab */}
      {tab === 'streaming' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-white text-lg font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              Streaming Platforms
            </h2>
            <button
              onClick={() => { setEditingPlatform(null); setPlatformForm({ name: '', logo: '', website: '' }); setShowPlatformForm(true) }}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Platform
            </button>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Platform</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Website</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {platformLoading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td colSpan={3} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse w-1/3" />
                        </td>
                      </tr>
                    ))
                  ) : streamPlatforms.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No streaming platforms added yet</td>
                    </tr>
                  ) : (
                    streamPlatforms.map(p => (
                      <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.logo ? (
                              <img src={p.logo} alt="" className="w-8 h-8 rounded bg-gray-800 object-contain" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-blue-400/10 flex items-center justify-center">
                                <Tv className="w-4 h-4 text-blue-400" />
                              </div>
                            )}
                            <span className="text-white font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {p.website ? (
                            <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                              {p.website} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingPlatform(p.id)
                                setPlatformForm({ name: p.name, logo: p.logo, website: p.website })
                                setShowPlatformForm(true)
                              }}
                              className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-gray-800 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeletePlatform({ id: p.id, name: p.name })}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {streamPlatforms.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800/50">
              <p className="text-gray-500 text-sm">{streamPlatforms.length} platform{streamPlatforms.length !== 1 ? 's' : ''} total</p>
            </div>
          )}
        </div>
      )}

      {/* Platform Form Dialog */}
      {showPlatformForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPlatformForm(false)} />
          <div className="relative bg-[#1a1a1a] rounded-xl border border-gray-700 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-bold">
                {editingPlatform ? 'Edit Platform' : 'Add Streaming Platform'}
              </h2>
              <button onClick={() => { setShowPlatformForm(false); setEditingPlatform(null) }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePlatform} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Platform Name *</label>
                <input
                  required
                  value={platformForm.name}
                  onChange={e => setPlatformForm({ ...platformForm, name: e.target.value })}
                  placeholder="e.g. Netflix, Amazon Prime, Disney+"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Logo URL</label>
                <input
                  value={platformForm.logo}
                  onChange={e => setPlatformForm({ ...platformForm, logo: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Website URL</label>
                <input
                  value={platformForm.website}
                  onChange={e => setPlatformForm({ ...platformForm, website: e.target.value })}
                  placeholder="https://www.netflix.com"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-6 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingPlatform ? 'Update' : 'Add Platform'}
                </button>
                <button type="button" onClick={() => { setShowPlatformForm(false); setEditingPlatform(null) }}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Platform Delete Confirmation */}
      {confirmDeletePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDeletePlatform(null)} />
          <div className="relative bg-[#1a1a1a] rounded-xl border border-gray-700 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Delete Platform</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Delete <span className="font-semibold text-white">{confirmDeletePlatform.name}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeletePlatform(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={handleDeletePlatform}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movie Form Dialog */}
      {showMovieForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowMovieForm(false)} />
          <div className="relative bg-[#1a1a1a] rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-white text-lg font-bold">
                {editingMovie ? 'Edit Movie' : 'Add New Movie'}
              </h2>
              <button onClick={() => { setShowMovieForm(false); setEditingMovie(null) }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMovie} className="p-6 space-y-4">
              {/* Title & Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Title *</label>
                  <input required value={movieForm.title} onChange={e => setMovieForm({ ...movieForm, title: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Year *</label>
                  <input type="number" required value={movieForm.year} onChange={e => setMovieForm({ ...movieForm, year: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              {/* Director & Runtime */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Director *</label>
                  <input required value={movieForm.director} onChange={e => setMovieForm({ ...movieForm, director: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Runtime (min)</label>
                  <input type="number" value={movieForm.runtime} onChange={e => setMovieForm({ ...movieForm, runtime: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              {/* Rated & Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Rated</label>
                  <select value={movieForm.rated} onChange={e => setMovieForm({ ...movieForm, rated: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50">
                    {['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Language</label>
                  <input value={movieForm.language} onChange={e => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              {/* YouTube Trailer URL */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">YouTube Trailer URL</label>
                <input value={movieForm.trailerUrl} onChange={e => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
              </div>

              {/* Poster & Backdrop URLs */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Poster URL</label>
                <input value={movieForm.posterUrl} onChange={e => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Backdrop URL</label>
                <input value={movieForm.backdropUrl} onChange={e => setMovieForm({ ...movieForm, backdropUrl: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
              </div>

              {/* Cast & Writers */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Cast</label>
                <input value={movieForm.cast} onChange={e => setMovieForm({ ...movieForm, cast: e.target.value })}
                  placeholder="Actor 1, Actor 2, Actor 3"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Writers</label>
                <input value={movieForm.writers} onChange={e => setMovieForm({ ...movieForm, writers: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
              </div>

              {/* Overview */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Overview *</label>
                <textarea required rows={3} value={movieForm.overview} onChange={e => setMovieForm({ ...movieForm, overview: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none" />
              </div>

              {/* Tagline */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Tagline</label>
                <input value={movieForm.tagline} onChange={e => setMovieForm({ ...movieForm, tagline: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
              </div>

              {/* Top Cast — Actor Name & Photo */}
              <div className="border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400 font-medium">Top Cast (Actor Name + Photo)</label>
                  <button type="button" onClick={() => setMovieForm({ ...movieForm, actors: [...movieForm.actors, { ...emptyActor }] })}
                    className="text-emerald-500 hover:text-yellow-300 text-xs font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Actor
                  </button>
                </div>
                {movieForm.actors.length === 0 && (
                  <p className="text-gray-600 text-xs">No actors added yet. Click "Add Actor" to begin.</p>
                )}
                <div className="space-y-3">
                  {movieForm.actors.map((actor, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-gray-900/50 rounded-lg p-3">
                      <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-gray-700">
                        <img src={actor.photo || ''} alt={actor.name} className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://i.pravatar.cc/120?u=${encodeURIComponent(actor.name || 'empty')}` }} />
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={actor.name} onChange={e => {
                          const actors = [...movieForm.actors]; actors[idx] = { ...actors[idx], name: e.target.value }; setMovieForm({ ...movieForm, actors })
                        }} placeholder="Actor name" className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                        <input value={actor.photo} onChange={e => {
                          const actors = [...movieForm.actors]; actors[idx] = { ...actors[idx], photo: e.target.value }; setMovieForm({ ...movieForm, actors })
                        }} placeholder="Photo URL" className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                      </div>
                      <button type="button" onClick={() => setMovieForm({ ...movieForm, actors: movieForm.actors.filter((_, i) => i !== idx) })}
                        className="text-gray-500 hover:text-red-400 p-1 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Movie Stills Gallery */}
              <div className="border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400 font-medium">Movie Stills (Photo Gallery)</label>
                  <button type="button" onClick={() => setMovieForm({ ...movieForm, photos: [...movieForm.photos, ''] })}
                    className="text-emerald-500 hover:text-yellow-300 text-xs font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Photo
                  </button>
                </div>
                {movieForm.photos.length === 0 && (
                  <p className="text-gray-600 text-xs">No photos added yet. Click "Add Photo" to add movie stills.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {movieForm.photos.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
                      <div className="w-16 h-10 rounded bg-gray-800 overflow-hidden shrink-0 border border-gray-700">
                        {url ? (
                          <img src={url} alt={`Still ${idx + 1}`} className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <span className="text-[10px]">{idx + 1}</span>
                          </div>
                        )}
                      </div>
                      <input value={url} onChange={e => {
                        const photos = [...movieForm.photos]; photos[idx] = e.target.value; setMovieForm({ ...movieForm, photos })
                      }} placeholder={`Photo URL ${idx + 1}`} className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                      <button type="button" onClick={() => setMovieForm({ ...movieForm, photos: movieForm.photos.filter((_, i) => i !== idx) })}
                        className="text-gray-500 hover:text-red-400 p-1 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {movieForm.photos.length > 0 && (
                  <div className="mt-2">
                    <button type="button" onClick={() => setMovieForm({ ...movieForm, photos: [...movieForm.photos, ''] })}
                      className="text-gray-500 hover:text-white text-xs">+ Add another photo URL</button>
                  </div>
                )}
              </div>

              {/* Streaming Platforms */}
              <div className="border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    Streaming Platforms
                  </label>
                  <button type="button"
                    onClick={() => setMovieForm({ ...movieForm, streamingPlatforms: [...movieForm.streamingPlatforms, { platformId: streamPlatforms[0]?.id || '', url: '' }] })}
                    className="text-emerald-500 hover:text-yellow-300 text-xs font-medium flex items-center gap-1"
                    disabled={streamPlatforms.length === 0}>
                    <Plus className="w-3 h-3" /> Add Platform
                  </button>
                </div>
                {streamPlatforms.length === 0 ? (
                  <p className="text-gray-600 text-xs">No streaming platforms added yet. Add platforms in the Streaming tab first.</p>
                ) : movieForm.streamingPlatforms.length === 0 ? (
                  <p className="text-gray-600 text-xs">No platforms assigned. Click "Add Platform" to assign streaming platforms.</p>
                ) : (
                  <div className="space-y-2">
                    {movieForm.streamingPlatforms.map((sp, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
                        <select
                          value={sp.platformId}
                          onChange={e => {
                            const platforms = [...movieForm.streamingPlatforms]
                            platforms[idx] = { ...platforms[idx], platformId: e.target.value }
                            setMovieForm({ ...movieForm, streamingPlatforms: platforms })
                          }}
                          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 min-w-[140px]">
                          {streamPlatforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input
                          value={sp.url}
                          onChange={e => {
                            const platforms = [...movieForm.streamingPlatforms]
                            platforms[idx] = { ...platforms[idx], url: e.target.value }
                            setMovieForm({ ...movieForm, streamingPlatforms: platforms })
                          }}
                          placeholder="Watch URL (optional)"
                          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                        />
                        <button type="button"
                          onClick={() => setMovieForm({ ...movieForm, streamingPlatforms: movieForm.streamingPlatforms.filter((_, i) => i !== idx) })}
                          className="text-gray-500 hover:text-red-400 p-1 shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Genres */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Genres</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        const ids = movieForm.genreIds.includes(g.id)
                          ? movieForm.genreIds.filter(id => id !== g.id)
                          : [...movieForm.genreIds, g.id]
                        setMovieForm({ ...movieForm, genreIds: ids })
                      }}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                        movieForm.genreIds.includes(g.id)
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                      )}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-semibold px-6 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : editingMovie ? 'Update Movie' : 'Create Movie'}
                </button>
                <button type="button" onClick={() => { setShowMovieForm(false); setEditingMovie(null) }}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[#1a1a1a] rounded-xl border border-gray-700 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Confirm Delete</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{confirmDelete.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
