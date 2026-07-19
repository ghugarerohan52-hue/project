import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './components/AuthProvider'
import Navbar from './components/Navbar'
import HomePage from './components/HomePage'
import MovieDetail from './components/MovieDetail'
import BrowsePage from './components/BrowsePage'
import Top250Page from './components/Top250Page'
import SearchPage from './components/SearchPage'
import AdminPanel from './components/AdminPanel'
import { AboutPage, PrivacyPage, ContactPage } from './components/InfoPages'

function AppContent() {
  const [page, setPage] = useState('home')
  const [pageParam, setPageParam] = useState('')
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('moviedb_admin') === 'true')
  const [showAdminAuth, setShowAdminAuth] = useState(false)
  const { user } = useAuth()

  const navigate = useCallback((newPage: string, param?: string) => {
    setPage(newPage)
    setPageParam(param || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleAdminAuth = (password: string) => {
    if (password === 'moviedb2024') {
      setIsAdmin(true)
      setShowAdminAuth(false)
      localStorage.setItem('moviedb_admin', 'true')
      setPage('admin')
    } else {
      alert('Wrong password!')
    }
  }

  const renderPage = () => {
    switch (page) {
      case 'movie':
        return <MovieDetail slug={pageParam} onNavigate={navigate} />
      case 'browse':
      case 'genre':
        return <BrowsePage onNavigate={navigate} initialGenre={pageParam} />
      case 'top250':
        return <Top250Page onNavigate={navigate} />
      case 'search':
        return <SearchPage query={pageParam} onNavigate={navigate} />
      case 'admin':
        if (!user) {
          return (
            <div className="max-w-md mx-auto px-4 py-16 text-center">
              <h2 className="text-white text-2xl font-bold mb-2">Login Required</h2>
              <p className="text-gray-400 mb-4">Please sign in to access the admin panel.</p>
              <button onClick={() => useAuth().setShowAuthModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-6 py-2 rounded-lg">Sign In</button>
            </div>
          )
        }
        if (!isAdmin) {
          if (showAdminAuth) {
            return (
              <div className="max-w-md mx-auto px-4 py-16">
                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50">
                  <h2 className="text-white text-xl font-bold mb-4 text-center">Admin Authentication</h2>
                  <p className="text-gray-400 text-sm mb-4 text-center">Enter the admin password to continue.</p>
                  <AdminAuthForm onSubmit={handleAdminAuth} onCancel={() => setShowAdminAuth(false)} />
                </div>
              </div>
            )
          }
          return (
            <div className="max-w-md mx-auto px-4 py-16 text-center">
              <h2 className="text-white text-2xl font-bold mb-2">Admin Access</h2>
              <p className="text-gray-400 mb-4">Enter admin password to access the panel.</p>
              <button onClick={() => setShowAdminAuth(true)} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-6 py-2 rounded-lg">Enter Admin Password</button>
              <p className="text-gray-600 text-xs mt-4">
                <button onClick={() => { setIsAdmin(false); localStorage.removeItem('moviedb_admin') }} className="hover:text-gray-400">Revoke Admin Access</button>
              </p>
            </div>
          )
        }
        return <AdminPanel onNavigate={navigate} />
      case 'about':
        return <AboutPage />
      case 'privacy':
        return <PrivacyPage />
      case 'contact':
        return <ContactPage />
      default:
        return <HomePage onNavigate={navigate} />
    }
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar onNavigate={navigate} currentPage={page} />
      <main>{renderPage()}</main>
      <footer className="bg-[#1a1a1a] border-t border-gray-800 mt-8 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 text-sm">
            <div>
              <h4 className="text-white font-semibold mb-3">MovieDB</h4>
              <p className="text-gray-500 text-xs leading-relaxed">Your ultimate destination for discovering and reviewing movies.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2">
                <button onClick={() => navigate('home')} className="block text-gray-400 hover:text-emerald-500 text-xs">Home</button>
                <button onClick={() => navigate('browse')} className="block text-gray-400 hover:text-emerald-500 text-xs">Browse Movies</button>
                <button onClick={() => navigate('top250')} className="block text-gray-400 hover:text-emerald-500 text-xs">Top 250</button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <div className="space-y-2">
                <button onClick={() => navigate('privacy')} className="block text-gray-400 hover:text-emerald-500 text-xs">Privacy Policy</button>
                <button onClick={() => navigate('about')} className="block text-gray-400 hover:text-emerald-500 text-xs">About Us</button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <div className="space-y-2">
                <button onClick={() => navigate('contact')} className="block text-gray-400 hover:text-emerald-500 text-xs">Contact Us</button>
                <span className="block text-gray-500 text-xs">support@moviedb.com</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-4 text-center text-xs text-gray-600">
            <p>© 2026 MovieDB. Built with ❤️ for movie lovers everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function AdminAuthForm({ onSubmit, onCancel }: { onSubmit: (pw: string) => void; onCancel: () => void }) {
  const [pw, setPw] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(pw) }} className="space-y-4">
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} autoFocus
        placeholder="Enter admin password" required
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
      <div className="flex gap-3">
        <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors">Verify</button>
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
      </div>
    </form>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
