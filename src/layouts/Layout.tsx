import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';

import { getUser, isAuthenticated } from '../utils/auth';
import SEO from '../components/SEO';

interface LayoutProps {
  title: string;
  description?: string;
  transparentNav?: boolean;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  title,
  description = 'Portal Mandiri Customer Domain Portal',
  transparentNav = false,
  children
}) => {
  const [appName, setAppName] = useState('Ruangtunggu');
  const [appLogo, setAppLogo] = useState('');
  const [isLoggedIn] = useState<boolean>(() => isAuthenticated());
  const [user] = useState<any>(() => getUser());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiFetch('/api/settings', { requireAuth: false });
        if (response && response.success && response.data) {
          setAppName(response.data.app_name || 'Ruangtunggu');
          setAppLogo(response.data.app_logo || '');
        }
      } catch (e) {
        console.warn('Failed to fetch settings, using defaults.', e);
      }
    };
    fetchSettings();
  }, []);

  // Transparent navbar scrolling handler
  useEffect(() => {
    if (!transparentNav) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [transparentNav]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const resolvedLogoUrl = appLogo ? `http://localhost:3000${appLogo}` : '';

  const getInitials = (name: string, email: string = '') => {
    const source = name || email || 'User';
    const cleanName = source.includes('@') ? source.split('@')[0] : source;
    const parts = cleanName.trim().split(/[\s._-]+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
  };

  return (
    <>
      <SEO title={`${title} | ${appName}`} description={description} />
      <div className="flex flex-col min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* ── HEADER ── */}
        <header
          className={`main-header ${transparentNav ? 'fixed top-0 left-0 right-0' : 'sticky top-0'} z-50 transition-all duration-200`}
          style={{
            backgroundColor: transparentNav && !isScrolled ? 'transparent' : 'var(--bg-secondary)',
            borderBottom: transparentNav && !isScrolled ? '3px solid transparent' : '3px solid var(--border-color)',
            boxShadow: transparentNav && !isScrolled ? 'none' : 'var(--shadow-sm)',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem'
          }}
        >
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="logo text-2xl font-black tracking-tighter"
            style={{
              color: transparentNav && !isScrolled ? '#ffffff' : 'var(--text-primary)',
              textDecoration: 'none'
            }}
          >
            {resolvedLogoUrl ? (
              <img src={resolvedLogoUrl} alt={appName} style={{ maxHeight: '36px', width: 'auto', objectFit: 'contain' }} />
            ) : appName.toLowerCase() === 'ruangtunggu' ? (
              <>
                <span style={{ color: 'var(--accent-primary)' }}>ruang</span>
                tunggu
              </>
            ) : (
              appName
            )}
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 border-2 border-black bg-white text-black shadow-sm"
            aria-label="Toggle menu"
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h18" />
              </svg>
            )}
          </button>

          {/* Navigation Links */}
          <nav
            className={`${
              isMobileMenuOpen ? 'flex' : 'hidden'
            } md:flex flex-col md:flex-row absolute md:relative top-full left-0 w-full md:w-auto bg-white md:bg-transparent border-b-4 border-black md:border-none p-4 md:p-0 items-center gap-6 z-40`}
          >
            <a
              href="/"
              className="flex items-center gap-2 text-sm font-bold"
              style={{
                color: transparentNav && !isScrolled ? '#ffffff' : 'var(--text-primary)',
                textDecoration: 'none'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
              </svg>
              Cari Domain
            </a>
            <a
              href="/whois"
              className="flex items-center gap-2 text-sm font-bold"
              style={{
                color: transparentNav && !isScrolled ? '#ffffff' : 'var(--text-primary)',
                textDecoration: 'none'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Whois
            </a>
            <a
              href="/prices"
              className="flex items-center gap-2 text-sm font-bold"
              style={{
                color: transparentNav && !isScrolled ? '#ffffff' : 'var(--text-primary)',
                textDecoration: 'none'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              Harga
            </a>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 border-2 border-black flex items-center justify-center overflow-hidden transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_#000]"
                style={{
                  borderRadius: '50%',
                  backgroundColor: transparentNav && !isScrolled ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)'
                }}
              >
                {isLoggedIn && user ? (
                  <span className="font-black text-sm text-black">
                    {getInitials(user.name, user.email)}
                  </span>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke={transparentNav && !isScrolled ? '#ffffff' : 'currentColor'}
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0_0_#000] z-50 text-left flex flex-col gap-1"
                  style={{ padding: '8px' }}
                >
                  {isLoggedIn && user ? (
                    <>
                      <div className="dropdown-menu-header flex items-center gap-3 py-2 mb-1 bg-zinc-100 border-2 border-black rounded-md shadow-[2px_2px_0_0_#000]">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] border border-black flex items-center justify-center text-xs font-black text-black flex-shrink-0">
                          {getInitials(user.name, user.email)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-black truncate">{user.name || user.email}</div>
                          {user.name && <div className="text-xs text-zinc-600 truncate mt-0.5">{user.email}</div>}
                        </div>
                      </div>
                      <a
                        href="/dashboard"
                        className="dropdown-menu-item flex items-center gap-3 py-2.5 rounded-md transition-colors duration-100 group text-sm font-bold"
                      >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border-2 border-black bg-blue-100 text-blue-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <rect width="7" height="9" x="3" y="3" rx="1" />
                            <rect width="7" height="5" x="14" y="3" rx="1" />
                            <rect width="7" height="9" x="14" y="12" rx="1" />
                            <rect width="7" height="5" x="3" y="16" rx="1" />
                          </svg>
                        </span>
                        Dashboard
                      </a>
                      <a
                        href="/profile"
                        className="dropdown-menu-item flex items-center gap-3 py-2.5 rounded-md transition-colors duration-100 group text-sm font-bold"
                      >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border-2 border-black bg-purple-100 text-purple-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        Profil Saya
                      </a>
                      <hr className="my-1 border-t-2 border-dashed border-black" />
                      <button
                        onClick={handleLogout}
                        className="dropdown-menu-item w-full flex items-center gap-3 py-2.5 rounded-md transition-colors duration-100 group text-left cursor-pointer text-sm font-bold"
                      >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border-2 border-black bg-red-100 text-red-700 group-hover:bg-red-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        </span>
                        Keluar
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="dropdown-menu-header py-2 mb-1 bg-zinc-100 border-2 border-black rounded-md shadow-[2px_2px_0_0_#000]">
                        <div className="font-bold text-sm text-black">Selamat Datang</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Silakan masuk atau daftar</div>
                      </div>
                      <a
                        href="/login"
                        className="dropdown-menu-item flex items-center gap-3 py-2.5 rounded-md transition-colors duration-100 group text-sm font-bold"
                      >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border-2 border-black bg-blue-100 text-blue-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                          </svg>
                        </span>
                        Masuk
                      </a>
                      <a
                        href="/register"
                        className="dropdown-menu-item flex items-center gap-3 py-2.5 rounded-md transition-colors duration-100 group text-sm font-bold"
                      >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border-2 border-black bg-purple-100 text-purple-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="8" x2="19" y2="14" />
                            <line x1="22" y1="11" x2="16" y2="11" />
                          </svg>
                        </span>
                        Daftar Akun
                      </a>
                    </>
                  )}

                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-grow">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="main-footer" style={{ borderTop: '3px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '3rem 0 1.5rem 0' }}>
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 px-6 sm:px-8">
          <div className="md:col-span-2">
            <a href="/" className="logo text-2xl font-black tracking-tighter" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
              {resolvedLogoUrl ? (
                <img src={resolvedLogoUrl} alt={appName} style={{ maxHeight: '36px', width: 'auto', objectFit: 'contain' }} />
              ) : appName.toLowerCase() === 'ruangtunggu' ? (
                <>
                  <span style={{ color: 'var(--accent-primary)' }}>ruang</span>
                  tunggu
                </>
              ) : (
                appName
              )}
            </a>
            <p className="text-xs sm:text-sm font-semibold mt-2 text-zinc-500" style={{ maxWidth: '320px' }}>
              Portal mandiri pengelolaan & registrasi domain handal.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Navigasi</h4>
              <a href="/" className="text-sm font-bold text-zinc-500 hover:text-black" style={{ textDecoration: 'none' }}>Cari Domain</a>
              <a href="/whois" className="text-sm font-bold text-zinc-500 hover:text-black" style={{ textDecoration: 'none' }}>Cek WHOIS</a>
              <a href="/prices" className="text-sm font-bold text-zinc-500 hover:text-black" style={{ textDecoration: 'none' }}>Daftar Harga</a>
              <a href="/login" className="text-sm font-bold text-zinc-500 hover:text-black" style={{ textDecoration: 'none' }}>Masuk</a>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Informasi & Legal</h4>
              <a href="/about" className="text-sm font-bold text-zinc-500 hover:text-black" style={{ textDecoration: 'none' }}>Tentang Kami</a>
              <a href="/contact" className="text-sm font-bold text-zinc-500 hover:text-black" style={{ textDecoration: 'none' }}>Kontak</a>
              <a href="/privacy-policy" className="text-sm font-bold text-zinc-500 hover:text-black" style={{ textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/disclaimer" className="text-sm font-bold text-zinc-500 hover:text-black" style={{ textDecoration: 'none' }}>Disklaimer</a>
              <a href="/terms" className="text-sm font-bold text-zinc-500 hover:text-black" style={{ textDecoration: 'none' }}>TOS</a>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-black pt-4 mt-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="container flex flex-col md:flex-row justify-between items-center text-[10px] sm:text-xs font-bold text-zinc-500 px-6 sm:px-8">
            <p>&copy; {new Date().getFullYear()} {appName}. Hak Cipta Dilindungi Undang-Undang.</p>
            <p className="mt-2 md:mt-0">Powered by React + Tailwind v4</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};
export default Layout;
