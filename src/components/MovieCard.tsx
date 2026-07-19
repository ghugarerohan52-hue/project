import { Star, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Movie } from './types'

interface MovieCardProps {
  movie: Movie
  onClick: (slug: string) => void
  rank?: number
  showOverview?: boolean
}

function formatCurrency(amount: number | null): string {
  if (!amount) return 'N/A'
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  return `$${(amount / 1_000).toFixed(0)}K`
}

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 9 ? 'bg-emerald-600 text-black' :
    rating >= 8 ? 'bg-emerald-500/90 text-black' :
    rating >= 7 ? 'bg-emerald-500/70 text-black' :
    rating >= 6 ? 'bg-gray-500 text-white' : 'bg-gray-600 text-white'

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-bold', color)}>
      <Star className="w-3 h-3 fill-current" />
      {rating.toFixed(1)}
    </div>
  )
}

export default function MovieCard({ movie, onClick, rank, showOverview = false }: MovieCardProps) {
  const posterPlaceholder = `https://placehold.co/300x450/1a1a1a/666?text=${encodeURIComponent(movie.title.substring(0, 15))}`

  return (
    <button
      onClick={() => onClick(movie.slug)}
      className="group bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#222] transition-all duration-200 text-left w-full border border-transparent hover:border-gray-700/50"
    >
      <div className="relative overflow-hidden">
        {rank !== undefined && (
          <div className="absolute top-0 left-0 z-10 bg-black/70 backdrop-blur-sm text-emerald-500 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-br">
            {rank}
          </div>
        )}
        <div className="aspect-[2/3] bg-gray-800">
          <img
            src={movie.posterUrl || posterPlaceholder}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = posterPlaceholder
            }}
          />
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8">
          <RatingBadge rating={movie.avgRating} />
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold line-clamp-2 group-hover:text-emerald-500 transition-colors min-h-[2.5rem]">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span>{movie.year}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {movie.runtime}m
          </span>
        </div>
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {movie.genres.slice(0, 2).map((mg) => (
              <span key={mg.genre.id} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded">
                {mg.genre.name}
              </span>
            ))}
          </div>
        )}
        {showOverview && movie.overview && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{movie.overview}</p>
        )}
      </div>
    </button>
  )
}
