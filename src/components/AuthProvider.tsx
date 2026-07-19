import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from './types'

interface AuthContextType {
  user: User | null
  loading: boolean
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  showAuthModal: false,
  setShowAuthModal: () => {},
  signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('moviedb_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
    setLoading(false)
  }, [])

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('moviedb_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, showAuthModal, setShowAuthModal, signOut }}>
      {children}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={(u) => { setUser(u); localStorage.setItem('moviedb_user', JSON.stringify(u)); setShowAuthModal(false) }} />}
    </AuthContext.Provider>
  )
}

function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const url = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
    const body = mode === 'register'
      ? form
      : { email: form.email, password: form.password }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        onLogin(data.user)
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-orange-500 p-6 text-center">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-emerald-500 font-bold text-2xl">M</span>
          </div>
          <h2 className="text-black text-2xl font-bold">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-black/60 text-sm mt-1">
            {mode === 'login' ? 'Sign in to your MovieDB account' : 'Join MovieDB today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Username *</label>
              <input
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Enter your username"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email Address *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Phone Number *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Password *</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              minLength={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold py-3 rounded-lg text-sm transition-colors"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="text-center text-sm text-gray-400">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={() => { setMode('register'); setError('') }} className="text-emerald-500 hover:text-yellow-300 font-medium">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('login'); setError('') }} className="text-emerald-500 hover:text-yellow-300 font-medium">
                  Sign In
                </button>
              </>
            )}
          </div>
        </form>

        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-black/40 hover:text-black/70 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}
