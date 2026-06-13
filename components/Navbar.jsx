'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAuthenticated = status === 'authenticated'

  return (
    <header className="bg-black text-white border-b-2 border-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="font-mono text-2xl font-bold tracking-tighter hover:text-red-600 transition-colors"
          >
            PATA
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 font-mono text-sm">
            <NavLink href="/tools">Tools</NavLink>
            <NavLink href="/blog">Blog</NavLink>
            {isAuthenticated ? (
              <>
                <NavLink href="/account">Account</NavLink>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 ml-2 bg-red-600 text-white border-2 border-red-600 hover:bg-white hover:text-black transition-colors uppercase text-xs"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink href="/login">Sign in</NavLink>
                <Link
                  href="/signup"
                  className="px-4 py-2 ml-2 bg-white text-black border-2 border-white hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors uppercase text-xs"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden font-mono text-sm border-2 border-white px-3 py-2 hover:bg-white hover:text-black transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t-2 border-white bg-black">
          <nav className="flex flex-col font-mono text-sm">
            <MobileNavLink href="/tools" onClick={() => setMenuOpen(false)}>
              Tools
            </MobileNavLink>
            <MobileNavLink href="/blog" onClick={() => setMenuOpen(false)}>
              Blog
            </MobileNavLink>
            {isAuthenticated ? (
              <>
                <MobileNavLink href="/account" onClick={() => setMenuOpen(false)}>
                  Account
                </MobileNavLink>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="text-left px-6 py-4 border-b border-gray-800 hover:bg-red-600 hover:text-white transition-colors uppercase"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <MobileNavLink href="/login" onClick={() => setMenuOpen(false)}>
                  Sign in
                </MobileNavLink>
                <MobileNavLink href="/signup" onClick={() => setMenuOpen(false)}>
                  Sign up
                </MobileNavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 hover:bg-white hover:text-black transition-colors uppercase text-xs"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, onClick, children }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-6 py-4 border-b border-gray-800 hover:bg-white hover:text-black transition-colors uppercase"
    >
      {children}
    </Link>
  )
}
