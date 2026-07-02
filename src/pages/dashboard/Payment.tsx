import { useState, useEffect } from 'react';
import { apiFetch, getApiUrl } from '../../utils/api';

interface CheckoutData {
  domainName: string;
  domainExtension: string;
  years: number;
  price: number;
  regularPrice?: number;
  ns?: string[];
  merchantOrderId?: string;
  action?: string;
  paymentMethod?: string;
  createdAt?: string;
}

interface SystemSettings {
  tax_enabled: boolean;
  tax_rate: number;
}

interface DuitkuPaymentMethod {
  paymentMethod: string;
  paymentName: string;
  paymentImage: string;
  fee: string | number;
}

interface InquiryResult {
  merchantOrderId: string;
  paymentUrl?: string;
  vaNumber?: string;
  qrString?: string;
  appUrl?: string;
  amount: number;
  reference: string;
  createdAt?: string;
}

type PageState = 'checkout' | 'processing' | 'pending_payment' | 'success' | 'error';

export default function Payment() {
  const [state, setState] = useState<PageState>('checkout');
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [defaultNs, setDefaultNs] = useState<string[]>(['ns1.ruangtunggu.id', 'ns2.ruangtunggu.id']);
  const [settings, setSettings] = useState<SystemSettings>({
    tax_enabled: true,
    tax_rate: 11,
  });

  const [paymentMethods, setPaymentMethods] = useState<DuitkuPaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [inquiryResult, setInquiryResult] = useState<InquiryResult | null>(null);
  const [vaCopied, setVaCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Load system settings
    try {
      const res = await apiFetch('/api/settings', { requireAuth: false });
      if (res?.success && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    // Check for Duitku query parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('merchantOrderId') || urlParams.get('orderId');
    const referenceParam = urlParams.get('reference');
    const resultCodeParam = urlParams.get('resultCode');

    if (orderIdParam) {
      try {
        const statusRes = await apiFetch(`/api/payment/status/${orderIdParam}`, { requireAuth: false });
        if (statusRes.success && statusRes.data) {
          const tx = statusRes.data;
          
          setCheckoutData({
            domainName: tx.domainName.split('.')[0] || '',
            domainExtension: tx.domainName.substring(tx.domainName.indexOf('.')) || '',
            years: tx.period || 1,
            price: tx.markupPrice || tx.grandTotal || 0,
            merchantOrderId: tx.merchantOrderId,
            action: tx.action,
            paymentMethod: tx.paymentMethod,
            createdAt: tx.createdAt
          });

          setInquiryResult({
            merchantOrderId: tx.merchantOrderId,
            amount: tx.grandTotal,
            reference: referenceParam || tx.paymentReference || tx.reference || '',
            createdAt: tx.createdAt
          });

          if (tx.status === 'SUCCESS' || resultCodeParam === '00') {
            setState('success');
            sessionStorage.removeItem('pending_domain_checkout');
            return;
          } else if (tx.status === 'FAILED' || resultCodeParam === '02') {
            setErrorMessage('Pembayaran Anda dinyatakan gagal atau kadaluarsa.');
            setState('error');
            return;
          } else if (tx.status === 'REGISTRATION_FAILED') {
            setErrorMessage('Pembayaran Anda berhasil, namun pendaftaran domain ke registry global mengalami kegagalan. Silakan hubungi Administrator.');
            setState('error');
            return;
          } else if (tx.status === 'RENEWAL_FAILED') {
            setErrorMessage('Pembayaran Anda berhasil, namun perpanjangan domain mengalami kegagalan. Silakan hubungi Administrator.');
            setState('error');
            return;
          } else {
            // It is PENDING.
            // Frontend-side expiry check: if transaction has a payment method
            // and was created more than 60 minutes ago, treat as expired
            if (tx.paymentMethod && tx.createdAt) {
              const createdTime = new Date(tx.createdAt).getTime();
              const isExpired = Date.now() - createdTime > 60 * 60 * 1000;
              if (isExpired) {
                setErrorMessage('Invoice ini telah melewati batas waktu pembayaran (60 menit). Silakan buat transaksi baru dari halaman Billing.');
                setState('error');
                return;
              }
            }

            if (tx.paymentMethod) {
              setSelectedMethod(tx.paymentMethod);

              // Use cached payment details from database if available
              if (tx.paymentVa || tx.paymentQr || tx.paymentUrl) {
                setInquiryResult({
                  merchantOrderId: tx.merchantOrderId,
                  amount: tx.grandTotal,
                  reference: tx.paymentReference || tx.reference || '',
                  vaNumber: tx.paymentVa || undefined,
                  qrString: tx.paymentQr || undefined,
                  paymentUrl: tx.paymentUrl || undefined,
                  createdAt: tx.createdAt
                });
                setState('pending_payment');
                return;
              }

              try {
                const res = await apiFetch('/api/payment/inquiry', {
                  method: 'POST',
                  body: JSON.stringify({
                    domainName: tx.domainName.split('.')[0] || '',
                    domainExtension: tx.domainName.substring(tx.domainName.indexOf('.')),
                    years: tx.period || 1,
                    ns: tx.ns ? tx.ns.split(',') : [],
                    paymentMethod: tx.paymentMethod,
                    merchantOrderId: tx.merchantOrderId,
                    action: tx.action || 'register'
                  }),
                });
                if (res.success && res.data) {
                  setInquiryResult(res.data);
                  setState('pending_payment');
                  return;
                }
              } catch (inqErr) {
                console.warn('Failed auto-inquiry for pending transaction:', inqErr);
              }
            }
            
            // If no payment method or inquiry failed, show checkout selection page
            await loadPaymentMethods(tx.paymentMethod || undefined);
            return;
          }
        }
      } catch (err: any) {
        console.warn('Failed to load status for order ID:', orderIdParam, err);
      }
    }

    // Load checkout data from sessionStorage
    const dataStr = sessionStorage.getItem('pending_domain_checkout');
    if (!dataStr) {
      window.location.href = '/';
      return;
    }
    try {
      const data = JSON.parse(dataStr) as CheckoutData;
      setCheckoutData(data);

      // Fetch default nameservers
      if (!data.ns || data.ns.length < 2) {
        try {
          const nsRes = await apiFetch('/api/domains/reseller', { requireAuth: false });
          if (nsRes.success && nsRes.data?.nameservers) {
            setDefaultNs(nsRes.data.nameservers);
          }
        } catch {
          // keep default
        }
      }
    } catch {
      window.location.href = '/';
    }

    // Load dynamic Duitku payment methods
    await loadPaymentMethods();
  }

  async function loadPaymentMethods(presetMethod?: string) {
    try {
      const res = await apiFetch(`/api/settings/payment-methods?_=${Date.now()}`, { requireAuth: false });
      if (res?.success && res.data?.paymentFee) {
        const methodsList = res.data.paymentFee as DuitkuPaymentMethod[];
        setPaymentMethods(methodsList);
        if (presetMethod) {
          setSelectedMethod(presetMethod);
        } else if (methodsList.length > 0) {
          setSelectedMethod(methodsList[0].paymentMethod);
        }
      }
    } catch (e) {
      console.warn('Failed to load Duitku payment methods:', e);
    } finally {
      setLoadingMethods(false);
    }
  }

  // Polling hook to monitor transaction payment status
  useEffect(() => {
    let intervalId: any;

    if (state === 'pending_payment' && inquiryResult) {
      const orderId = inquiryResult.merchantOrderId;
      
      const checkStatus = async () => {
        try {
          const res = await apiFetch(`/api/payment/status/${orderId}`, { requireAuth: false });
          if (res.success && res.data) {
            const status = res.data.status;
            if (status === 'SUCCESS') {
              clearInterval(intervalId);
              sessionStorage.removeItem('pending_domain_checkout');
              setState('success');
            } else if (status === 'FAILED') {
              clearInterval(intervalId);
              setErrorMessage('Pembayaran Anda dinyatakan gagal atau kadaluarsa oleh payment gateway.');
              setState('error');
            } else if (status === 'REGISTRATION_FAILED') {
              clearInterval(intervalId);
              setErrorMessage('Pembayaran Anda berhasil, namun pendaftaran domain ke registry global mengalami kegagalan.');
              setState('error');
            }
          }
        } catch (err) {
          console.warn('[Status Polling] Error checking payment status:', err);
        }
      };

      // Check status every 5 seconds
      intervalId = setInterval(checkStatus, 5000);
      
      // Run once immediately
      checkStatus();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state, inquiryResult]);

  // Pricing calculations
  const finalPrice = checkoutData ? Number(checkoutData.price) : 0;
  const taxRate = settings.tax_enabled ? (Number(settings.tax_rate) || 0) : 0;
  const tax = Math.round(finalPrice * (taxRate / 100));
  const selectedMethodObj = paymentMethods.find(pm => pm.paymentMethod === selectedMethod);
  let admin = selectedMethodObj ? Number(selectedMethodObj.fee) : 0;
  
  const isQris = selectedMethod && (
    ['SP', 'NQ', 'DQ', 'OQ', 'LQ', 'GQ'].includes(selectedMethod) || 
    selectedMethod.toLowerCase().includes('qris') || 
    (selectedMethodObj && selectedMethodObj.paymentName.toLowerCase().includes('qris'))
  );
  
  if (isQris) {
    const subtotal = finalPrice + tax;
    const grandTotalCalculated = Math.round(subtotal / (1 - 0.007));
    admin = grandTotalCalculated - subtotal;
  }
  
  const grandTotal = finalPrice + tax + admin;
  
  // Clean domain extension to avoid double dots (e.g. hallopod..com -> hallopod.com)
  const extClean = checkoutData?.domainExtension?.startsWith('.') 
    ? checkoutData.domainExtension 
    : checkoutData?.domainExtension 
      ? `.${checkoutData.domainExtension}` 
      : '';
  const fullDomain = checkoutData ? `${checkoutData.domainName}${extClean}` : '';
  const nsDisplay = checkoutData?.ns && checkoutData.ns.length >= 2
    ? `${checkoutData.ns[0]} & ${checkoutData.ns[1]}`
    : `${defaultNs[0]} & ${defaultNs[1]}`;

  const formatCurrency = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  const handleCopyVA = (num: string) => {
    navigator.clipboard.writeText(num);
    setVaCopied(true);
    setTimeout(() => setVaCopied(false), 2000);
  };

  const handleCheckStatusManual = async () => {
    if (!inquiryResult) return;
    setCheckingStatus(true);
    setStatusMessage(null);
    try {
      const orderId = inquiryResult.merchantOrderId;
      const res = await apiFetch(`/api/payment/status/${orderId}`, { requireAuth: false });
      if (res.success && res.data) {
        const status = res.data.status;
        if (status === 'SUCCESS') {
          sessionStorage.removeItem('pending_domain_checkout');
          setState('success');
        } else if (status === 'FAILED') {
          setErrorMessage('Pembayaran Anda dinyatakan gagal atau kadaluarsa oleh payment gateway.');
          setState('error');
        } else if (status === 'REGISTRATION_FAILED') {
          setErrorMessage('Pembayaran Anda berhasil, namun pendaftaran domain ke registry global mengalami kegagalan.');
          setState('error');
        } else {
          setStatusMessage({
            text: 'Pembayaran belum terdeteksi. Silakan transfer terlebih dahulu atau tunggu beberapa saat lalu coba klik cek kembali.',
            type: 'info'
          });
        }
      } else {
        setStatusMessage({
          text: 'Gagal mengecek status pembayaran. Silakan coba beberapa saat lagi.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('[Manual Check] Error checking status:', err);
      setStatusMessage({
        text: 'Terjadi kesalahan sistem saat mengecek status.',
        type: 'error'
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExpiryDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + 60); // 60 minutes expiry period
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Perform Inquiry
  async function performPayment() {
    if (!checkoutData || !selectedMethod) return;

    setState('processing');
    setErrorMessage('');

    try {
      const res = await apiFetch('/api/payment/inquiry', {
        method: 'POST',
        body: JSON.stringify({
          domainName: checkoutData.domainName,
          domainExtension: checkoutData.domainExtension,
          years: checkoutData.years,
          ns: checkoutData.ns || defaultNs,
          paymentMethod: selectedMethod,
          merchantOrderId: checkoutData.merchantOrderId,
          action: checkoutData.action || 'register',
        }),
      });

      if (res.success && res.data) {
        setInquiryResult(res.data);
        setState('pending_payment');
        // Push orderId to browser URL query parameters
        try {
          const newUrl = `${window.location.pathname}?orderId=${res.data.merchantOrderId}`;
          window.history.pushState(null, '', newUrl);
        } catch (e) {
          console.warn('Failed to update browser URL:', e);
        }
      } else {
        throw new Error(res.message || 'Gagal membuat tagihan Duitku.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat invoice pembayaran.');
      setState('error');
    }
  }

  // Tailored Bank Instructions Renderer
  function getBankInstructions(methodCode: string, vaNumber: string) {
    const code = methodCode.toUpperCase();
    if (code === 'M2' || code === 'M1' || code.includes('MANDIRI')) {
      return (
        <ol className="ml-4 text-xs text-zinc-500 space-y-2 list-decimal leading-relaxed text-left">
          <li>Masuk ke aplikasi <strong>Livin' by Mandiri</strong> atau ATM Mandiri.</li>
          <li>Pilih menu <strong>Bayar → Multipayment</strong> (atau Transfer ke Virtual Account).</li>
          <li>Masukkan nomor Virtual Account Mandiri: <strong className="font-mono text-black bg-zinc-100 px-1 border border-zinc-300">{vaNumber}</strong></li>
          <li>Konfirmasi rincian tagihan dan nominal pembayaran Anda.</li>
          <li>Masukkan PIN Livin' / ATM Anda dan selesaikan transaksi.</li>
        </ol>
      );
    }
    if (code === 'BC' || code.includes('BCA')) {
      return (
        <ol className="ml-4 text-xs text-zinc-500 space-y-2 list-decimal leading-relaxed text-left">
          <li>Buka aplikasi <strong>BCA Mobile</strong> atau kunjungi ATM BCA.</li>
          <li>Pilih menu <strong>m-Transfer → BCA Virtual Account</strong>.</li>
          <li>Masukkan nomor Virtual Account BCA: <strong className="font-mono text-black bg-zinc-100 px-1 border border-zinc-300">{vaNumber}</strong></li>
          <li>Pastikan nama penerima dan nominal tagihan sudah sesuai.</li>
          <li>Masukkan PIN BCA Mobile / PIN ATM Anda dan selesaikan pembayaran.</li>
        </ol>
      );
    }
    if (code === 'I1' || code.includes('BNI')) {
      return (
        <ol className="ml-4 text-xs text-zinc-500 space-y-2 list-decimal leading-relaxed text-left">
          <li>Buka aplikasi <strong>BNI Mobile Banking</strong> atau kunjungi ATM BNI.</li>
          <li>Pilih menu <strong>Transfer → Virtual Account Billing</strong>.</li>
          <li>Pilih rekening debit, lalu masukkan nomor Virtual Account BNI: <strong className="font-mono text-black bg-zinc-100 px-1 border border-zinc-300">{vaNumber}</strong></li>
          <li>Periksa rincian konfirmasi tagihan yang muncul di layar.</li>
          <li>Masukkan Password Transaksi / PIN ATM Anda untuk memproses pembayaran.</li>
        </ol>
      );
    }
    if (code === 'BR' || code.includes('BRI')) {
      return (
        <ol className="ml-4 text-xs text-zinc-500 space-y-2 list-decimal leading-relaxed text-left">
          <li>Buka aplikasi <strong>BRImo</strong> atau kunjungi ATM BRI.</li>
          <li>Pilih menu <strong>Pembayaran → BRIVA</strong> (Virtual Account).</li>
          <li>Masukkan nomor Virtual Account BRIVA: <strong className="font-mono text-black bg-zinc-100 px-1 border border-zinc-300">{vaNumber}</strong></li>
          <li>Konfirmasi nama pelanggan dan nominal tagihan Anda.</li>
          <li>Masukkan PIN BRImo / PIN ATM Anda untuk menyelesaikan pembayaran.</li>
        </ol>
      );
    }
    if (code === 'B1' || code.includes('CIMB')) {
      return (
        <ol className="ml-4 text-xs text-zinc-500 space-y-2 list-decimal leading-relaxed text-left">
          <li>Masuk ke aplikasi <strong>OCTO Mobile</strong> atau ATM CIMB Niaga.</li>
          <li>Pilih menu <strong>Transfer → Rekening CIMB Niaga Lain (Virtual Account)</strong>.</li>
          <li>Masukkan nomor Virtual Account CIMB Niaga: <strong className="font-mono text-black bg-zinc-100 px-1 border border-zinc-300">{vaNumber}</strong></li>
          <li>Periksa detail konfirmasi nama dan nominal tagihan Anda.</li>
          <li>Masukkan PIN OCTO Mobile / ATM Anda untuk menyelesaikan transaksi.</li>
        </ol>
      );
    }
    if (code === 'BT' || code.includes('PERMATA')) {
      return (
        <ol className="ml-4 text-xs text-zinc-500 space-y-2 list-decimal leading-relaxed text-left">
          <li>Masuk ke aplikasi <strong>PermataMobile X</strong> atau ATM Permata.</li>
          <li>Pilih menu <strong>Transfer → Virtual Account</strong> (atau Pembayaran).</li>
          <li>Masukkan nomor Virtual Account Permata: <strong className="font-mono text-black bg-zinc-100 px-1 border border-zinc-300">{vaNumber}</strong></li>
          <li>Konfirmasi nominal dan nama yang tertera.</li>
          <li>Masukkan PIN Anda untuk memproses pembayaran.</li>
        </ol>
      );
    }
    if (code === 'BV' || code.includes('BSI')) {
      return (
        <ol className="ml-4 text-xs text-zinc-500 space-y-2 list-decimal leading-relaxed text-left">
          <li>Buka aplikasi <strong>BSI Mobile</strong> atau ATM Bank Syariah Indonesia.</li>
          <li>Pilih menu <strong>Bayar/Transfer → Virtual Account</strong> (atau BSI VA).</li>
          <li>Masukkan nomor Virtual Account BSI: <strong className="font-mono text-black bg-zinc-100 px-1 border border-zinc-300">{vaNumber}</strong></li>
          <li>Periksa rincian konfirmasi tagihan yang muncul di layar.</li>
          <li>Masukkan PIN BSI Mobile / ATM Anda untuk menyelesaikan pembayaran.</li>
        </ol>
      );
    }
    // Generic instructions
    return (
      <ol className="ml-4 text-xs text-zinc-500 space-y-2 list-decimal leading-relaxed text-left">
        <li>Buka aplikasi mobile banking atau pergi ke ATM bank pilihan Anda.</li>
        <li>Pilih menu <strong>Transfer ke Virtual Account</strong> (atau menu Multipayment / Pembayaran).</li>
        <li>Masukkan nomor Virtual Account: <strong className="font-mono text-black bg-zinc-100 px-1 border border-zinc-300">{vaNumber}</strong></li>
        <li>Periksa kesesuaian nama tagihan dan nominal pembayaran di layar konfirmasi.</li>
        <li>Konfirmasi transaksi Anda dengan memasukkan PIN dan selesaikan pembayaran.</li>
      </ol>
    );
  }

  // ── CHECKOUT STATE ──
  if (state === 'checkout' && checkoutData) {
    return (
      <div className="max-w-[1000px] mx-auto text-left py-12 px-4">
        {/* Header */}
        <div className="mb-6 border-b-3 border-black pb-4">
          <h1 className="text-xl font-black flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            Pemesanan Domain
          </h1>
          <p className="text-xs font-semibold text-zinc-500 mt-1">
            Pilih metode pembayaran dan konfirmasikan rincian domain Anda untuk menyelesaikan pemesanan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-7 items-start">
          {/* LEFT: Order Summary + Payment Methods */}
          <div className="flex flex-col gap-5">
            {/* Order Summary */}
            <div className="bg-white border-3 border-black p-6 shadow-[4px_4px_0px_#000]">
              <h3 className="text-sm font-black mb-4 pb-2 border-b-2 border-dashed border-black flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                Rincian Domain
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">Nama Domain:</span>
                  <strong className="font-mono text-[var(--accent-primary)]">{fullDomain}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">Durasi Pendaftaran:</span>
                  <span className="font-bold">{checkoutData.years} Tahun</span>
                </div>
                {checkoutData.ns && checkoutData.ns.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Nameserver:</span>
                    <span className="text-xs font-mono text-right">
                      {checkoutData.ns.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white border-3 border-black p-6 shadow-[4px_4px_0px_#000]">
              <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 11 2 2 4-4" />
                </svg>
                Pilih Metode Pembayaran
              </h3>

              {/* Dynamic Duitku Payment Methods List */}
              {checkoutData?.paymentMethod && (
                <div className="bg-amber-50 border-2 border-black p-3.5 mb-4 font-bold text-[11px] text-amber-800 flex items-start gap-2.5 shadow-[2px_2px_0px_#000]">
                  <span className="text-sm">⚠️</span>
                  <span>
                    Metode pembayaran telah dipilih sebelumnya dan dikunci untuk tagihan ini. 
                    Silakan hubungi Admin jika Anda ingin mengubah metode pembayaran.
                  </span>
                </div>
              )}

              {loadingMethods ? (
                <div className="flex items-center gap-3 py-8 justify-center text-zinc-500">
                  <div className="w-6 h-6 border-3 border-black border-t-[var(--accent-primary)] rounded-full animate-spin" />
                  <span className="text-xs font-black">Memuat metode pembayaran Duitku...</span>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="p-5 border-2 border-dashed border-red-500 bg-red-50 text-red-700 text-xs font-bold text-center">
                  Metode pembayaran tidak tersedia atau konfigurasi Duitku belum diisi oleh admin.
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto pr-1 p-1">
                  <div className="flex flex-col gap-2.5 mb-2">
                    {paymentMethods.map(pm => {
                      const isSelected = selectedMethod === pm.paymentMethod;
                      const isDisabled = !!checkoutData?.paymentMethod && checkoutData.paymentMethod !== pm.paymentMethod;
                      return (
                        <button
                          key={pm.paymentMethod}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedMethod(pm.paymentMethod)}
                          className={`flex items-center justify-start p-3 border-3 border-black cursor-pointer transition-all rounded-none w-full text-left ${
                            isSelected
                              ? 'bg-[var(--accent-primary)] text-black shadow-[3px_3px_0px_#000] translate-x-[-2px] translate-y-[-2px]'
                              : isDisabled
                                ? 'bg-zinc-100 text-zinc-400 opacity-50 cursor-not-allowed border-zinc-300 shadow-none pointer-events-none'
                                : 'bg-white text-black hover:bg-zinc-50 hover:shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-8 bg-white border border-zinc-300 flex items-center justify-center p-1 rounded-sm">
                              <img 
                                src={pm.paymentImage.startsWith('http') ? pm.paymentImage : `${getApiUrl()}${pm.paymentImage}`} 
                                alt={pm.paymentName} 
                                className="max-h-full max-w-full object-contain" 
                              />
                            </div>
                            <span className="font-black text-xs">{pm.paymentName}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Billing Summary */}
          <div className="bg-white border-3 border-black p-7 shadow-[5px_5px_0px_#000] sticky top-20">
            <h3 className="text-sm font-black mb-5 pb-3 border-b-2 border-dashed border-black flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              Ringkasan Pembayaran
            </h3>

            <div className="flex flex-col gap-3 text-sm border-b-2 border-black pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-500 font-semibold">Harga Domain ({checkoutData.years} thn):</span>
                <span className="font-bold">{formatCurrency(finalPrice)}</span>
              </div>



              {settings.tax_enabled && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">PPN / Tax ({taxRate}%):</span>
                  <span className="font-bold">{formatCurrency(tax)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-zinc-500 font-semibold">Biaya Admin:</span>
                <span className="font-bold">{formatCurrency(admin)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-black">Total Bayar:</span>
              <strong className="text-xl font-black text-[var(--accent-primary)]">{formatCurrency(grandTotal)}</strong>
            </div>

            <button
              onClick={performPayment}
              disabled={loadingMethods || paymentMethods.length === 0}
              className="w-full py-3.5 border-3 border-black bg-[var(--accent-primary)] disabled:bg-zinc-200 disabled:cursor-not-allowed text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer mb-3"
            >
              Bayar & Aktifkan Domain
            </button>

            <a
              href={checkoutData?.merchantOrderId ? "/dashboard/billing" : "/dashboard"}
              className="w-full block text-center py-3 border-3 border-black bg-white text-black font-bold text-xs hover:bg-zinc-50 no-underline"
            >
              Batal & Kembali
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── PENDING PAYMENT STATE ──
  if (state === 'pending_payment' && inquiryResult) {
    const isQris = inquiryResult.qrString !== undefined && inquiryResult.qrString !== null && inquiryResult.qrString !== '';
    const isVa = inquiryResult.vaNumber !== undefined && inquiryResult.vaNumber !== null && inquiryResult.vaNumber !== '';
    const hasRedirect = inquiryResult.paymentUrl || inquiryResult.appUrl;

    return (
      <div className="max-w-[700px] mx-auto text-left animate-[fadeSlideUp_0.25s_ease-out] py-12 px-4">
        <div className="bg-white border-3 border-black p-8 shadow-[6px_6px_0px_#000] relative overflow-hidden">
          {/* Accent strip */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[var(--accent-primary)]" />

          {/* Title block */}
          <div className="text-center mb-6 pb-6 border-b-2 border-dashed border-black">
            <span className="px-2.5 py-1 bg-yellow-300 border-2 border-black text-[10px] font-black uppercase shadow-[2px_2px_0px_#000] inline-block mb-3">
              Menunggu Pembayaran
            </span>
            <h2 className="text-2xl font-black text-black">Selesaikan Pembayaran</h2>
            <p className="text-xs text-zinc-500 font-bold mt-2 flex flex-col gap-1 items-center justify-center">
              <span>No. Invoice: <span className="font-mono text-black">{inquiryResult.merchantOrderId}</span></span>
              <span>No. Referensi Duitku: <span className="font-mono text-[var(--accent-primary)]">{inquiryResult.reference}</span></span>
              {inquiryResult.createdAt && (
                <>
                  <span>Tanggal Invoice: <span className="text-zinc-600 font-semibold">{formatDateTime(inquiryResult.createdAt)}</span></span>
                  <span>Batas Pembayaran: <span className="text-red-600 font-extrabold">{getExpiryDateTime(inquiryResult.createdAt)}</span></span>
                </>
              )}
            </p>
          </div>

          {/* Amount Box */}
          <div className="bg-zinc-50 border-3 border-black p-5 text-center mb-6">
            <span className="text-[10px] font-black uppercase text-zinc-500 block mb-1">TOTAL TAGIHAN</span>
            <strong className="text-3xl font-black text-[var(--accent-primary)] tracking-tight">
              {formatCurrency(inquiryResult.amount)}
            </strong>
          </div>

          {/* Method Content */}
          {isQris && (
            <div className="text-center flex flex-col items-center">
              <div className="bg-white p-4 border-3 border-black shadow-[4px_4px_0px_#000] inline-flex items-center justify-center mb-5">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(inquiryResult.qrString || '')}`} 
                  alt="QRIS QR Code" 
                  className="w-[200px] h-[200px]"
                />
              </div>
              <p className="text-xs font-black text-zinc-700 max-w-sm mb-3">
                Scan kode QR di atas menggunakan aplikasi e-Wallet (GoPay, OVO, Dana, LinkAja, ShopeePay) atau m-Banking Anda.
              </p>
              <div className="flex items-center gap-2 justify-center font-black text-[var(--accent-primary)] text-xs mt-2 bg-emerald-50 border-2 border-black py-2 px-4 shadow-[2px_2px_0px_#000]">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span>Menunggu status verifikasi otomatis pembayaran...</span>
              </div>
            </div>
          )}

          {isVa && (
            <div>
              <div className="bg-zinc-50 border-3 border-black p-5 mb-5 flex justify-between items-center shadow-[2px_2px_0px_#000]">
                <div>
                  <span className="text-[9px] uppercase text-zinc-500 font-black block">NOMOR VIRTUAL ACCOUNT</span>
                  <strong className="text-xl font-mono tracking-wider text-black">{inquiryResult.vaNumber}</strong>
                </div>
                <button
                  onClick={() => handleCopyVA(inquiryResult.vaNumber || '')}
                  className="px-4 py-2 border-2 border-black bg-[var(--accent-primary)] text-black font-black text-xs hover:bg-zinc-100 active:translate-y-0.5 cursor-pointer shadow-[2px_2px_0px_#000]"
                >
                  {vaCopied ? 'Tersalin!' : 'Salin Nomor'}
                </button>
              </div>

              <div className="mb-4">
                <p className="font-black text-xs text-black mb-3">📋 Petunjuk Transfer:</p>
                {getBankInstructions(selectedMethod, inquiryResult.vaNumber || '')}
              </div>

              <div className="flex items-center gap-2 justify-center font-black text-[var(--accent-primary)] text-xs mt-6 bg-emerald-50 border-2 border-black py-2 px-4 shadow-[2px_2px_0px_#000]">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span>Mendeteksi status transfer Anda secara real-time...</span>
              </div>
            </div>
          )}

          {!isQris && !isVa && hasRedirect && (
            <div className="text-center py-4">
              <p className="text-xs text-zinc-500 font-bold mb-4">
                Silakan klik tombol di bawah untuk menyelesaikan pembayaran di halaman web resmi payment gateway.
              </p>
              <a
                href={inquiryResult.paymentUrl || inquiryResult.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-3.5 px-8 border-3 border-black bg-[var(--accent-primary)] text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all no-underline shadow-[2px_2px_0px_#000] mb-5"
              >
                🔗 Buka Halaman Pembayaran Duitku
              </a>
              <div className="flex items-center gap-2 justify-center font-black text-[var(--accent-primary)] text-xs bg-emerald-50 border-2 border-black py-2 px-4 shadow-[2px_2px_0px_#000] max-w-sm mx-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span>Menunggu status penyelesaian pembayaran...</span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-black">
            {statusMessage && (
              <div className={`mb-5 p-4 border-3 border-black text-xs font-black shadow-[3px_3px_0px_#000] text-center ${
                statusMessage.type === 'info' 
                  ? 'bg-yellow-100 text-black' 
                  : 'bg-red-100 text-red-900'
              }`}>
                {statusMessage.type === 'info' ? 'ℹ️ ' : '❌ '} {statusMessage.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/dashboard/billing"
                className="flex-1 max-w-[280px] w-full text-center py-3.5 border-3 border-black bg-white hover:bg-zinc-50 text-black font-black text-xs no-underline shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
              >
                Kembali ke Billing (Bayar Nanti)
              </a>

              <button
                onClick={handleCheckStatusManual}
                disabled={checkingStatus}
                className="flex-1 max-w-[280px] w-full text-center py-3.5 border-3 border-black bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover,#e0b000)] disabled:bg-zinc-300 disabled:cursor-not-allowed text-black font-black text-xs no-underline shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
              >
                {checkingStatus ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    Mengecek...
                  </span>
                ) : (
                  'Konfirmasi / Cek Pembayaran'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PROCESSING STATE ──
  if (state === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="w-12 h-12 border-4 border-black border-t-[var(--accent-primary)] rounded-full animate-spin mb-6" />
        <h2 className="text-lg font-black">Menyiapkan invoice & gateway pembayaran...</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-md">
          Mohon jangan menutup atau memuat ulang halaman ini. Kami sedang membuat billing order Anda di payment gateway secara aman.
        </p>
      </div>
    );
  }

  // ── SUCCESS STATE ──
  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 text-left">
        <div className="w-[72px] h-[72px] bg-green-100 border-3 border-green-600 text-green-600 flex items-center justify-center rounded-full mb-6 shadow-[3px_3px_0px_#166534]">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-black">Pembayaran Sukses & Domain Aktif!</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-lg leading-relaxed text-center">
          Pembayaran Anda telah diverifikasi secara instan. Domain <strong className="font-mono text-[var(--accent-primary)]">{fullDomain}</strong> telah resmi terdaftar dan dikonfigurasi aktif.
        </p>

        <div className="bg-white border-3 border-black p-6 max-w-xl mt-6 text-left shadow-[4px_4px_0px_#000]">
          <h4 className="text-sm font-black mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            Langkah Selanjutnya:
          </h4>
          <ul className="ml-4 text-xs text-zinc-500 space-y-2 list-disc leading-relaxed">
            <li>Masa aktif domain dikonfigurasi selama <strong>{checkoutData?.years} Tahun</strong>.</li>
            <li>Nameservers diatur ke: <strong className="font-mono">{nsDisplay}</strong>.</li>
            <li>Anda dapat langsung mengatur DNS Records (A, MX, CNAME, TXT) atau mengubah nameserver melalui dashboard domain Anda.</li>
          </ul>
        </div>

        <div className="flex gap-3 mt-8">
          <a
            href="/dashboard"
            className="px-6 py-3.5 border-3 border-black bg-[var(--accent-primary)] text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all no-underline shadow-[2px_2px_0px_#000]"
          >
            Masuk ke Dashboard
          </a>
          <a
            href="/"
            className="px-6 py-3.5 border-3 border-black bg-white text-black font-bold text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all no-underline shadow-[2px_2px_0px_#000]"
          >
            Daftar Domain Baru
          </a>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ──
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 text-left">
        <div className="w-[72px] h-[72px] bg-red-100 border-3 border-red-600 text-red-600 flex items-center justify-center rounded-full mb-6 shadow-[3px_3px_0px_#991b1b]">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h2 className="text-xl font-black">Transaksi Pembayaran Gagal</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-lg leading-relaxed text-center">
          Kami mendeteksi kendala saat memproses pendaftaran transaksi Anda. Silakan coba kembali atau hubungi Administrator.
        </p>
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 font-mono text-xs text-red-700 max-w-md text-center">
          Detail Error: {errorMessage}
        </div>

        <div className="flex gap-3 mt-8">
          {checkoutData?.merchantOrderId ? (
            <a
              href="/dashboard/billing"
              className="px-6 py-3.5 border-3 border-black bg-[var(--accent-primary)] text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all no-underline shadow-[2px_2px_0px_#000]"
            >
              Kembali ke Billing
            </a>
          ) : (
            <button
              onClick={() => setState('checkout')}
              className="px-6 py-3.5 border-3 border-black bg-[var(--accent-primary)] text-black font-black text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer shadow-[2px_2px_0px_#000]"
            >
              Kembali ke Invoice
            </button>
          )}
          <a
            href="/dashboard/billing"
            className="px-6 py-3.5 border-3 border-black bg-white text-black font-bold text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all no-underline shadow-[2px_2px_0px_#000]"
          >
            Ke Billing
          </a>
        </div>
      </div>
    );
  }

  // Loading / Redirecting
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 text-left">
      <div className="w-10 h-10 border-4 border-black border-t-[var(--accent-primary)] rounded-full animate-spin mb-4" />
      <p className="text-sm text-zinc-500 font-bold">Memuat data pembayaran...</p>
    </div>
  );
}
