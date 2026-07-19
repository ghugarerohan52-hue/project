export interface Genre {
  id: string
  name: string
  slug: string
  description?: string | null
}

export interface MovieGenre {
  genre: Genre
}

export interface StreamingLink {
  platform: string
  url: string
  logo: string
  type: 'stream' | 'rent' | 'buy'
}

export interface TriviaItem {
  question: string
  answer: string
}

export interface QuoteItem {
  character: string
  text: string
}

export interface Movie {
  id: string
  title: string
  slug: string
  year: number
  runtime: number
  rated: string
  posterUrl?: string | null
  backdropUrl?: string | null
  trailerUrl?: string | null
  director: string
  writers?: string | null
  cast?: string | null
  actorPhotos?: string | null
  photos?: string | null
  overview: string
  tagline?: string | null
  language?: string | null
  country?: string | null
  budget?: number | null
  revenue?: number | null
  streamingLinks?: string | null
  trivia?: string | null
  quotes?: string | null
  didYouKnow?: string | null
  awards?: string | null
  release_date?: string | null
  metascore?: number | null
  avgRating: number
  ratingCount: number
  genres: MovieGenre[]
  reviews?: Review[]
}

export interface Review {
  id: string
  movieId: string
  author: string
  headline?: string | null
  content: string
  rating: number
  helpful: number
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
}
