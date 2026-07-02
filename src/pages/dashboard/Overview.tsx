import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getUser } from '../../utils/auth';

export const Overview: React.FC = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = getUser();
    if (user) {
      const displayName = user.name || user.email || 'Guest';
      setUserName(user.name ? user.name.split(' ')[0] : displayName.split('@')[0]);
    }
  }, []);

  const actions = [
    {
      title: 'Domains Saya',
      desc: 'Lihat dan kelola semua domain terdaftar',
      href: '/dashboard/domains',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
        </svg>
      ),
      bg: 'bg-cyan-200'
    },
    {
      title: 'Daftar Domain Baru',
      desc: 'Temukan dan daftarkan nama domain impian Anda',
      href: '/dashboard/domains?new=1',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      bg: 'bg-lime-200'
    },
    {
      title: 'Cek WHOIS Domain',
      desc: 'Temukan informasi kepemilikan domain secara instan',
      href: '/dashboard/whois',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      bg: 'bg-yellow-200'
    },
    {
      title: 'Daftar Harga',
      desc: 'Cek harga registrasi, perpanjangan, dan transfer domain',
      href: '/dashboard/prices',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
      bg: 'bg-orange-200'
    },
    {
      title: 'Transfer Domain',
      desc: 'Pindahkan domain Anda ke Ruangtunggu',
      href: '/dashboard/domains/transfer',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5">
          <path d="m16 3 4 4-4 4" />
          <path d="M20 7H9a4 4 0 0 0-4 4v9" />
          <path d="m8 21-4-4 4-4" />
          <path d="M4 17h11a4 4 0 0 0 4-4V4" />
        </svg>
      ),
      bg: 'bg-rose-200'
    },
    {
      title: 'Profil Saya',
      desc: 'Perbarui informasi akun dan data pribadi Anda',
      href: '/profile',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      bg: 'bg-zinc-200'
    }
  ];

  return (
    <DashboardLayout title="Dashboard" activeMenu="dashboard">
      <div className="text-left">
        {/* Welcome Header */}
        <div className="border-b-3 border-black pb-4 mb-8">
          <h1 className="text-3xl font-black">
            Selamat Datang, <span className="text-rose-600">{userName || '—'}</span>! 👋
          </h1>
          <p className="text-xs sm:text-sm font-bold text-zinc-500 mt-2">
            Kelola domain dan layanan Anda dari satu tempat.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((act) => (
            <Link
              key={act.title}
              to={act.href}
              className="card flex items-center gap-4 bg-white border-3 border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] p-4! no-underline text-black transition-all rounded-sm group"
            >
              <div
                className={`w-10 h-10 border-2 border-black flex items-center justify-center rounded-sm shadow-[1px_1px_0_#000] flex-shrink-0 ${act.bg}`}
              >
                {act.icon}
              </div>
              <div className="flex-grow min-w-0">
                <div className="font-extrabold text-sm leading-tight text-black group-hover:text-rose-600 transition-colors">
                  {act.title}
                </div>
                <div className="text-[11px] text-zinc-500 font-bold leading-normal mt-1 truncate">
                  {act.desc}
                </div>
              </div>
              <div className="flex-shrink-0 text-zinc-400 group-hover:text-black transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default Overview;
