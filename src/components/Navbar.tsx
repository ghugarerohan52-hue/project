import { useState } from 'react'
import { Search, Film, Menu, X, Star, ChevronDown, LogIn, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from './AuthProvider'

interface NavbarProps {
  onNavigate: (page: string, param?: string) => void
  currentPage: string
}

export default function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, signOut, setShowAuthModal } = useAuth()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onNavigate('search', searchQuery.trim())
      setMobileMenuOpen(false)
    }
  }

  const navLinks = [
    { label: 'Home', page: 'home' },
    { label: 'Top 250', page: 'top250' },
    { label: 'Browse', page: 'browse' },
    { label: 'About', page: 'about' },
    { label: 'Contact', page: 'contact' },
  ]

  return (
    <nav className="bg-[#121212] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center">
              <Film className="w-6 h-6 text-black" />
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">
              Movie<span className="text-emerald-500">DB</span>
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => onNavigate(link.page)}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  currentPage === link.page
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                )}
              >
                {link.label}
              </button>
            ))}
            {user && (
              <button
                onClick={() => onNavigate('admin')}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  currentPage === 'admin'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                )}
              >
                Admin
              </button>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search movies, directors, actors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </form>

          {/* User / Login */}
          <div className="relative shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-full px-3 py-1.5 transition-colors"
                >
                  <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
                  <span className="text-white text-sm font-medium hidden sm:block">{user.name}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl py-2 min-w-[180px] z-50">
                    <div className="px-4 py-2 border-b border-gray-800">
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-full px-4 py-1.5 text-sm transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="hidden sm:block">Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white p-2"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-[#1a1a1a]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => { onNavigate(link.page); setMobileMenuOpen(false) }}
                className={cn(
                  'block w-full text-left px-3 py-2 text-sm rounded-md',
                  currentPage === link.page
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                )}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => { onNavigate('privacy'); setMobileMenuOpen(false) }}
              className={cn(
                'block w-full text-left px-3 py-2 text-sm rounded-md',
                currentPage === 'privacy' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              Privacy Policy
            </button>
            {user && (
              <button
                onClick={() => { onNavigate('admin'); setMobileMenuOpen(false) }}
                className={cn(
                  'block w-full text-left px-3 py-2 text-sm rounded-md',
                  currentPage === 'admin' ? 'bg-emerald-500/10 text-emerald-500' : 'text-gray-300 hover:bg-gray-800'
                )}
              >
                Admin
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
