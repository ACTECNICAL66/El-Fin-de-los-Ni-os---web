import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, Droplets, Shield } from 'lucide-react'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isHome = location.pathname === '/'

  const navLinks = [
    { label: 'Proyecto', href: '/', active: isHome },
    { label: 'Paradigmas', href: '/paradigmas', active: location.pathname === '/paradigmas' },
    ...(isAdmin ? [{ label: 'Admin', href: '/admin', active: location.pathname === '/admin', icon: Shield }] : []),
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Droplets className={`w-7 h-7 transition-colors ${scrolled ? 'text-[#0B3D91]' : 'text-white'}`} />
          <span className={`font-montserrat font-bold text-xl transition-colors ${scrolled ? 'text-[#0B3D91]' : 'text-white'}`}>
            Panel Hidrico
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-2 text-sm font-medium transition-all border-b-4 ${
                link.active
                  ? scrolled
                    ? 'border-[#0B3D91] text-[#0B3D91] font-bold'
                    : 'border-white text-white font-bold'
                  : scrolled
                  ? 'border-transparent text-slate-600 hover:text-[#0B3D91]'
                  : 'border-transparent text-white/80 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {'icon' in link && link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${scrolled ? 'text-slate-700' : 'text-white'}`}>
                {user.name}
              </span>
              {user.avatar ? (
                <img src={user.avatar ?? undefined} alt={user.name ?? ''} className="w-8 h-8 rounded-full border-2 border-white/30" />
              ) : null}
            </div>
          ) : (
            <Link
              to="/login"
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                scrolled
                  ? 'bg-[#0B3D91] text-white hover:bg-[#FC3D21]'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Iniciar Sesion
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className={`w-6 h-6 ${scrolled ? 'text-slate-800' : 'text-white'}`} />
          ) : (
            <Menu className={`w-6 h-6 ${scrolled ? 'text-slate-800' : 'text-white'}`} />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="px-6 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  link.active
                    ? 'bg-[#0B3D91]/10 text-[#0B3D91]'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-200">
              {user ? (
                <span className="block px-4 py-3 text-sm text-slate-700">{user.name}</span>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-[#0B3D91]"
                >
                  Iniciar Sesion
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
