import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { getUser, requireLogin } from '../utils/auth';
import SEO from '../components/SEO';


interface DashboardLayoutProps {
  title?: string;
  activeMenu?: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title = 'Dashboard',
  activeMenu = 'dashboard',
  children
}) => {
  const [appName, setAppName] = useState('Ruangtunggu');
  const [appLogo, setAppLogo] = useState('');
  const [user] = useState<any>(() => getUser());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Guard page: check login immediately
  useEffect(() => {
    requireLogin();

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



  // Handle outside click for profile dropdown
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

  const getNavItemClass = (menuName: string) => {
    const base = 'flex items-center gap-3 px-4 py-3 mx-3 my-1 text-sm font-bold text-black hover:text-black border-2 border-transparent transition-all duration-100 rounded-sm no-underline';
    if (activeMenu === menuName) {
      return `${base} bg-[var(--accent-primary)] border-black shadow-[2px_2px_0px_#000000]`;
    }
    return `${base} hover:bg-[var(--bg-tertiary)] hover:border-black hover:shadow-[2px_2px_0px_#000000]`;
  };

  return (
    <>
      <SEO title={`${title} — ${appName}`} />
      <div className="flex min-h-screen text-black" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          className={`fixed md:sticky top-0 bottom-0 left-0 w-60 h-screen bg-white border-r-3 border-black flex flex-col z-40 transition-transform duration-200 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 overflow-y-auto`}
        >
          {/* Logo */}
          <a href="/dashboard" className="flex items-center gap-2 px-6 py-6 border-b-2 border-black no-underline text-black">
            {resolvedLogoUrl ? (
              <img src={resolvedLogoUrl} alt={appName} style={{ maxHeight: '32px', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <>
                <div className="w-6 h-6 bg-black text-white border-2 border-black flex items-center justify-center font-black rounded-sm shadow-[1px_1px_0px_#fff]">
                  R
                </div>
                <span className="font-extrabold text-lg">
                  {appName.toLowerCase() === 'ruangtunggu' ? (
                    <>
                      <span style={{ color: 'var(--accent-primary)' }}>ruang</span>
                      tunggu
                    </>
                  ) : (
                    appName
                  )}
                </span>
              </>
            )}
          </a>

          {/* Navigation */}
          <nav className="flex-grow py-4">
            {/* Main Menu Group */}
            <div className="py-2">
              <div className="px-6 mb-2 text-xs font-black uppercase tracking-wider text-zinc-500">Menu</div>
              <a href="/dashboard" className={getNavItemClass('dashboard')}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                Dashboard
              </a>
              <a href="/dashboard/domains" className={getNavItemClass('domains')}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
                </svg>
                Domains
              </a>
              <a href="/dashboard/whois" className={getNavItemClass('whois')}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Whois
              </a>
              <a href="/dashboard/prices" className={getNavItemClass('prices')}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                Harga
              </a>
            </div>

            {/* Account Group */}
            <div className="py-2">
              <div className="px-6 mb-2 text-xs font-black uppercase tracking-wider text-zinc-500">Account</div>
              <a href="/dashboard/billing" className={getNavItemClass('billing')}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                Billing
              </a>
              <a href="/profile" className={getNavItemClass('profile')}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profil
              </a>
            </div>

            {/* Administrator Link (only visible if user.is_admin is true) */}
            {user && user.is_admin && (
              <div className="py-2">
                <div className="px-6 mb-2 text-xs font-black uppercase tracking-wider text-red-600">Administrator</div>
                <a
                  href="/admin/billing"
                  className="flex items-center gap-3 px-4 py-3 mx-3 my-1 text-sm font-extrabold text-red-600 bg-red-50 border-2 border-red-600 shadow-[2px_2px_0px_#e11d48] rounded-sm no-underline hover:bg-red-100"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="red" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Panel Admin
                </a>
              </div>
            )}
          </nav>
        </aside>

        {/* ── MAIN WRAPPER ── */}
        <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
          {/* Topbar */}
          <div className="sticky top-0 bg-white border-b-3 border-black h-16 flex items-center justify-between px-6 z-30 shadow-sm">
            {/* Sidebar Mobile Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden flex items-center justify-center p-1 border-2 border-black bg-white hover:bg-zinc-100 text-black rounded-sm shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>

            {/* User profile dropdown container */}
            <div className="relative ml-auto my-2" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 px-2 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_#000000] transition-all bg-white rounded-sm"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-black leading-none">{user ? (user.name || user.email) : 'User'}</div>
                </div>
                <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)] border border-black flex items-center justify-center text-xs font-black text-black">
                  {getInitials(user ? user.name : '', user ? user.email : '')}
                </div>
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0_0_#000] z-50 text-left flex flex-col gap-1"
                  style={{ padding: '8px' }}
                >
                  <div className="dropdown-menu-header flex items-center gap-3 py-2 mb-1 bg-zinc-100 border-2 border-black rounded-md shadow-[2px_2px_0_0_#000]">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] border border-black flex items-center justify-center text-xs font-black text-black flex-shrink-0">
                      {getInitials(user ? user.name : '', user ? user.email : '')}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-black truncate">{user ? (user.name || user.email) : '—'}</div>
                      {user && user.name && <div className="text-xs text-zinc-600 truncate mt-0.5">{user.email}</div>}
                    </div>
                  </div>
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
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Page Content */}
          <div className="flex-grow p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default DashboardLayout;
