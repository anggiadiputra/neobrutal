import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { fetchProvinces, fetchRegencies, fetchDistricts, fetchVillages, type RegionItem } from '../../utils/region';

interface UserProfile {
  name: string;
  email: string;
  organization: string;
  voice: string;
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
}

const defaultProfile: UserProfile = {
  name: '', email: '', organization: '', voice: '',
  street_1: '', street_2: '', city: '', state: '',
  postal_code: '', country_code: ''
};

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export default function Profile() {
  // Profile form state
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [originalProfile, setOriginalProfile] = useState<UserProfile>(defaultProfile);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Region dropdowns state
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedRegencyId, setSelectedRegencyId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [parsedStreet2, setParsedStreet2] = useState('');

  // Alert state
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load profile and provinces on mount
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await apiFetch('/api/auth/profile');
      if (response.success && response.user) {
        const u = response.user;
        
        // Parse street_2 to extract district/village
        let dbStreet2 = u.street_2 || '';
        let district = '';
        let village = '';
        const regionRegex = /(?:,\s*)?Kec\.\s+([^,]+),\s*Kel\.\s+([^,]+)$/i;
        const match = dbStreet2.match(regionRegex);
        if (match) {
          district = match[1].trim();
          village = match[2].trim();
          dbStreet2 = dbStreet2.replace(regionRegex, '').trim();
        }
        setParsedStreet2(dbStreet2);

        const profileData: UserProfile = {
          name: u.name || '', email: u.email || '',
          organization: u.organization || '', voice: u.voice || '',
          street_1: u.street_1 || '', street_2: dbStreet2,
          city: u.city || '', state: u.state || '',
          postal_code: u.postal_code || '', country_code: u.country_code || ''
        };

        setProfile(profileData);
        setOriginalProfile({
          ...profileData,
          street_2: u.street_2 || ''
        });

        // Load provinces and cascade
        const provList = await fetchProvinces();
        setProvinces(provList);

        let matchedProvinceId = '';
        for (const p of provList) {
          if (p.name.toLowerCase() === (u.state || '').toLowerCase()) {
            matchedProvinceId = p.id;
            setSelectedProvinceId(p.id);
            break;
          }
        }

        if (matchedProvinceId) {
          const regList = await fetchRegencies(matchedProvinceId);
          setRegencies(regList);

          let matchedRegencyId = '';
          for (const r of regList) {
            if (r.name.toLowerCase() === (u.city || '').toLowerCase()) {
              matchedRegencyId = r.id;
              setSelectedRegencyId(r.id);
              break;
            }
          }

          if (matchedRegencyId && district) {
            const distList = await fetchDistricts(matchedRegencyId);
            setDistricts(distList);

            let matchedDistrictId = '';
            for (const d of distList) {
              if (d.name.toLowerCase() === district.toLowerCase()) {
                matchedDistrictId = d.id;
                setSelectedDistrictId(d.id);
                break;
              }
            }

            if (matchedDistrictId && village) {
              const villList = await fetchVillages(matchedDistrictId);
              setVillages(villList);

              for (const v of villList) {
                if (v.name.toLowerCase() === village.toLowerCase()) {
                  setSelectedVillageId(v.id);
                  break;
                }
              }
            }
          }
        }

        // Sync localStorage
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const parsed = JSON.parse(localUser);
          parsed.name = u.name;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setAlert({ message: apiErr.message || 'Gagal memuat profil.', type: 'error' });
    }
  }

  // Region cascade handlers
  const handleProvinceChange = async (id: string) => {
    setSelectedProvinceId(id);
    setSelectedRegencyId('');
    setSelectedDistrictId('');
    setSelectedVillageId('');
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    if (id) {
      const list = await fetchRegencies(id);
      setRegencies(list);
    }
  };

  const handleRegencyChange = async (id: string) => {
    setSelectedRegencyId(id);
    setSelectedDistrictId('');
    setSelectedVillageId('');
    setDistricts([]);
    setVillages([]);
    if (id) {
      const list = await fetchDistricts(id);
      setDistricts(list);
    }
  };

  const handleDistrictChange = async (id: string) => {
    setSelectedDistrictId(id);
    setSelectedVillageId('');
    setVillages([]);
    if (id) {
      const list = await fetchVillages(id);
      setVillages(list);
    }
  };

  // Profile form submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setAlert(null);

    const stateText = provinces.find(p => p.id === selectedProvinceId)?.name || '';
    const cityText = regencies.find(r => r.id === selectedRegencyId)?.name || '';
    const districtText = districts.find(d => d.id === selectedDistrictId)?.name || '';
    const villageText = villages.find(v => v.id === selectedVillageId)?.name || '';

    let street_2: string | null = profile.street_2.trim() || null;
    if (districtText && villageText) {
      const regionAddress = `Kec. ${districtText}, Kel. ${villageText}`;
      street_2 = profile.street_2.trim() ? `${profile.street_2.trim()}, ${regionAddress}` : regionAddress;
    }

    const payload = {
      name: profile.name.trim(),
      organization: profile.organization.trim(),
      voice: profile.voice.trim(),
      street_1: profile.street_1.trim(),
      street_2,
      city: cityText,
      state: stateText,
      postal_code: profile.postal_code.trim(),
      country_code: profile.country_code.trim().toUpperCase(),
    };

    try {
      const response = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setAlert({ message: response.message || 'Profil berhasil diperbarui.', type: 'success' });
      setOriginalProfile({
        ...payload,
        email: profile.email,
        street_2: payload.street_2 || ''
      });
      setIsProfileEditing(false);

      // Update localStorage
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        parsed.name = payload.name;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setAlert({ message: apiErr.message || 'Gagal memperbarui profil.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setProfile({
      ...originalProfile,
      street_2: parsedStreet2
    });
    setIsProfileEditing(false);
    setAlert(null);
  };

  // Password form submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setAlert({ message: 'Konfirmasi kata sandi baru tidak cocok.', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    setAlert(null);

    try {
      const response = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      setAlert({ message: response.message || 'Kata sandi berhasil diubah.', type: 'success' });
      setIsPasswordEditing(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setAlert({ message: apiErr.message || 'Gagal mengubah kata sandi.', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setIsPasswordEditing(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAlert(null);
  };

  return (
    <DashboardLayout title="Profil & Keamanan" activeMenu="profile">
      <div className="text-left w-full">
        {/* Header */}
        <div className="border-b-3 border-black pb-4 mb-6">
        <h1 className="text-2xl font-black tracking-tight">Profil & Keamanan</h1>
        <p className="text-sm font-semibold text-zinc-500 mt-1">
          Kelola informasi pribadi dan pengaturan keamanan akun Anda
        </p>
      </div>

      {/* Alert */}
      {alert && (
        <div
          className={`mb-6 p-4 border-3 border-black font-bold text-sm ${
            alert.type === 'success'
              ? 'bg-green-100 text-green-800 shadow-[3px_3px_0px_#166534]'
              : 'bg-red-100 text-red-800 shadow-[3px_3px_0px_#991b1b]'
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">

        {/* LEFT: Profile Form */}
        <div className="bg-white border-3 border-black p-6 shadow-[4px_4px_0px_#000]">
          <h3 className="text-base font-black mb-1">Informasi Profil & Kontak</h3>
          <p className="text-xs font-semibold text-zinc-500 mb-5">
            Informasi di bawah ini digunakan untuk pendaftaran dan kepemilikan domain Anda.
          </p>

          <form onSubmit={handleProfileSubmit}>
            {/* Row 1: Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-name">Nama Lengkap *</label>
                <input
                  id="profile-name"
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isProfileEditing}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-email">Alamat Email (Akun)</label>
                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-zinc-100 text-zinc-500 cursor-not-allowed shadow-[2px_2px_0_0_#000] translate-x-[2px] translate-y-[2px]"
                />
              </div>
            </div>

            {/* Row 2: Org & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-org">Organisasi / Perusahaan *</label>
                <input
                  id="profile-org"
                  type="text"
                  value={profile.organization}
                  onChange={e => setProfile({ ...profile, organization: e.target.value })}
                  disabled={!isProfileEditing}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-voice">Nomor Telepon *</label>
                <input
                  id="profile-voice"
                  type="tel"
                  value={profile.voice}
                  onChange={e => setProfile({ ...profile, voice: e.target.value })}
                  disabled={!isProfileEditing}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all"
                />
              </div>
            </div>

            {/* Address Line 1 */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-street1">Alamat Lengkap (Baris 1) *</label>
              <input
                id="profile-street1"
                type="text"
                value={profile.street_1}
                onChange={e => setProfile({ ...profile, street_1: e.target.value })}
                disabled={!isProfileEditing}
                required
                className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all"
              />
            </div>

            {/* Address Line 2 */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-street2">Alamat Lengkap (Baris 2 - Opsional)</label>
              <input
                id="profile-street2"
                type="text"
                value={profile.street_2}
                onChange={e => setProfile({ ...profile, street_2: e.target.value })}
                disabled={!isProfileEditing}
                className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all"
              />
            </div>

            {/* Province & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-state">Provinsi *</label>
                <select
                  id="profile-state"
                  value={selectedProvinceId}
                  onChange={e => handleProvinceChange(e.target.value)}
                  disabled={!isProfileEditing}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all cursor-pointer appearance-none"
                  style={{ backgroundImage: 'var(--select-arrow-bg)', backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', paddingRight: '40px' }}
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-city">Kabupaten / Kota *</label>
                <select
                  id="profile-city"
                  value={selectedRegencyId}
                  onChange={e => handleRegencyChange(e.target.value)}
                  disabled={!isProfileEditing}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all cursor-pointer appearance-none"
                  style={{ backgroundImage: 'var(--select-arrow-bg)', backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', paddingRight: '40px' }}
                >
                  <option value="">Pilih Kabupaten/Kota</option>
                  {regencies.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* District & Village */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-district">Kecamatan *</label>
                <select
                  id="profile-district"
                  value={selectedDistrictId}
                  onChange={e => handleDistrictChange(e.target.value)}
                  disabled={!isProfileEditing}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all cursor-pointer appearance-none"
                  style={{ backgroundImage: 'var(--select-arrow-bg)', backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', paddingRight: '40px' }}
                >
                  <option value="">Pilih Kecamatan</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-village">Kelurahan *</label>
                <select
                  id="profile-village"
                  value={selectedVillageId}
                  onChange={e => setSelectedVillageId(e.target.value)}
                  disabled={!isProfileEditing}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all cursor-pointer appearance-none"
                  style={{ backgroundImage: 'var(--select-arrow-bg)', backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', paddingRight: '40px' }}
                >
                  <option value="">Pilih Kelurahan</option>
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Postal Code & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-postal">Kode Pos *</label>
                <input
                  id="profile-postal"
                  type="text"
                  value={profile.postal_code}
                  onChange={e => setProfile({ ...profile, postal_code: e.target.value })}
                  disabled={!isProfileEditing}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="profile-country">Kode Negara (2 Karakter) *</label>
                <input
                  id="profile-country"
                  type="text"
                  value={profile.country_code}
                  onChange={e => setProfile({ ...profile, country_code: e.target.value })}
                  disabled={!isProfileEditing}
                  required
                  maxLength={2}
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all uppercase"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              {!isProfileEditing ? (
                <button
                  type="button"
                  onClick={() => { setIsProfileEditing(true); setAlert(null); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-white text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  Edit Profil
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-[var(--accent-primary)] text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileCancel}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-zinc-200 text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT: Password Form */}
        <div className="bg-white border-3 border-black p-6 shadow-[4px_4px_0px_#000] self-start">
          <h3 className="text-base font-black mb-1">Ubah Kata Sandi</h3>
          <p className="text-xs font-semibold text-zinc-500 mb-5">
            Demi keamanan akun, pastikan Anda menggunakan kata sandi yang kuat dan unik.
          </p>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="old-password">Kata Sandi Saat Ini *</label>
              <div className="relative">
                <input
                  id="old-password"
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  disabled={!isPasswordEditing}
                  required
                  className="w-full border-3 border-black px-4 py-3 pr-10 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-zinc-400 hover:text-black p-1"
                  tabIndex={-1}
                >
                  {showOld ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="new-password">Kata Sandi Baru *</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={!isPasswordEditing}
                  required
                  minLength={6}
                  className="w-full border-3 border-black px-4 py-3 pr-10 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-zinc-400 hover:text-black p-1"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="confirm-password">Konfirmasi Kata Sandi Baru *</label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={!isPasswordEditing}
                  required
                  minLength={6}
                  className="w-full border-3 border-black px-4 py-3 pr-10 text-sm font-bold bg-white disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] disabled:shadow-[2px_2px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] disabled:translate-x-[2px] disabled:translate-y-[2px] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-zinc-400 hover:text-black p-1"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              {!isPasswordEditing ? (
                <button
                  type="button"
                  onClick={() => { setIsPasswordEditing(true); setAlert(null); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-white text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Ubah Kata Sandi
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-[var(--accent-primary)] text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    {passwordLoading ? 'Memproses...' : 'Simpan Kata Sandi'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePasswordCancel}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-3 border-black bg-zinc-200 text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
