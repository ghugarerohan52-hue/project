import { Film, Mail, Phone, MapPin, Shield, Lock, Eye, Database, Globe, UserCheck } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Film className="w-10 h-10 text-black" />
        </div>
        <h1 className="text-white text-4xl font-bold mb-4">About MovieDB</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Your ultimate destination for discovering, reviewing, and exploring movies from around the world.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Film, title: 'Discover', desc: 'Browse thousands of movies across every genre with detailed info, ratings, and reviews.' },
          { icon: UserCheck, title: 'Review', desc: 'Share your thoughts, rate movies, and help others discover great films.' },
          { icon: Globe, title: 'Stream', desc: 'Find where to watch — streaming links for Netflix, Prime, Disney+ and more.' },
        ].map(item => (
          <div key={item.title} className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <item.icon className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-8 border border-gray-800/50">
        <h2 className="text-white text-2xl font-bold mb-4">Our Mission</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          MovieDB was created with one goal: to build the best movie discovery platform for film lovers everywhere. 
          We combine comprehensive movie data with community reviews to help you find your next favorite film.
        </p>
        <p className="text-gray-300 leading-relaxed">
          Whether you're looking for the latest blockbusters, hidden gems, or classic cinema — 
          MovieDB has you covered with detailed information, user reviews, and streaming availability.
        </p>
      </div>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-white text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: July 2026</p>

      <div className="space-y-8">
        {[
          { icon: Database, title: 'Information We Collect', content: 'We collect information you provide directly: account details (name, email, phone), reviews, ratings, and preferences. We also collect usage data like pages visited and search queries to improve our service.' },
          { icon: Eye, title: 'How We Use Your Information', content: 'Your data helps us personalize your experience, show relevant movie recommendations, improve our platform, and communicate important updates. We do not sell your personal information to third parties.' },
          { icon: Lock, title: 'Data Security', content: 'We implement industry-standard encryption and security measures to protect your data. All passwords are securely hashed. Regular security audits ensure your information stays safe.' },
          { icon: Shield, title: 'Your Rights', content: 'You can access, update, or delete your account and data at any time. You can also export your data or request a copy. Contact us for any data-related requests.' },
          { icon: Globe, title: 'Cookies & Tracking', content: 'We use essential cookies for authentication and preference storage. Optional analytics cookies help us understand usage patterns. You can manage cookie preferences in your browser settings.' },
          { icon: UserCheck, title: 'Third-Party Services', content: 'We integrate with streaming platforms (Netflix, Prime, etc.) for watch links. These services have their own privacy policies. We only share data with your explicit consent.' },
        ].map(section => (
          <div key={section.title} className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50">
            <div className="flex items-center gap-3 mb-3">
              <section.icon className="w-5 h-5 text-emerald-500" />
              <h2 className="text-white text-lg font-bold">{section.title}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed text-sm">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-white text-4xl font-bold mb-2">Contact Us</h1>
      <p className="text-gray-400 mb-8">We'd love to hear from you. Reach out anytime!</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-emerald-500" />
              <h3 className="text-white font-semibold">Email</h3>
            </div>
            <a href="mailto:support@moviedb.com" className="text-emerald-500 hover:underline text-sm">support@moviedb.com</a>
            <p className="text-gray-500 text-xs mt-1">For general inquiries and support</p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50">
            <div className="flex items-center gap-3 mb-3">
              <Phone className="w-5 h-5 text-emerald-500" />
              <h3 className="text-white font-semibold">Phone</h3>
            </div>
            <a href="tel:+919876543210" className="text-emerald-500 hover:underline text-sm">+91 98765 43210</a>
            <p className="text-gray-500 text-xs mt-1">Mon–Fri, 9 AM – 6 PM IST</p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-5 h-5 text-emerald-500" />
              <h3 className="text-white font-semibold">Location</h3>
            </div>
            <p className="text-gray-300 text-sm">Pune, Maharashtra, India</p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50">
          <h3 className="text-white font-bold text-lg mb-4">Send a Message</h3>
          <form onSubmit={(e) => { e.preventDefault(); alert('Thank you! We will get back to you soon.') }} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Name</label>
              <input required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <input required type="email" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Message</label>
              <textarea required rows={4} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none" placeholder="Write your message..." />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
