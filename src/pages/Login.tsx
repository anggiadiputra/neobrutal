import React, { useState, useEffect, useRef } from 'react';
import Layout from '../layouts/Layout';
import { apiFetch } from '../utils/api';
import { requireGuest } from '../utils/auth';
import Turnstile from '../components/ui/Turnstile';

export const Login: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState(import.meta.env.DEV ? 'local-dev-bypass' : '');

  const resendIntervalRef = useRef<number | null>(null);

  // Guard page: guests only
  useEffect(() => {
    requireGuest();

    // Check for session expired query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      setAlert({
        message: 'Sesi Anda telah kedalwuarsa atau tidak valid. Silakan masuk kembali.',
        type: 'warning'
      });
    }

    return () => {
      if (resendIntervalRef.current) {
        window.clearInterval(resendIntervalRef.current);
      }
    };
  }, []);

  // Cooldown countdown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) {
      if (resendIntervalRef.current) {
        window.clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
      return;
    }

    if (!resendIntervalRef.current) {
      resendIntervalRef.current = window.setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
  }, [resendCooldown]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.replace(/\s+/g, '');

    setIsLoading(true);
    setAlert(null);

    try {
      const response = await apiFetch('/api/auth/login-step1', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({ email: cleanEmail, password, turnstileToken })
      });

      setStep(2);
      setAlert({
        message: response.message || 'Kode OTP telah dikirimkan ke email Anda.',
        type: 'success'
      });
      setResendCooldown(60);
    } catch (err: unknown) {
      console.error('Login step 1 failed:', err);
      const apiErr = err as { message?: string };
      setAlert({
        message: apiErr.message || 'Email atau kata sandi salah. Silakan coba lagi.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();

    if (cleanOtp.length !== 6) {
      setAlert({ message: 'Kode OTP harus berupa 6 digit angka.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      const response = await apiFetch('/api/auth/login-step2', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({ email: email.replace(/\s+/g, ''), otp_code: cleanOtp })
      });

      // Save token & user
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setAlert({
        message: 'Autentikasi Berhasil! Mengarahkan Anda ke dashboard...',
        type: 'success'
      });

      // Redirect after a brief moment
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const nextRoute = params.get('next');
        window.location.href = nextRoute ? decodeURIComponent(nextRoute) : '/dashboard';
      }, 800);
    } catch (err: unknown) {
      console.error('Login step 2 failed:', err);
      const apiErr = err as { message?: string };
      setAlert({
        message: apiErr.message || 'Verifikasi OTP gagal. Silakan periksa kembali kode Anda.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setIsLoading(true);
    setAlert(null);

    try {
      const response = await apiFetch('/api/auth/login-step1', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({ email: email.replace(/\s+/g, ''), password })
      });
      setAlert({
        message: response.message || 'Kode OTP baru telah dikirimkan ke email Anda.',
        type: 'success'
      });
      setResendCooldown(60);
    } catch (err: unknown) {
      console.error('Resend OTP failed:', err);
      const apiErr = err as { message?: string };
      setAlert({
        message: apiErr.message || 'Gagal mengirim ulang OTP. Silakan coba lagi nanti.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setOtpCode('');
    setAlert(null);
    if (resendIntervalRef.current) {
      window.clearInterval(resendIntervalRef.current);
      resendIntervalRef.current = null;
    }
    setResendCooldown(0);
  };

  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 6);
    setOtpCode(val);
  };

  return (
    <Layout title="Masuk ke Portal">
      <section className="flex items-center justify-center py-20 min-h-[70vh] bg-zinc-100">
        <div className="w-full max-w-md px-4 text-center mx-auto">
          <div className="card p-8 sm:p-10 bg-white border-3 border-black shadow-[6px_6px_0_#000] rounded-sm text-left">
            {/* Step 1 Header */}
            {step === 1 && (
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black">Masuk Portal</h2>
                <p className="text-xs text-zinc-500 font-bold mt-1">
                  Gunakan kredensial akun Anda untuk mengakses dashboard.
                </p>
              </div>
            )}

            {/* Step 2 Header */}
            {step === 2 && (
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-100 border-2 border-black flex items-center justify-center text-xl mx-auto mb-3 shadow-[2px_2px_0_#000] rounded-sm">
                  ✉️
                </div>
                <h2 className="text-xl font-black">Masukkan Kode OTP</h2>
                <p className="text-xs text-zinc-500 font-bold mt-2 leading-relaxed">
                  Kami baru saja mengirimkan 6 digit kode keamanan OTP ke email Anda{' '}
                  <strong className="text-black underline">{email}</strong>. Kode ini berlaku selama 5 menit.
                </p>
              </div>
            )}

            {/* Alert Box */}
            {alert && (
              <div className={`alert alert-${alert.type}`}>
                <span>{alert.message}</span>
              </div>
            )}

            {/* ==================== STEP 1: PASSWORD LOGIN ==================== */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="flex flex-col gap-4">
                <div className="form-group mb-0">
                  <label className="form-label" htmlFor="email">Alamat Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control font-bold border-black border-3"
                    placeholder="nama@email.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label" htmlFor="password">Kata Sandi</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control font-bold border-black border-3"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="toggle-password-btn"
                      aria-label="Lihat kata sandi"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-right mt-1.5">
                    <a href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Lupa Password?
                    </a>
                  </div>
                </div>

                {/* Cloudflare Turnstile */}
                {!import.meta.env.DEV && (
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                    onVerify={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken('')}
                  />
                )}

                <button
                  type="submit"
                  disabled={isLoading || !turnstileToken}
                  className="btn btn-primary w-full mt-4 h-12 font-black shadow-[3px_3px_0_#000] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Memverifikasi...' : 'Lanjutkan ke Verifikasi'}
                </button>
              </form>
            )}

            {/* ==================== STEP 2: OTP VERIFICATION ==================== */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="flex flex-col gap-4">
                <div className="form-group mb-0 text-center">
                  <label className="form-label text-center mb-2" htmlFor="otp-code">Kode OTP (6 Digit)</label>
                  <input
                    type="text"
                    id="otp-code"
                    value={otpCode}
                    onChange={handleOtpInputChange}
                    className="form-control text-center text-2xl font-black border-black border-3 tracking-widest h-14"
                    placeholder="000000"
                    required
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full mt-4 h-12 font-black shadow-[3px_3px_0_#000]"
                >
                  {isLoading ? 'Memproses...' : 'Verifikasi & Masuk'}
                </button>

                <div className="text-center mt-6 flex flex-col gap-3 items-center">
                  <div className="text-xs font-bold text-zinc-500">
                    Tidak menerima kode?{' '}
                    {resendCooldown > 0 ? (
                      <span className="text-zinc-400 font-extrabold">Kirim Ulang ({resendCooldown}s)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-black font-black underline bg-transparent border-none p-0 cursor-pointer"
                      >
                        Kirim Ulang
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="btn btn-sm btn-outline px-4 py-1"
                  >
                    Ganti Akun
                  </button>
                </div>
              </form>
            )}

            {/* Footer Sign Up Link */}
            {step === 1 && (
              <div className="text-center mt-6 border-t-2 border-zinc-200 pt-4">
                <p className="text-xs font-bold text-zinc-500">
                  Belum memiliki akun?{' '}
                  <a href="/register" className="text-black font-black underline">
                    Daftar secara gratis
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default Login;
