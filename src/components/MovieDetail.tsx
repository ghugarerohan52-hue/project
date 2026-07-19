import { useState, useEffect } from 'react'
import { Star, Clock, Play, X, ChevronLeft, ChevronRight, User, ExternalLink, Award, HelpCircle, Quote, Tv, Sparkles, ThumbsUp } from 'lucide-react'
import type { Movie, Review, StreamingLink, TriviaItem, QuoteItem } from './types'
import { cn } from '@/lib/cn'
import { useAuth } from './AuthProvider'

interface MovieDetailProps {
  slug: string
  onNavigate: (page: string, param?: string) => void
}

interface Actor {
  name: string
  photo: string
}

function formatCurrency(amount: number | null): string {
  if (!amount) return 'N/A'
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)} billion`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)} million`
  return `$${(amount / 1_000).toFixed(0)}K`
}

function getYouTubeId(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  const match = url.match(/[?&]v=([^&]+)/)
  if (match) return match[1]
  const shortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (shortMatch) return shortMatch[1]
  return undefined
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const stars = Math.round(rating / 2)
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn(sizeClass, s <= stars ? 'text-emerald-500 fill-emerald-500' : 'text-gray-600')} />
      ))}
    </div>
  )
}

function StreamingSection({ links }: { links: StreamingLink[] }) {
  if (!links.length) return null
  const streamLinks = links.filter(l => l.type === 'stream')
  const rentLinks = links.filter(l => l.type === 'rent')
  const buyLinks = links.filter(l => l.type === 'buy')

  const platformColors: Record<string, string> = {
    'Netflix': 'bg-[#E50914]',
    'Amazon Prime Video': 'bg-[#00A8E1]',
    'Disney+': 'bg-[#113CCF]',
    'HBO Max': 'bg-[#B621FE]',
    'Hulu': 'bg-[#1CE783]',
    'Apple TV+': 'bg-[#555555]',
    'Paramount+': 'bg-[#0064FF]',
    'YouTube': 'bg-[#FF0000]',
    'Google Play': 'bg-[#4285F4]',
    'Vudu': 'bg-[#35D0E8]',
  }

  const renderLinks = (title: string, items: StreamingLink[]) => {
    if (!items.length) return null
    return (
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
        <div className="flex flex-wrap gap-2">
          {items.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:scale-105 hover:shadow-lg',
                platformColors[link.platform] || 'bg-gray-700 hover:bg-gray-600'
              )}
            >
              {link.logo ? (
                <img src={link.logo} alt="" className="w-5 h-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <Tv className="w-4 h-4" />
              )}
              {link.platform}
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50">
      <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
        <Tv className="w-5 h-5 text-green-400" />
        Where to Watch
      </h3>
      <div className="space-y-4">
        {renderLinks('Stream', streamLinks)}
        {renderLinks('Rent', rentLinks)}
        {renderLinks('Buy', buyLinks)}
      </div>
    </div>
  )
}

function TriviaSection({ trivia, didYouKnow }: { trivia: TriviaItem[]; didYouKnow?: string }) {
  if (!trivia.length && !didYouKnow) return null
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50">
      <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-blue-400" />
        Did You Know?
      </h3>
      {didYouKnow && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
          <p className="text-gray-300 text-sm leading-relaxed">{didYouKnow}</p>
        </div>
      )}
      <div className="space-y-3">
        {trivia.map((item, i) => (
          <details key={i} className="group bg-gray-900/50 rounded-lg overflow-hidden">
            <summary className="p-4 cursor-pointer text-white text-sm font-medium flex items-center gap-2 hover:bg-gray-800/50 transition-colors">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              {item.question}
            </summary>
            <div className="px-4 pb-4">
              <p className="text-gray-400 text-sm leading-relaxed">{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

function QuotesSection({ quotes }: { quotes: QuoteItem[] }) {
  if (!quotes.length) return null
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50">
      <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
        <Quote className="w-5 h-5 text-purple-400" />
        Memorable Quotes
      </h3>
      <div className="space-y-3">
        {quotes.map((q, i) => (
          <div key={i} className="border-l-2 border-purple-400/30 pl-4 py-2">
            <p className="text-gray-300 text-sm italic leading-relaxed">"{q.text}"</p>
            <p className="text-purple-400 text-xs mt-1 font-medium">— {q.character}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewCard({ review, onHelpful }: { review: Review; onHelpful: (id: string) => void }) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StarRating rating={review.rating} />
            <span className="text-emerald-500 font-bold text-sm">{review.rating.toFixed(1)}</span>
          </div>
          {review.headline && <h4 className="text-white font-semibold mb-1">{review.headline}</h4>}
          <p className="text-gray-300 text-sm leading-relaxed mb-3">{review.content}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{review.author}</span>
            <span>·</span>
            <span>{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <button onClick={() => onHelpful(review.id)} className="ml-auto text-gray-400 hover:text-emerald-500 transition-colors flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> Helpful ({review.helpful})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  if (!photos.length) return null

  return (
    <>
      <div className="mb-10">
        <h2 className="text-white text-xl font-bold mb-4">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <button key={i} onClick={() => setLightboxIdx(i)} className="aspect-video bg-gray-800 rounded overflow-hidden hover:ring-2 hover:ring-emerald-500/50 transition-all group">
              <img src={url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 text-white/70 hover:text-white z-10"><X className="w-8 h-8" /></button>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + photos.length) % photos.length) }} className="absolute left-4 text-white/70 hover:text-white z-10 bg-white/10 rounded-full p-2"><ChevronLeft className="w-6 h-6" /></button>
          <img src={photos[lightboxIdx]} alt={`${title} ${lightboxIdx + 1}`} className="max-w-[90vw] max-h-[85vh] object-contain rounded" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % photos.length) }} className="absolute right-4 text-white/70 hover:text-white z-10 bg-white/10 rounded-full p-2"><ChevronRight className="w-6 h-6" /></button>
          <div className="absolute bottom-6 text-white/60 text-sm">{lightboxIdx + 1} / {photos.length}</div>
        </div>
      )}
    </>
  )
}

export default function MovieDetail({ slug, onNavigate }: MovieDetailProps) {
  const { user } = useAuth()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ author: '', headline: '', content: '', rating: 7 })
  const [submitting, setSubmitting] = useState(false)
  const [trailerPlaying, setTrailerPlaying] = useState(false)
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([])

  useEffect(() => {
    setLoading(true)
    setTrailerPlaying(false)
    fetch(`/api/movies/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else {
          setMovie(data.movie)
          // Auto-play trailer
          if (data.movie?.trailerUrl) {
            setTrailerPlaying(true)
          }
          // Load similar movies
          if (data.movie?.genres?.length) {
            const genre = data.movie.genres[0]?.genre?.name
            if (genre) {
              fetch(`/api/movies?genre=${encodeURIComponent(genre)}&limit=6`)
                .then(r => r.json())
                .then(d => {
                  const filtered = (d.movies || []).filter((m: Movie) => m.slug !== slug).slice(0, 4)
                  setSimilarMovies(filtered)
                })
            }
          }
        }
        setLoading(false)
      })
      .catch(() => { setError('Failed to load movie'); setLoading(false) })
  }, [slug])

  useEffect(() => {
    if (user && !reviewForm.author) {
      setReviewForm(f => ({ ...f, author: user.name }))
    }
  }, [user])

  const handleHelpful = async (reviewId: string) => {
    await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' })
    if (movie) {
      setMovie({
        ...movie,
        reviews: (movie.reviews || []).map(r => r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r),
      })
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movie) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.id, ...reviewForm, rating: reviewForm.rating }),
      })
      if (res.ok) {
        const { review } = await res.json()
        setMovie({
          ...movie,
          reviews: [review, ...(movie.reviews || [])],
          avgRating: ((movie.avgRating * movie.ratingCount) + review.rating) / (movie.ratingCount + 1),
          ratingCount: movie.ratingCount + 1,
        })
        setShowReviewForm(false)
        setReviewForm({ author: user?.name || '', headline: '', content: '', rating: 7 })
      }
    } catch {}
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-[50vh] bg-gray-800" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-800 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-800 rounded w-2/3 mb-2" />
          <div className="h-4 bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-white text-2xl font-bold mb-2">Movie not found</h2>
        <p className="text-gray-400">{error || "The movie you're looking for doesn't exist."}</p>
        <button onClick={() => onNavigate('home')} className="mt-4 text-emerald-500 hover:underline">Back to Home</button>
      </div>
    )
  }

  const actors: Actor[] = movie.actorPhotos ? JSON.parse(movie.actorPhotos) : []
  const photos: string[] = movie.photos ? JSON.parse(movie.photos) : []
  const streamingLinks: StreamingLink[] = movie.streamingLinks ? JSON.parse(movie.streamingLinks) : []
  const trivia: TriviaItem[] = movie.trivia ? JSON.parse(movie.trivia) : []
  const quotes: QuoteItem[] = movie.quotes ? JSON.parse(movie.quotes) : []
  const youtubeId = getYouTubeId(movie.trailerUrl)

  const ratingDistribution: Record<string, number> = { '9-10': 0, '7-8': 0, '5-6': 0, '3-4': 0, '1-2': 0 }
  const reviews = movie.reviews || []
  reviews.forEach(r => {
    if (r.rating >= 9) ratingDistribution['9-10']++
    else if (r.rating >= 7) ratingDistribution['7-8']++
    else if (r.rating >= 5) ratingDistribution['5-6']++
    else if (r.rating >= 3) ratingDistribution['3-4']++
    else ratingDistribution['1-2']++
  })
  const maxDist = Math.max(...Object.values(ratingDistribution), 1)

  return (
    <div>
      {/* Full-width backdrop */}
      <div className="relative h-64 md:h-80 bg-gray-900 overflow-hidden">
        <img src={movie.backdropUrl || 'https://placehold.co/1920x600/1a1a1a/333'} alt={movie.title} className="w-full h-full object-cover opacity-30" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10 pb-16">

        {/* AUTO-PLAY Trailer Section */}
        {youtubeId && (
          <div className="mb-8">
            {trailerPlaying ? (
              <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-gray-700/50 bg-black">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                    title={`${movie.title} Official Trailer`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <button onClick={() => setTrailerPlaying(false)} className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Auto-playing trailer
                </div>
              </div>
            ) : (
              <button onClick={() => setTrailerPlaying(true)} className="w-full relative rounded-xl overflow-hidden shadow-2xl border border-gray-700/50 group cursor-pointer">
                <div className="aspect-[21/9] md:aspect-[21/8] bg-gray-900 relative overflow-hidden">
                  <img src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`} alt={`${movie.title} trailer`} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" onError={(e) => { (e.target as HTMLImageElement).src = movie.backdropUrl || '' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-red-600/90 flex items-center justify-center group-hover:bg-red-500 group-hover:scale-110 transition-all shadow-lg shadow-red-600/30">
                      <Play className="w-10 h-10 md:w-12 md:h-12 text-white fill-white ml-1" />
                    </div>
                    <span className="text-white mt-3 font-semibold text-sm md:text-base">Watch Official Trailer</span>
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Info Section: Poster + Details */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="shrink-0 w-48 md:w-56 mx-auto md:mx-0">
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-700/50">
              <img src={movie.posterUrl || `https://placehold.co/300x450/1a1a1a/666?text=${encodeURIComponent(movie.title.substring(0, 15))}`} alt={movie.title} className="w-full aspect-[2/3] object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x450/1a1a1a/666?text=${encodeURIComponent(movie.title.substring(0, 15))}` }} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight">{movie.title}</h1>
            {movie.tagline && <p className="text-gray-400 italic mt-2 text-sm md:text-base">"{movie.tagline}"</p>}

            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-gray-400">
              <span className="bg-gray-700/50 px-2 py-0.5 rounded text-gray-300 text-xs font-medium border border-gray-600/50">{movie.rated}</span>
              <span>{movie.year}</span>
              <span className="text-gray-600">·</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
              <span className="text-gray-600">·</span>
              <span>{movie.genres?.map(mg => mg.genre.name).join(', ')}</span>
            </div>

            <div className="mt-5 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-emerald-500 fill-emerald-500" />
                <div>
                  <span className="text-white text-3xl font-bold">{movie.avgRating.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm ml-1">/10</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm">{movie.ratingCount.toLocaleString()} ratings</div>
            </div>

            <div className="mt-5">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">Overview</h3>
              <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Director</span>
                <span className="text-white font-medium">{movie.director}</span>
              </div>
              {movie.writers && (
                <div>
                  <span className="text-gray-500 block">Writers</span>
                  <span className="text-white font-medium text-xs leading-relaxed">{movie.writers}</span>
                </div>
              )}
              {movie.cast && (
                <div className="col-span-2 md:col-span-3">
                  <span className="text-gray-500 block">Stars</span>
                  <span className="text-white font-medium">{movie.cast}</span>
                </div>
              )}
            </div>

            {/* Awards */}
            {movie.awards && (
              <div className="mt-5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start gap-2">
                <Award className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-emerald-500/90 text-sm">{movie.awards}</p>
              </div>
            )}

            {/* Quick Facts */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {movie.language && (
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <span className="text-gray-500 block text-xs">Language</span>
                  <span className="text-white font-medium">{movie.language}</span>
                </div>
              )}
              {movie.country && (
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <span className="text-gray-500 block text-xs">Country</span>
                  <span className="text-white font-medium">{movie.country}</span>
                </div>
              )}
              <div className="bg-gray-900/50 rounded-lg p-3">
                <span className="text-gray-500 block text-xs">Release</span>
                <span className="text-white font-medium">{movie.release_date || movie.year}</span>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <span className="text-gray-500 block text-xs">Metascore</span>
                <span className={cn('font-medium', movie.metascore && movie.metascore >= 60 ? 'text-green-400' : 'text-emerald-500')}>
                  {movie.metascore || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Streaming Platforms */}
        {streamingLinks.length > 0 && (
          <div className="mt-8">
            <StreamingSection links={streamingLinks} />
          </div>
        )}

        {/* Storyline Section — IMDb Style */}
        <div className="mt-12 bg-[#1a1a1a] rounded-lg border-l-4 border-emerald-500 p-6">
          <h2 className="text-white text-xl font-bold mb-4">Storyline</h2>
          <p className="text-gray-300 leading-relaxed text-base">{movie.overview || 'No plot summary available.'}</p>
          {movie.tagline && (
            <p className="text-gray-400 italic mt-4 text-sm border-t border-gray-700/50 pt-4">
              <span className="text-gray-500 font-semibold">Tagline: </span>{movie.tagline}
            </p>
          )}
        </div>

        {/* Details Section — IMDb Style */}
        <div className="mt-8 bg-[#1a1a1a] rounded-lg border-l-4 border-emerald-500 p-6">
          <h2 className="text-white text-xl font-bold mb-4">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">Release Date</h3>
              <p className="text-white">{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">Country</h3>
              <p className="text-white">{movie.country || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">Languages</h3>
              <p className="text-white">{movie.languages || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">Runtime</h3>
              <p className="text-white">{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">Rating</h3>
              <p className="text-white">{movie.rated || 'N/A'}</p>
            </div>
            {movie.genres && movie.genres.length > 0 && (
              <div>
                <h3 className="text-gray-400 text-sm font-semibold uppercase mb-2">Genres</h3>
                <p className="text-white">{movie.genres.map(mg => mg.genre.name).join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cast & Crew — Actor Photos */}
        {actors.length > 0 && (
          <div className="mt-12">
            <h2 className="text-white text-xl font-bold mb-4">Top Cast</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {actors.map((actor, i) => (
                <div key={i} className="text-center group">
                  <div className="w-full aspect-square rounded-full overflow-hidden bg-gray-800 mb-2 border-2 border-gray-700 group-hover:border-emerald-500/50 transition-colors mx-auto max-w-[120px]">
                    <img src={actor.photo} alt={actor.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = `https://i.pravatar.cc/180?u=${encodeURIComponent(actor.name)}` }} />
                  </div>
                  <p className="text-white text-sm font-medium leading-tight">{actor.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movie Stills Gallery */}
        <div className="mt-12">
          <PhotoGallery photos={photos} title="Movie Stills" />
        </div>

        {/* IMDb-style sections: Trivia + Quotes */}
        <div className="mt-12 space-y-6">
          <TriviaSection trivia={trivia} didYouKnow={movie.didYouKnow} />
          <QuotesSection quotes={quotes} />
        </div>

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <div className="mt-12">
            <h2 className="text-white text-xl font-bold mb-4">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarMovies.map((m) => (
                <button key={m.id} onClick={() => onNavigate('movie', m.slug)} className="text-left group">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                    <img src={m.posterUrl || `https://placehold.co/300x450/1a1a1a/666?text=${encodeURIComponent(m.title.substring(0, 10))}`} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x450/1a1a1a/666?text=${encodeURIComponent(m.title.substring(0, 10))}` }} />
                  </div>
                  <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-emerald-500 transition-colors">{m.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                    <span className="text-gray-400 text-xs">{m.avgRating.toFixed(1)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-bold">User Reviews</h2>
            <button onClick={() => setShowReviewForm(!showReviewForm)} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              {user ? 'Write a Review' : 'Sign in to Review'}
            </button>
          </div>

          {/* Rating Breakdown */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6 border border-gray-800/50">
            <div className="flex items-center gap-8">
              <div className="text-center shrink-0">
                <div className="text-4xl font-bold text-emerald-500">{movie.avgRating.toFixed(1)}</div>
                <div className="text-xs text-gray-500 mt-1">{movie.ratingCount.toLocaleString()} ratings</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {Object.entries(ratingDistribution).reverse().map(([range, count]) => (
                  <div key={range} className="flex items-center gap-2 text-xs">
                    <span className="w-10 text-gray-400 text-right">{range}</span>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(count / maxDist) * 100}%` }} />
                    </div>
                    <span className="w-6 text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-[#1a1a1a] rounded-lg p-6 mb-6 border border-gray-800/50">
              <h3 className="text-white font-semibold mb-4">Your Review</h3>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Your Name *</label>
                  <input required value={reviewForm.author} onChange={e => setReviewForm({ ...reviewForm, author: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="Enter your name" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Rating: {reviewForm.rating}/10</label>
                  <input type="range" min="1" max="10" step="0.5" value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: parseFloat(e.target.value) })} className="w-full accent-emerald-500" />
                  <div className="flex justify-between text-xs text-gray-500"><span>1</span><span className="text-emerald-500 font-bold text-sm">{reviewForm.rating}</span><span>10</span></div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Headline</label>
                  <input value={reviewForm.headline} onChange={e => setReviewForm({ ...reviewForm, headline: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="Summarize your review" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Review *</label>
                  <textarea required rows={4} value={reviewForm.content} onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none" placeholder="Write your review..." />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-semibold px-6 py-2 rounded-lg text-sm transition-colors">{submitting ? 'Submitting...' : 'Submit Review'}</button>
                  <button type="button" onClick={() => setShowReviewForm(false)} className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors">Cancel</button>
                </div>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No reviews yet</p>
              <p className="text-sm">Be the first to review this movie!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (<ReviewCard key={review.id} review={review} onHelpful={handleHelpful} />))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
