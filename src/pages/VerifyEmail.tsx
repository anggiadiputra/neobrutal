import React, { useState, useEffect } from 'react';
import Layout from '../layouts/Layout';
import { apiFetch } from '../utils/api';

export const VerifyEmail: React.FC = () => {
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setErrorMessage('Token verifikasi tidak ditemukan pada tautan Anda.');
        setState('error');
        return;
      }

      try {
        await apiFetch('/api/auth/verify-email', {
          method: 'POST',
          requireAuth: false,
          body: JSON.stringify({ token })
        });
        setState('success');
      } catch (err: any) {
        console.error('Email verification failed:', err);
        setErrorMessage(
          err.message || 'Verifikasi gagal. Tautan Anda kemungkinan besar kedaluwarsa atau sudah terpakai.'
        );
        setState('error');
      }
    };

    verifyToken();
  }, []);

  return (
    <Layout title="Verifikasi Alamat Email">
      <section className="flex items-center justify-center py-20 min-h-[70vh]">
        <div className="container max-w-lg px-4 text-center">
          <div className="card p-10 bg-white border-3 border-black shadow-[6px_6px_0_#000] rounded-sm">
            {/* 1. LOADING STATE */}
            {state === 'loading' && (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-black mb-6" />
                <h2 className="text-xl font-black">Memverifikasi Akun Anda...</h2>
                <p className="text-xs text-zinc-500 font-bold mt-2 leading-relaxed">
                  Harap tunggu sebentar, kami sedang menyelaraskan akun Anda dengan sistem pencatatan domain.
                </p>
              </div>
            )}

            {/* 2. SUCCESS STATE */}
            {state === 'success' && (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-emerald-200 border-2 border-black flex items-center justify-center font-black text-emerald-800 rounded-full mb-6 shadow-[2px_2px_0_#000]">
                  ✓
                </div>
                <h2 className="text-xl font-black">Verifikasi Email Berhasil!</h2>
                <p className="text-xs text-zinc-500 font-bold mt-2 leading-relaxed">
                  Akun Anda telah diaktifkan sepenuhnya dan telah berhasil disinkronisasikan ke sistem registrar domain.
                </p>
                <a href="/login" className="btn btn-primary w-full mt-6" style={{ textDecoration: 'none' }}>
                  Masuk ke Portal
                </a>
              </div>
            )}

            {/* 3. ERROR STATE */}
            {state === 'error' && (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-red-200 border-2 border-black flex items-center justify-center font-black text-red-800 rounded-full mb-6 shadow-[2px_2px_0_#000]">
                  ✗
                </div>
                <h2 className="text-xl font-black">Verifikasi Email Gagal</h2>
                <p className="text-xs text-zinc-500 font-bold mt-2 leading-relaxed">
                  {errorMessage || 'Tautan verifikasi salah, kedaluwarsa, atau sudah pernah digunakan.'}
                </p>
                <div className="flex gap-3 justify-center w-full mt-6">
                  <a href="/register" className="btn btn-primary flex-grow" style={{ textDecoration: 'none' }}>
                    Daftar Kembali
                  </a>
                  <a href="/login" className="btn btn-secondary flex-grow" style={{ textDecoration: 'none' }}>
                    Masuk
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default VerifyEmail;
