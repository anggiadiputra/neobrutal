import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { apiFetch } from '../../utils/api';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Core domain state
  const [domain, setDomain] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // active tab: overview, dns, nameservers, hosts, forwarding, dnssec, whois
  const [activeTab, setActiveTab] = useState('overview');

  // Overview edit modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [editRole, setEditRole] = useState<'registrant' | 'admin' | 'tech' | 'billing'>('registrant');
  const [contactForm, setContactForm] = useState({
    id: '',
    name: '',
    organization: '',
    email: '',
    voice: '',
    street_1: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: '',
  });

  // Overview Renew state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewYears, setRenewYears] = useState(1);
  const [renewPrice, setRenewPrice] = useState(120000);
  const [renewPriceLoading, setRenewPriceLoading] = useState(false);

  // Overview lock states (local track to handle loading instantly/toggles)
  const [isTheftProtected, setIsTheftProtected] = useState(false);
  const [isRegistrarLocked, setIsRegistrarLocked] = useState(false);
  const [isWhoisProtected, setIsWhoisProtected] = useState(false);
  const [whoisPrice, setWhoisPrice] = useState(15000);

  // Overview Auth Code states
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [authCodeVal, setAuthCodeVal] = useState('');
  const [authCodeLoading, setAuthCodeLoading] = useState(false);
  const [isEditingAuthCode, setIsEditingAuthCode] = useState(false);
  const [editAuthCodeVal, setEditAuthCodeVal] = useState('');

  // DNS Management state
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsForm, setDnsForm] = useState({
    name: '',
    type: 'A',
    content: '',
    ttl: 3600
  });

  // Nameservers state
  const [nsForm, setNsForm] = useState({
    ns1: '',
    ns2: '',
    ns3: '',
    ns4: '',
  });
  const [isEditingNs, setIsEditingNs] = useState(false);
  const [nsSaving, setNsSaving] = useState(false);

  // Child Nameservers (Hosts) state
  const [hosts, setHosts] = useState<any[]>([]);
  const [hostsLoading, setHostsLoading] = useState(false);
  const [hostForm, setHostForm] = useState({
    name: '',
    ip: ''
  });

  // Forwarding state
  const [forwarding, setForwarding] = useState<any[]>([]);
  const [forwardingLoading, setForwardingLoading] = useState(false);
  const [forwardForm, setForwardForm] = useState({
    from: '',
    to: ''
  });
  const [showAddForwardRow, setShowAddForwardRow] = useState(false);

  // DNSSEC state
  const [dnssec, setDnssec] = useState<any[]>([]);
  const [dnssecLoading, setDnssecLoading] = useState(false);
  const [dnssecForm, setDnssecForm] = useState({
    keyTag: '',
    algorithm: '13', // ECDSAP256SHA256
    digestType: '2', // SHA-256
    digest: ''
  });

  // WHOIS raw state
  const [parsedWhois, setParsedWhois] = useState<any>(null);
  const [rawWhois, setRawWhois] = useState('');
  const [whoisLoading, setWhoisLoading] = useState(false);

  // Admin suspend state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch logged in user to check if admin
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setIsAdmin(!!u.is_admin);
      }
    } catch (e) {
      console.warn('Failed to parse user from localstorage', e);
    }
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg('');
    } else {
      setErrorMsg(msg);
      setSuccessMsg('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadDomainDetails = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/domains/${id}`);
      if (res.success && res.data) {
        setDomain(res.data);
        setIsTheftProtected(!!(res.data.is_locked ?? res.data.locked));
        setIsRegistrarLocked(!!res.data.is_registrar_locked);
        
        // NS
        setNsForm({
          ns1: res.data.nameserver_1 || '',
          ns2: res.data.nameserver_2 || '',
          ns3: res.data.nameserver_3 || '',
          ns4: res.data.nameserver_4 || '',
        });

        // WHOIS protection
        const isId = (res.data.name || '').toLowerCase().endsWith('.id') || res.data.required_document === 1;
        if (!isId) {
          try {
            const whoisRes = await apiFetch(`/api/domains/${id}/whois-protection`);
            if (whoisRes.success && whoisRes.data) {
              setIsWhoisProtected(!!whoisRes.data.enabled);
            }
            const ext = (res.data.name || '').substring((res.data.name || '').indexOf('.'));
            const pricesRes = await apiFetch(`/api/domains/prices?extension=${ext}`);
            if (pricesRes.success && pricesRes.data && pricesRes.data.whoisPrice) {
              setWhoisPrice(pricesRes.data.whoisPrice);
            }
          } catch (e) {
            console.warn('Whois protection detail fetch error:', e);
          }
        }
      } else {
        setErrorMsg(res.message || 'Gagal memuat detail domain.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat detail domain.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDomainDetails();
    }
  }, [id]);

  // Load active tab details
  useEffect(() => {
    if (!domain) return;
    if (activeTab === 'dns') {
      fetchDns();
    } else if (activeTab === 'hosts') {
      fetchHosts();
    } else if (activeTab === 'forwarding') {
      fetchForwarding();
    } else if (activeTab === 'dnssec') {
      fetchDnssec();
    } else if (activeTab === 'whois') {
      fetchWhois();
    }
  }, [activeTab, domain]);

  // Contact Edit Modal opener
  const openEditContact = (role: 'registrant' | 'admin' | 'tech' | 'billing') => {
    setEditRole(role);
    const targetContact = domain ? domain[`${role}_contact`] : null;
    setContactForm({
      id: targetContact?.id ? String(targetContact.id) : '',
      name: targetContact?.name || '',
      organization: targetContact?.organization || '',
      email: targetContact?.email || '',
      voice: targetContact?.voice || '',
      street_1: targetContact?.street_1 || '',
      city: targetContact?.city || '',
      state: targetContact?.state || '',
      postal_code: targetContact?.postal_code || '',
      country_code: targetContact?.country_code || '',
    });
    setShowContactModal(true);
  };

  const handleContactSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/domains/${id}/contacts/${contactForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactForm,
          country_code: contactForm.country_code.toUpperCase(),
          label: 'Default'
        })
      });
      if (res.success) {
        showNotification('Informasi kontak domain berhasil diperbarui.', 'success');
        setShowContactModal(false);
        loadDomainDetails();
      } else {
        showNotification(res.message || 'Gagal memperbarui kontak.', 'error');
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      showNotification(apiErr.message || 'Gagal memperbarui kontak.', 'error');
    }
  };

  // Theft Protection toggle
  const toggleTheftProtection = async () => {
    const nextVal = !isTheftProtected;
    try {
      const res = await apiFetch(`/api/domains/${id}/locked`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: nextVal })
      });
      if (res.success) {
        setIsTheftProtected(nextVal);
        showNotification(`Theft protection ${nextVal ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
      } else {
        showNotification(res.message || 'Gagal mengubah status theft protection.', 'error');
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      showNotification(apiErr.message || 'Gagal mengubah status theft protection.', 'error');
    }
  };

  // Registrar Lock toggle
  const toggleRegistrarLock = async () => {
    const nextVal = !isRegistrarLocked;
    try {
      const res = await apiFetch(`/api/domains/${id}/registrar-locked`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: nextVal })
      });
      if (res.success) {
        setIsRegistrarLocked(nextVal);
        showNotification(`Registrar lock ${nextVal ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
      } else {
        showNotification(res.message || 'Gagal mengubah status registrar lock.', 'error');
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      showNotification(apiErr.message || 'Gagal mengubah status registrar lock.', 'error');
    }
  };

  // Whois Protection toggle
  const handleWhoisToggle = async () => {
    const nextVal = !isWhoisProtected;
    try {
      const res = await apiFetch(`/api/domains/${id}/whois-protection`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextVal })
      });
      if (res.success) {
        setIsWhoisProtected(nextVal);
        showNotification(`Whois protection ${nextVal ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
      } else {
        showNotification(res.message || 'Gagal mengubah status whois protection.', 'error');
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      showNotification(apiErr.message || 'Gagal mengubah status whois protection.', 'error');
    }
  };

  const buyWhoisProtection = async () => {
    try {
      const res = await apiFetch(`/api/domains/${id}/whois-protection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.success) {
        setIsWhoisProtected(true);
        showNotification('Berhasil membeli Whois Protection!', 'success');
      } else {
        showNotification(res.message || 'Gagal membeli Whois Protection.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal membeli Whois Protection.', 'error');
    }
  };

  // Auth Code handlers
  const handleShowAuthCode = async () => {
    if (showAuthCode) {
      setShowAuthCode(false);
      return;
    }
    setAuthCodeLoading(true);
    try {
      const res = await apiFetch(`/api/domains/${id}/auth-code`);
      if (res.success && res.data) {
        setAuthCodeVal(res.data);
        setShowAuthCode(true);
      } else {
        showNotification(res.message || 'Gagal memuat auth code.', 'error');
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      showNotification(apiErr.message || 'Gagal memproses.', 'error');
    } finally {
      setAuthCodeLoading(false);
    }
  };

  const handleRegenAuthCode = async () => {
    setAuthCodeLoading(true);
    try {
      const res = await apiFetch(`/api/domains/${id}/auth-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: true })
      });
      if (res.success && res.data) {
        setAuthCodeVal(res.data);
        setShowAuthCode(true);
        showNotification('Auth code berhasil diregenerasi.', 'success');
      } else {
        showNotification(res.message || 'Gagal meregenerasi auth code.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal meregenerasi auth code.', 'error');
    } finally {
      setAuthCodeLoading(false);
    }
  };

  const handleUpdateAuthCode = async () => {
    if (!editAuthCodeVal.trim()) return;
    setAuthCodeLoading(true);
    try {
      const res = await apiFetch(`/api/domains/${id}/auth-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authCode: editAuthCodeVal.trim() })
      });
      if (res.success && res.data) {
        setAuthCodeVal(res.data);
        setShowAuthCode(true);
        setIsEditingAuthCode(false);
        showNotification('Auth code berhasil diubah.', 'success');
      } else {
        showNotification(res.message || 'Gagal mengubah auth code.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal mengubah auth code.', 'error');
    } finally {
      setAuthCodeLoading(false);
    }
  };

  // Document upload link
  const handleDocUpload = async () => {
    try {
      const res = await apiFetch(`/api/domains/${id}/documents/link`, { method: 'POST' });
      if (res.success && res.data) {
        window.open(res.data, '_blank');
      } else {
        showNotification(res.message || 'Gagal mengambil link upload dokumen.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal mengambil link upload dokumen.', 'error');
    }
  };

  // Resend email verification
  const handleResendVerifyEmail = async () => {
    try {
      const res = await apiFetch(`/api/domains/${id}/verification/resend`, { method: 'POST' });
      if (res.success) {
        showNotification('Email verifikasi berhasil dikirim ulang!', 'success');
      } else {
        showNotification(res.message || 'Gagal mengirim email verifikasi.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal mengirim email verifikasi.', 'error');
    }
  };

  // Renew modal calculation & action
  const openRenew = async () => {
    setShowRenewModal(true);
    setRenewPriceLoading(true);
    try {
      const ext = (domain.name || '').substring((domain.name || '').indexOf('.'));
      const res = await apiFetch(`/api/domains/prices?extension=${ext}`);
      if (res.success && res.data) {
        // Find renew price for selected years
        const ry = res.data.renewalByYear || {};
        const baseRenew = ry[String(renewYears)] || (res.data.renewPrice * renewYears);
        setRenewPrice(baseRenew);
      }
    } catch (e) {
      console.warn('Failed to calculate renew price, fallback to default', e);
    } finally {
      setRenewPriceLoading(false);
    }
  };

  useEffect(() => {
    if (showRenewModal && domain) {
      const fetchRenewPrice = async () => {
        setRenewPriceLoading(true);
        try {
          const ext = (domain.name || '').substring((domain.name || '').indexOf('.'));
          const res = await apiFetch(`/api/domains/prices?extension=${ext}`);
          if (res.success && res.data) {
            const ry = res.data.renewalByYear || {};
            const baseRenew = ry[String(renewYears)] || (res.data.renewPrice * renewYears);
            setRenewPrice(baseRenew);
          }
        } catch (e) {
          console.warn('Failed to calculate renew price', e);
        } finally {
          setRenewPriceLoading(false);
        }
      };
      fetchRenewPrice();
    }
  }, [renewYears, showRenewModal, domain]);

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/domains/${id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ years: renewYears })
      });
      if (res.success) {
        showNotification('Perpanjangan domain berhasil diajukan.', 'success');
        setShowRenewModal(false);
        loadDomainDetails();
      } else {
        showNotification(res.message || 'Gagal memperpanjang domain.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal memperpanjang domain.', 'error');
    }
  };

  // Nameservers form handlers
  const handleNsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNsSaving(true);
    try {
      const res = await apiFetch(`/api/domains/${id}/ns`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameserver_1: nsForm.ns1,
          nameserver_2: nsForm.ns2,
          nameserver_3: nsForm.ns3,
          nameserver_4: nsForm.ns4,
        })
      });
      if (res.success) {
        showNotification('Nameservers berhasil diperbarui.', 'success');
        setIsEditingNs(false);
        loadDomainDetails();
      } else {
        showNotification(res.message || 'Gagal memperbarui nameservers.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal memperbarui nameservers.', 'error');
    } finally {
      setNsSaving(false);
    }
  };

  // DNS Tab logic
  const fetchDns = async () => {
    setDnsLoading(true);
    try {
      const res = await apiFetch(`/api/domains/${id}/dns`);
      if (res.success && Array.isArray(res.data)) {
        setDnsRecords(res.data);
      } else {
        setDnsRecords([]);
      }
    } catch (err) {
      console.error(err);
      setDnsRecords([]);
    } finally {
      setDnsLoading(false);
    }
  };

  const handleAddDns = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/domains/${id}/dns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dnsForm)
      });
      if (res.success) {
        showNotification('Record DNS berhasil ditambahkan.', 'success');
        setDnsForm({ name: '', type: 'A', content: '', ttl: 3600 });
        fetchDns();
      } else {
        showNotification(res.message || 'Gagal menambahkan record DNS.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menambahkan record DNS.', 'error');
    }
  };

  const handleDeleteDns = async (record: any) => {
    if (!confirm('Apakah Anda yakin ingin menghapus record DNS ini?')) return;
    try {
      const res = await apiFetch(`/api/domains/${id}/dns/record`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (res.success) {
        showNotification('Record DNS berhasil dihapus.', 'success');
        fetchDns();
      } else {
        showNotification(res.message || 'Gagal menghapus record DNS.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menghapus record DNS.', 'error');
    }
  };

  // Child NS (Hosts) logic
  const fetchHosts = async () => {
    setHostsLoading(true);
    try {
      const res = await apiFetch(`/api/domains/${id}/hosts`);
      if (res.success && Array.isArray(res.data)) {
        setHosts(res.data);
      } else {
        setHosts([]);
      }
    } catch (err) {
      console.error(err);
      setHosts([]);
    } finally {
      setHostsLoading(false);
    }
  };

  const handleAddHost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/domains/${id}/hosts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hostForm)
      });
      if (res.success) {
        showNotification('Child nameserver berhasil didaftarkan.', 'success');
        setHostForm({ name: '', ip: '' });
        fetchHosts();
      } else {
        showNotification(res.message || 'Gagal mendaftarkan child nameserver.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal mendaftarkan child nameserver.', 'error');
    }
  };

  const handleDeleteHost = async (hostId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus child nameserver ini?')) return;
    try {
      const res = await apiFetch(`/api/domains/${id}/hosts/${hostId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showNotification('Child nameserver berhasil dihapus.', 'success');
        fetchHosts();
      } else {
        showNotification(res.message || 'Gagal menghapus child nameserver.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menghapus child nameserver.', 'error');
    }
  };

  // Forwarding logic
  const fetchForwarding = async () => {
    setForwardingLoading(true);
    try {
      const res = await apiFetch(`/api/domains/${id}/forwarding`);
      if (res.success && Array.isArray(res.data)) {
        setForwarding(res.data);
      } else {
        setForwarding([]);
      }
    } catch (err) {
      console.error(err);
      setForwarding([]);
    } finally {
      setForwardingLoading(false);
    }
  };

  const handleAddForward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/domains/${id}/forwarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: forwardForm.from.trim(),
          to: forwardForm.to.trim()
        })
      });
      if (res.success) {
        showNotification('Domain forwarding berhasil ditambahkan.', 'success');
        setForwardForm({ from: '', to: '' });
        setShowAddForwardRow(false);
        fetchForwarding();
      } else {
        showNotification(res.message || 'Gagal menambahkan domain forwarding.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menambahkan domain forwarding.', 'error');
    }
  };

  const handleDeleteForward = async (fwdId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus domain forwarding ini?')) return;
    try {
      const res = await apiFetch(`/api/domains/${id}/forwarding/${fwdId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showNotification('Domain forwarding berhasil dihapus.', 'success');
        fetchForwarding();
      } else {
        showNotification(res.message || 'Gagal menghapus domain forwarding.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menghapus domain forwarding.', 'error');
    }
  };

  // DNSSEC logic
  const fetchDnssec = async () => {
    setDnssecLoading(true);
    try {
      const res = await apiFetch(`/api/domains/${id}/dnssec`);
      if (res.success && Array.isArray(res.data)) {
        setDnssec(res.data);
      } else {
        setDnssec([]);
      }
    } catch (err) {
      console.error(err);
      setDnssec([]);
    } finally {
      setDnssecLoading(false);
    }
  };

  const handleAddDnssec = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/domains/${id}/dnssec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dnssecForm)
      });
      if (res.success) {
        showNotification('Record DNSSEC berhasil ditambahkan.', 'success');
        setDnssecForm({ keyTag: '', algorithm: '13', digestType: '2', digest: '' });
        fetchDnssec();
      } else {
        showNotification(res.message || 'Gagal menambahkan record DNSSEC.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menambahkan record DNSSEC.', 'error');
    }
  };

  const handleDeleteDnssec = async (dsId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus record DNSSEC ini?')) return;
    try {
      const res = await apiFetch(`/api/domains/${id}/dnssec/${dsId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showNotification('Record DNSSEC berhasil dihapus.', 'success');
        fetchDnssec();
      } else {
        showNotification(res.message || 'Gagal menghapus record DNSSEC.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menghapus record DNSSEC.', 'error');
    }
  };

  // WHOIS logic
  const fetchWhois = async () => {
    setWhoisLoading(true);
    try {
      const res = await apiFetch(`/api/domains/${id}/whois`);
      if (res.success && res.data) {
        if (typeof res.data === 'object' && !res.data.raw) {
          setParsedWhois(res.data);
        } else {
          setParsedWhois(null);
        }
        let output = res.data.raw;
        if (!output) {
          output = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data;
        }
        setRawWhois(output || 'No WHOIS data found.');
      } else {
        setParsedWhois(null);
        setRawWhois('Gagal mengambil data WHOIS.');
      }
    } catch (err) {
      console.error(err);
      setRawWhois('Gagal mengambil data WHOIS.');
    } finally {
      setWhoisLoading(false);
    }
  };

  // Admin Suspend Action
  const handleSuspend = async () => {
    try {
      const res = await apiFetch(`/api/domains/${id}/suspended`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended: true, reason: suspendReason })
      });
      if (res.success) {
        showNotification('Domain berhasil disuspend.', 'success');
        setShowSuspendModal(false);
        loadDomainDetails();
      } else {
        showNotification(res.message || 'Gagal men-suspend domain.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal men-suspend domain.', 'error');
    }
  };

  const handleUnsuspend = async () => {
    try {
      const res = await apiFetch(`/api/domains/${id}/suspended`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended: false })
      });
      if (res.success) {
        showNotification('Domain berhasil diaktifkan kembali.', 'success');
        setShowUnsuspendModal(false);
        loadDomainDetails();
      } else {
        showNotification(res.message || 'Gagal mengaktifkan kembali domain.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal mengaktifkan kembali domain.', 'error');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Mengelola Domain">
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 font-bold gap-3">
          <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-sm">Memuat detail domain Anda...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!domain) {
    return (
      <DashboardLayout title="Domain Tidak Ditemukan">
        <div className="card text-center p-8 bg-white border-3 border-black shadow-[4px_4px_0_#000]">
          <h2 className="text-xl font-extrabold text-red-600 mb-2">Domain Tidak Ditemukan</h2>
          <p className="text-sm font-bold text-zinc-500 mb-6">
            Domain yang Anda cari tidak ada atau Anda tidak memiliki akses ke domain ini.
          </p>
          <button onClick={() => navigate('/dashboard/domains')} className="btn btn-primary font-black text-sm">
            Kembali ke Daftar Domain
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const domainNameStr = (domain.name || domain.domain_name || domain.domain || '-').toLowerCase();
  const isIdDomain = domainNameStr.endsWith('.id') || domain.required_document === 1;

  // Status computation
  const sc = domain.status;
  let badgeColor = 'bg-emerald-200';
  let statusText = 'active';
  if (sc === 0) {
    badgeColor = 'bg-amber-200';
    statusText = 'pending';
  } else if (sc === 2) {
    badgeColor = 'bg-rose-200';
    statusText = 'expired';
  } else if (sc === 3) {
    badgeColor = 'bg-rose-200';
    statusText = 'pend. delete';
  } else if (sc === 7) {
    badgeColor = 'bg-zinc-300';
    statusText = 'suspended';
  }

  // Verification status computation
  const verificationCode = domain.verification_status ?? 0;
  let verificationText = isIdDomain ? 'Menunggu Dokumen' : 'Menunggu Email';
  let verificationBadgeColor = 'bg-zinc-200';
  if (verificationCode === 1) {
    verificationText = 'Memverifikasi';
    verificationBadgeColor = 'bg-amber-100';
  } else if (verificationCode === 2) {
    verificationText = 'Validasi';
    verificationBadgeColor = 'bg-amber-100';
  } else if (verificationCode === 3) {
    verificationText = 'Aktif / Terverifikasi';
    verificationBadgeColor = 'bg-emerald-200';
  }

  return (
    <DashboardLayout title={`Kelola ${domainNameStr}`} activeMenu="domains">
      <div className="text-left">
        {/* Navigation / Back link */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/dashboard/domains')}
            className="flex items-center gap-2 text-zinc-500 font-bold hover:text-black transition bg-transparent border-none cursor-pointer text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Kembali ke Daftar Domain
          </button>
        </div>

        {/* Success/Error Alerts */}
        {successMsg && (
          <div className="alert alert-success mb-6 text-xs border-2 border-black rounded-sm bg-emerald-50">
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-error mb-6 text-xs border-2 border-black rounded-sm bg-rose-50">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Title Header Card */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-rose-600 font-mono tracking-wide">{domainNameStr}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-block px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase rounded-sm shadow-[1px_1px_0_#000] ${badgeColor}`}>
                {statusText}
              </span>
              {domain.expired_at && (
                <span className="text-[11px] font-bold text-zinc-500">
                  Kadaluarsa:{' '}
                  {new Date(domain.expired_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isAdmin && (
              sc === 7 ? (
                <button
                  onClick={() => setShowUnsuspendModal(true)}
                  className="btn bg-emerald-500 hover:bg-emerald-600 text-white border-black font-black text-xs py-2 shadow-sm"
                >
                  Unsuspend Domain
                </button>
              ) : (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  className="btn bg-rose-500 hover:bg-rose-600 text-white border-black font-black text-xs py-2 shadow-sm"
                >
                  Suspend Domain
                </button>
              )
            )}
            <button
              onClick={openRenew}
              className="btn btn-primary font-black text-xs py-2"
            >
              Renew Domain
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex flex-wrap gap-2 border-b-3 border-black pb-3 mb-6">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'dns', name: 'DNS Management' },
            { id: 'nameservers', name: 'Nameservers' },
            { id: 'hosts', name: 'Child Nameserver' },
            { id: 'forwarding', name: 'Forwarding' },
            { id: 'dnssec', name: 'DNSSEC' },
            { id: 'whois', name: 'Whois' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-2 border-black font-extrabold text-xs shadow-sm hover:translate-y-[-1px] transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-300 text-black shadow-[2px_2px_0_#000]'
                  : 'bg-white text-zinc-600 hover:text-black'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="tab-content text-xs">
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Domain Info */}
              <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6">
                <h3 className="text-base font-black border-b-2 border-black pb-3 mb-4">Informasi Domain</h3>
                <div className="flex flex-col gap-4 font-bold">
                  {/* Reg Date */}
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-200">
                    <span className="text-zinc-500">Tanggal Registrasi</span>
                    <span>
                      {domain.created_at
                        ? new Date(domain.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'}
                    </span>
                  </div>

                  {/* Expiry Date */}
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-200">
                    <span className="text-zinc-500">Tanggal Kadaluarsa</span>
                    <div className="flex items-center gap-2">
                      <span>
                        {domain.expired_at
                          ? new Date(domain.expired_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Theft Protection (Locked) */}
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-200">
                    <span className="text-zinc-500">Theft Protection (Lock)</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 border border-black font-extrabold uppercase text-[9px] ${isTheftProtected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {isTheftProtected ? 'LOCKED' : 'UNLOCKED'}
                      </span>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={isTheftProtected}
                          onChange={toggleTheftProtection}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Registrar Lock */}
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-200">
                    <span className="text-zinc-500">Registrar Lock</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 border border-black font-extrabold uppercase text-[9px] ${isRegistrarLocked ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {isRegistrarLocked ? 'LOCKED' : 'UNLOCKED'}
                      </span>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={isRegistrarLocked}
                          onChange={toggleRegistrarLock}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-200">
                    <span className="text-zinc-500">Verifikasi Domain</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 border border-black font-extrabold text-[9px] ${verificationBadgeColor}`}>
                        {verificationText}
                      </span>
                      {verificationCode !== 3 && (
                        isIdDomain ? (
                          <button
                            onClick={handleDocUpload}
                            className="px-2 py-1 border border-black bg-white hover:bg-zinc-50 rounded-sm font-extrabold text-[10px]"
                          >
                            Upload Dokumen
                          </button>
                        ) : (
                          <button
                            onClick={handleResendVerifyEmail}
                            className="px-2 py-1 border border-black bg-white hover:bg-zinc-50 rounded-sm font-extrabold text-[10px]"
                          >
                            Kirim Ulang Email
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Whois Protection (Only show for non-ID TLDs) */}
                  {!isIdDomain && (
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-200">
                      <span className="text-zinc-500">Whois Protection</span>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 border border-black font-extrabold uppercase text-[9px] ${isWhoisProtected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {isWhoisProtected ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {domain.whois_protected ? (
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={isWhoisProtected}
                              onChange={handleWhoisToggle}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        ) : (
                          <button
                            onClick={buyWhoisProtection}
                            className="px-2 py-1 border border-black bg-emerald-100 hover:bg-emerald-200 font-extrabold text-[10px]"
                          >
                            Beli Rp {whoisPrice.toLocaleString('id-ID')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Auth Code (EPP Code) */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-zinc-500">Auth / EPP Code</span>
                    <div className="flex items-center gap-2">
                      {isEditingAuthCode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editAuthCodeVal}
                            onChange={(e) => setEditAuthCodeVal(e.target.value)}
                            className="px-2 py-1 border-2 border-black rounded-sm outline-none bg-white font-mono"
                            placeholder="EPP Code baru"
                          />
                          <button
                            onClick={handleUpdateAuthCode}
                            className="px-2 py-1 border border-black bg-emerald-200 hover:bg-emerald-300 font-black rounded-sm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setIsEditingAuthCode(false)}
                            className="px-2 py-1 border border-black bg-rose-200 hover:bg-rose-300 font-black rounded-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-mono text-zinc-700 bg-zinc-100 px-2 py-0.5 border border-zinc-300 rounded-sm">
                            {showAuthCode ? authCodeVal : '••••••••••'}
                          </span>
                          <button
                            onClick={handleShowAuthCode}
                            disabled={authCodeLoading}
                            className="p-1.5 border border-black bg-white hover:bg-zinc-50 rounded-sm font-bold text-[10px]"
                            title="Tampilkan / Sembunyikan EPP Code"
                          >
                            {showAuthCode ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={handleRegenAuthCode}
                            disabled={authCodeLoading}
                            className="p-1.5 border border-black bg-cyan-200 hover:bg-cyan-300 rounded-sm font-bold text-[10px]"
                            title="Regenerasi EPP Code secara acak"
                          >
                            Regen
                          </button>
                          <button
                            onClick={() => {
                              setEditAuthCodeVal(authCodeVal);
                              setIsEditingAuthCode(true);
                            }}
                            className="p-1.5 border border-black bg-white hover:bg-zinc-50 rounded-sm font-bold text-[10px]"
                            title="Ubah EPP Code kustom"
                          >
                            Ubah
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Contacts info */}
              <div className="flex flex-col gap-6">
                {/* Admin, Registrant, Tech, Billing Contact Info Panels */}
                <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6">
                  <h3 className="text-base font-black border-b-2 border-black pb-3 mb-4">Informasi Kontak</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-bold text-[11px]">
                    {[
                      { role: 'registrant', name: 'Registrant' },
                      { role: 'admin', name: 'Admin Contact' },
                      { role: 'tech', name: 'Technical Contact' },
                      { role: 'billing', name: 'Billing Contact' },
                    ].map(item => {
                      const c = domain[`${item.role}_contact`];
                      return (
                        <div key={item.role} className="border-2 border-black rounded-sm p-3 bg-zinc-50 hover:bg-zinc-100 transition-all flex flex-col gap-1 shadow-sm">
                          <div className="flex justify-between items-center border-b border-zinc-200 pb-1.5 mb-1.5">
                            <span className="font-extrabold text-xs text-black">{item.name}</span>
                            <button
                              onClick={() => openEditContact(item.role as any)}
                              className="px-2 py-0.5 border border-black bg-white hover:bg-zinc-50 rounded-sm font-bold text-[10px]"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="flex justify-between"><span className="text-zinc-400">Nama:</span> <span className="text-zinc-800">{c?.name || '-'}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400">Orga:</span> <span className="text-zinc-800 truncate max-w-[100px]">{c?.organization || '-'}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400">Email:</span> <span className="text-zinc-800 truncate max-w-[100px]">{c?.email || '-'}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400">Telepon:</span> <span className="text-zinc-800">{c?.voice || '-'}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DNS TAB */}
          {activeTab === 'dns' && (
            <div className="flex flex-col gap-6">
              {/* Add DNS Record form */}
              <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 text-black">
                <h3 className="text-base font-black border-b-2 border-black pb-3 mb-4">Tambah Record DNS</h3>
                <form onSubmit={handleAddDns} className="flex flex-col sm:flex-row flex-wrap items-end gap-3 font-bold text-xs">
                  <div className="flex flex-col gap-1 w-full sm:flex-grow">
                    <label className="text-zinc-500">Host / Subdomain</label>
                    <input
                      type="text"
                      required
                      value={dnsForm.name}
                      onChange={(e) => setDnsForm(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold"
                      placeholder="www atau @ untuk root"
                    />
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:w-28">
                    <label className="text-zinc-500">Tipe Record</label>
                    <select
                      required
                      value={dnsForm.type}
                      onChange={(e) => setDnsForm(prev => ({ ...prev, type: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold"
                    >
                      <option value="A">A (IPv4)</option>
                      <option value="AAAA">AAAA (IPv6)</option>
                      <option value="CNAME">CNAME (Alias)</option>
                      <option value="MX">MX (Mail Server)</option>
                      <option value="TXT">TXT (Teks)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:flex-grow">
                    <label className="text-zinc-500">Value / Konten</label>
                    <input
                      type="text"
                      required
                      value={dnsForm.content}
                      onChange={(e) => setDnsForm(prev => ({ ...prev, content: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold"
                      placeholder="19.231.22.1 atau ghs.google.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:w-20">
                    <label className="text-zinc-500">TTL</label>
                    <input
                      type="number"
                      required
                      min={60}
                      value={dnsForm.ttl}
                      onChange={(e) => setDnsForm(prev => ({ ...prev, ttl: Number(e.target.value) }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary py-2 px-6 font-black h-10 w-full sm:w-auto">
                    Tambah Record
                  </button>
                </form>
              </div>

              {/* Records List */}
              <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden">
                <div className="p-4 border-b-2 border-black bg-zinc-50">
                  <h3 className="text-sm font-black text-black">Active DNS Records</h3>
                </div>

                {dnsLoading ? (
                  <div className="flex justify-center items-center py-10 text-zinc-500 font-bold">
                    <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mr-2"></div>
                    Memuat DNS Records...
                  </div>
                ) : dnsRecords.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 font-bold">
                    Tidak ada DNS Record yang terkonfigurasi.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left font-bold text-black">
                      <thead>
                        <tr className="bg-zinc-100 border-b-2 border-black">
                          <th className="p-3 border-r border-black">Host</th>
                          <th className="p-3 border-r border-black">Tipe</th>
                          <th className="p-3 border-r border-black">Value / Content</th>
                          <th className="p-3 border-r border-black">TTL</th>
                          <th className="p-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dnsRecords.map((r, idx) => (
                          <tr key={idx} className="border-b border-black hover:bg-zinc-50 text-[11px]">
                            <td className="p-3 border-r border-black font-mono">{r.name}</td>
                            <td className="p-3 border-r border-black">
                              <span className="px-1.5 py-0.2 border border-black rounded-sm font-extrabold text-[10px] bg-cyan-100">
                                {r.type}
                              </span>
                            </td>
                            <td className="p-3 border-r border-black font-mono break-all max-w-xs">{r.content}</td>
                            <td className="p-3 border-r border-black font-mono">{r.ttl}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleDeleteDns(r)}
                                className="px-2 py-0.5 border border-black bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-sm font-bold"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NAMESERVERS TAB */}
          {activeTab === 'nameservers' && (
            <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 text-black">
              <h3 className="text-base font-black border-b-2 border-black pb-3 mb-4">Konfigurasi Nameserver</h3>

              {isEditingNs ? (
                <form onSubmit={handleNsSave} className="flex flex-col gap-4 max-w-md font-bold">
                  <div className="flex flex-col gap-1">
                    <label>Nameserver 1</label>
                    <input
                      type="text"
                      required
                      value={nsForm.ns1}
                      onChange={(e) => setNsForm(prev => ({ ...prev, ns1: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-mono"
                      placeholder="ns1.example.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label>Nameserver 2</label>
                    <input
                      type="text"
                      required
                      value={nsForm.ns2}
                      onChange={(e) => setNsForm(prev => ({ ...prev, ns2: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-mono"
                      placeholder="ns2.example.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label>Nameserver 3</label>
                    <input
                      type="text"
                      value={nsForm.ns3}
                      onChange={(e) => setNsForm(prev => ({ ...prev, ns3: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-mono"
                      placeholder="ns3.example.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label>Nameserver 4</label>
                    <input
                      type="text"
                      value={nsForm.ns4}
                      onChange={(e) => setNsForm(prev => ({ ...prev, ns4: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-mono"
                      placeholder="ns4.example.com"
                    />
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button type="submit" disabled={nsSaving} className="btn btn-primary font-black py-2 px-6">
                      {nsSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingNs(false)}
                      className="btn btn-outline py-2 px-6 bg-white font-bold"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4 max-w-md font-bold">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center py-2 border-b border-zinc-150">
                      <span className="text-zinc-400">NS 1:</span>
                      <span className="font-mono">{nsForm.ns1 || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-150">
                      <span className="text-zinc-400">NS 2:</span>
                      <span className="font-mono">{nsForm.ns2 || '-'}</span>
                    </div>
                    {nsForm.ns3 && (
                      <div className="flex justify-between items-center py-2 border-b border-zinc-150">
                        <span className="text-zinc-400">NS 3:</span>
                        <span className="font-mono">{nsForm.ns3}</span>
                      </div>
                    )}
                    {nsForm.ns4 && (
                      <div className="flex justify-between items-center py-2 border-b border-zinc-150">
                        <span className="text-zinc-400">NS 4:</span>
                        <span className="font-mono">{nsForm.ns4}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setIsEditingNs(true)}
                    className="btn btn-outline py-2 px-6 bg-white font-black mt-2 self-start"
                  >
                    Edit Nameservers
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CHILD NAMESERVERS TAB */}
          {activeTab === 'hosts' && (
            <div className="flex flex-col gap-6">
              {/* Register host form */}
              <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 text-black">
                <h3 className="text-base font-black border-b-2 border-black pb-3 mb-4">Daftarkan Child Nameserver (Host)</h3>
                <form onSubmit={handleAddHost} className="flex flex-col sm:flex-row items-end gap-3 font-bold">
                  <div className="flex flex-col gap-1 flex-grow">
                    <label className="text-zinc-500">Nama Host / Subdomain</label>
                    <div className="flex items-center border-2 border-black bg-white rounded-sm">
                      <input
                        type="text"
                        required
                        value={hostForm.name}
                        onChange={(e) => setHostForm(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 border-none outline-none flex-grow font-bold bg-transparent text-black"
                        placeholder="ns1"
                      />
                      <span className="px-2 text-zinc-500 border-l border-zinc-300 font-mono">
                        .{domainNameStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:w-60">
                    <label className="text-zinc-500">IP Address (IPv4 / IPv6)</label>
                    <input
                      type="text"
                      required
                      value={hostForm.ip}
                      onChange={(e) => setHostForm(prev => ({ ...prev, ip: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold"
                      placeholder="192.168.1.1"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary py-2 px-6 font-black h-10 w-full sm:w-auto">
                    Daftarkan Host
                  </button>
                </form>
              </div>

              {/* Registered Hosts List */}
              <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden">
                <div className="p-4 border-b-2 border-black bg-zinc-50">
                  <h3 className="text-sm font-black text-black">Registered Hosts</h3>
                </div>

                {hostsLoading ? (
                  <div className="flex justify-center items-center py-10 text-zinc-500 font-bold">
                    <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mr-2"></div>
                    Memuat child nameservers...
                  </div>
                ) : hosts.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 font-bold">
                    Tidak ada child nameserver yang terdaftar.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left font-bold text-black">
                      <thead>
                        <tr className="bg-zinc-100 border-b-2 border-black">
                          <th className="p-3 border-r border-black">Nama Host</th>
                          <th className="p-3 border-r border-black">IP Address</th>
                          <th className="p-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hosts.map((h, idx) => (
                          <tr key={idx} className="border-b border-black hover:bg-zinc-50 text-[11px]">
                            <td className="p-3 border-r border-black font-mono">{h.name || h.hostname}</td>
                            <td className="p-3 border-r border-black font-mono">{h.ip || h.ip_address || h.ips?.join(', ')}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleDeleteHost(h.id || h.name || h.hostname)}
                                className="px-2 py-0.5 border border-black bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-sm font-bold"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FORWARDING TAB */}
          {activeTab === 'forwarding' && (
            <div className="flex flex-col gap-6 text-black">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h3 className="text-base font-black">Domain Forwarding</h3>
                  <p className="text-zinc-500 text-[11px] font-bold">
                    Alihkan pengunjung domain Anda ke alamat URL web lain secara otomatis.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForwardRow(!showAddForwardRow)}
                  className="btn btn-outline py-1.5 px-4 font-black bg-white flex items-center gap-1"
                >
                  {showAddForwardRow ? 'Batal' : '+ Add Forward'}
                </button>
              </div>

              {/* Add form inline row */}
              {showAddForwardRow && (
                <div className="card bg-amber-50 border-3 border-black shadow-[4px_4px_0_#000] p-6">
                  <form onSubmit={handleAddForward} className="flex flex-col sm:flex-row items-end gap-3 font-bold">
                    <div className="flex flex-col gap-1 flex-grow">
                      <label className="text-zinc-500">Your Domain Subdomain</label>
                      <div className="flex items-center border-2 border-black bg-white rounded-sm">
                        <span className="px-2 text-zinc-500 font-mono">@</span>
                        <input
                          type="text"
                          value={forwardForm.from}
                          onChange={(e) => setForwardForm(prev => ({ ...prev, from: e.target.value }))}
                          className="px-2 py-2 border-none outline-none flex-grow font-bold bg-transparent text-black"
                          placeholder="misal: blog"
                        />
                        <span className="px-2 text-zinc-500 border-l border-zinc-300 font-mono">
                          .{domainNameStr}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 flex-grow">
                      <label className="text-zinc-500">Forward To URL</label>
                      <input
                        type="url"
                        required
                        value={forwardForm.to}
                        onChange={(e) => setForwardForm(prev => ({ ...prev, to: e.target.value }))}
                        className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold"
                        placeholder="https://instasaya.com/profile"
                      />
                    </div>

                    <button type="submit" className="btn btn-primary py-2 px-6 font-black h-10 w-full sm:w-auto">
                      Simpan
                    </button>
                  </form>
                </div>
              )}

              {/* Forwarding Table List */}
              <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden">
                {forwardingLoading ? (
                  <div className="flex justify-center items-center py-10 text-zinc-500 font-bold">
                    <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mr-2"></div>
                    Memuat data forwarding...
                  </div>
                ) : forwarding.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 font-bold">
                    Belum ada pengalihan domain forwarding yang aktif.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left font-bold text-black">
                      <thead>
                        <tr className="bg-zinc-100 border-b-2 border-black">
                          <th className="p-3 border-r border-black">Your Domain Source</th>
                          <th className="p-3 border-r border-black">Forward Target</th>
                          <th className="p-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forwarding.map((f: any, idx: number) => (
                          <tr key={idx} className="border-b border-black hover:bg-zinc-50 text-[11px]">
                            <td className="p-3 border-r border-black font-mono">
                              {f.from || f.source || `@.${domainNameStr}`}
                            </td>
                            <td className="p-3 border-r border-black font-mono break-all">{f.to || f.target}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleDeleteForward(f.id || f.from || f.source)}
                                className="px-2 py-0.5 border border-black bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-sm font-bold"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DNSSEC TAB */}
          {activeTab === 'dnssec' && (
            <div className="flex flex-col gap-6">
              {/* Add DS record form */}
              <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 text-black">
                <h3 className="text-base font-black border-b-2 border-black pb-3 mb-4">Tambah Record DNSSEC (DS)</h3>
                <form onSubmit={handleAddDnssec} className="flex flex-col sm:flex-row flex-wrap items-end gap-3 font-bold">
                  <div className="flex flex-col gap-1 w-full sm:w-28">
                    <label className="text-zinc-500">Key Tag</label>
                    <input
                      type="number"
                      required
                      value={dnssecForm.keyTag}
                      onChange={(e) => setDnssecForm(prev => ({ ...prev, keyTag: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold"
                      placeholder="12345"
                    />
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:flex-grow">
                    <label className="text-zinc-500">Algoritma</label>
                    <select
                      required
                      value={dnssecForm.algorithm}
                      onChange={(e) => setDnssecForm(prev => ({ ...prev, algorithm: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold"
                    >
                      <option value="5">RSASHA1 (5)</option>
                      <option value="7">RSASHA1-NSEC3-SHA1 (7)</option>
                      <option value="8">RSASHA256 (8)</option>
                      <option value="10">RSASHA512 (10)</option>
                      <option value="13">ECDSAP256SHA256 (13)</option>
                      <option value="14">ECDSAP384SHA384 (14)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:flex-grow">
                    <label className="text-zinc-500">Tipe Digest</label>
                    <select
                      required
                      value={dnssecForm.digestType}
                      onChange={(e) => setDnssecForm(prev => ({ ...prev, digestType: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold"
                    >
                      <option value="1">SHA-1 (1)</option>
                      <option value="2">SHA-256 (2)</option>
                      <option value="3">GOST R 34.11-94 (3)</option>
                      <option value="4">SHA-384 (4)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 w-full sm:flex-grow-[2]">
                    <label className="text-zinc-500">Digest (Hex Key)</label>
                    <input
                      type="text"
                      required
                      value={dnssecForm.digest}
                      onChange={(e) => setDnssecForm(prev => ({ ...prev, digest: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black outline-none w-full font-bold font-mono"
                      placeholder="Hex string signature key"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary py-2 px-6 font-black h-10 w-full sm:w-auto">
                    Tambah
                  </button>
                </form>
              </div>

              {/* DNSSEC DS Records List */}
              <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden">
                <div className="p-4 border-b-2 border-black bg-zinc-50">
                  <h3 className="text-sm font-black text-black">Active DNSSEC Records</h3>
                </div>

                {dnssecLoading ? (
                  <div className="flex justify-center items-center py-10 text-zinc-500 font-bold">
                    <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mr-2"></div>
                    Memuat data DNSSEC...
                  </div>
                ) : dnssec.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 font-bold">
                    Tidak ada konfigurasi DNSSEC yang aktif pada domain ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left font-bold text-black">
                      <thead>
                        <tr className="bg-zinc-100 border-b-2 border-black">
                          <th className="p-3 border-r border-black">Key Tag</th>
                          <th className="p-3 border-r border-black">Algoritma</th>
                          <th className="p-3 border-r border-black">Tipe Digest</th>
                          <th className="p-3 border-r border-black">Digest</th>
                          <th className="p-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dnssec.map((ds: any, idx: number) => (
                          <tr key={idx} className="border-b border-black hover:bg-zinc-50 text-[11px]">
                            <td className="p-3 border-r border-black font-mono">{ds.key_tag || ds.keyTag}</td>
                            <td className="p-3 border-r border-black font-mono">{ds.algorithm}</td>
                            <td className="p-3 border-r border-black font-mono">{ds.digest_type || ds.digestType}</td>
                            <td className="p-3 border-r border-black font-mono break-all max-w-xs">{ds.digest}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleDeleteDnssec(ds.id || ds.key_tag || ds.keyTag)}
                                className="px-2 py-0.5 border border-black bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-sm font-bold"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WHOIS TAB */}
          {activeTab === 'whois' && (
            <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 text-black flex flex-col gap-4">
              <div className="flex justify-between items-center border-b-2 border-black pb-3">
                <h3 className="text-base font-black">Raw WHOIS Information</h3>
                <button
                  onClick={fetchWhois}
                  disabled={whoisLoading}
                  className="btn btn-outline py-1.5 px-4 font-black bg-white flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  {whoisLoading ? 'Memuat...' : 'Refresh'}
                </button>
              </div>

              {whoisLoading ? (
                <div className="flex justify-center items-center py-12 text-zinc-500 font-bold">
                  <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mr-2"></div>
                  Mengambil data WHOIS langsung dari server registry...
                </div>
              ) : (
                <>
                  {parsedWhois && (
                    <div className="border-3 border-black overflow-hidden mb-6">
                      <table className="w-full border-collapse text-left text-xs font-bold text-black">
                        <tbody>
                          <tr className="border-b border-black">
                            <td className="p-3 border-r border-black w-1/3 bg-zinc-100">Nama Domain</td>
                            <td className="p-3 font-extrabold text-sm">{parsedWhois.name || domain.domain}</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-3 border-r border-black w-1/3 bg-zinc-100">Status Ketersediaan</td>
                            <td className="p-3">
                              <span className={`inline-block px-2.5 py-0.5 border border-black text-[10px] font-black uppercase rounded-sm ${parsedWhois.available === 1 ? 'bg-emerald-200' : 'bg-rose-200'}`}>
                                {parsedWhois.available === 1 ? 'Tersedia' : 'Terdaftar'}
                              </span>
                            </td>
                          </tr>
                          {parsedWhois.registrar && (
                            <tr className="border-b border-black">
                              <td className="p-3 border-r border-black w-1/3 bg-zinc-100">Registrar</td>
                              <td className="p-3 font-extrabold">{parsedWhois.registrar}</td>
                            </tr>
                          )}
                          {parsedWhois.domain_id && (
                            <tr className="border-b border-black">
                              <td className="p-3 border-r border-black w-1/3 bg-zinc-100">Registry Domain ID</td>
                              <td className="p-3 font-mono text-zinc-500">{parsedWhois.domain_id}</td>
                            </tr>
                          )}
                          {parsedWhois.status && (
                            <tr className="border-b border-black">
                              <td className="p-3 border-r border-black w-1/3 bg-zinc-100">Status Domain (EPP)</td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {(Array.isArray(parsedWhois.status) ? parsedWhois.status : [parsedWhois.status]).map((st: string) => (
                                    <span key={st} className="font-mono text-[10px] bg-white border border-zinc-300 px-1.5 py-0.5 rounded-sm">
                                      {st}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                          {parsedWhois.nameserver && (
                            <tr className="border-b border-black">
                              <td className="p-3 border-r border-black w-1/3 bg-zinc-100">Nameservers</td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  {(Array.isArray(parsedWhois.nameserver) ? parsedWhois.nameserver : [parsedWhois.nameserver]).map((ns: string) => (
                                    <div key={ns} className="font-mono text-zinc-600 font-bold">{ns}</div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                          {parsedWhois.created_at && (
                            <tr className="border-b border-black">
                              <td className="p-3 border-r border-black w-1/3 bg-zinc-100">Tanggal Terdaftar</td>
                              <td className="p-3 text-zinc-500">{parsedWhois.created_at}</td>
                            </tr>
                          )}
                          {parsedWhois.updated_at && (
                            <tr className="border-b border-black">
                              <td className="p-3 border-r border-black w-1/3 bg-zinc-100">Terakhir Diperbarui</td>
                              <td className="p-3 text-zinc-500">{parsedWhois.updated_at}</td>
                            </tr>
                          )}
                          {parsedWhois.expired_at && (
                            <tr>
                              <td className="p-3 border-r border-black w-1/3 bg-zinc-100">Tanggal Kedaluwarsa</td>
                              <td className="p-3 text-rose-600">{parsedWhois.expired_at}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <pre className="bg-zinc-900 text-zinc-100 p-5 rounded-sm font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner max-h-[500px]">
                    {rawWhois}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── MODALS ── */}

        {/* 1. Edit Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowContactModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative card border-3 border-black bg-white shadow-[8px_8px_0_#000] max-w-lg w-full overflow-hidden text-left p-0! z-10">
              <div className="flex justify-between items-center p-5 border-b-3 border-black bg-amber-100">
                <h3 className="font-extrabold text-sm">Edit Kontak: <span className="capitalize">{editRole}</span></h3>
                <button onClick={() => setShowContactModal(false)} className="w-7 h-7 border-2 border-black bg-white hover:bg-zinc-100 flex items-center justify-center rounded-sm font-bold">✕</button>
              </div>
              <form onSubmit={handleContactSave}>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto font-bold text-xs">
                  <div className="flex flex-col gap-1">
                    <label>Nama Lengkap</label>
                    <input
                      type="text" required
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label>Organisasi / Perusahaan</label>
                    <input
                      type="text"
                      value={contactForm.organization}
                      onChange={(e) => setContactForm(prev => ({ ...prev, organization: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label>Email</label>
                    <input
                      type="email" required
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label>No. Telepon / Voice</label>
                    <input
                      type="text" required
                      value={contactForm.voice}
                      onChange={(e) => setContactForm(prev => ({ ...prev, voice: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                      placeholder="+62.8123456789"
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label>Alamat Jalan</label>
                    <input
                      type="text" required
                      value={contactForm.street_1}
                      onChange={(e) => setContactForm(prev => ({ ...prev, street_1: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label>Kota</label>
                    <input
                      type="text" required
                      value={contactForm.city}
                      onChange={(e) => setContactForm(prev => ({ ...prev, city: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label>Provinsi</label>
                    <input
                      type="text" required
                      value={contactForm.state}
                      onChange={(e) => setContactForm(prev => ({ ...prev, state: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label>Kode Pos</label>
                    <input
                      type="text" required
                      value={contactForm.postal_code}
                      onChange={(e) => setContactForm(prev => ({ ...prev, postal_code: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label>Kode Negara (2 huruf)</label>
                    <input
                      type="text" required maxLength={2}
                      value={contactForm.country_code}
                      onChange={(e) => setContactForm(prev => ({ ...prev, country_code: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold font-mono"
                      placeholder="ID"
                    />
                  </div>
                </div>
                <div className="p-5 border-t-2 border-black flex justify-end gap-2 bg-zinc-50">
                  <button type="submit" className="btn btn-primary font-black text-xs py-2 px-6">Simpan Perubahan</button>
                  <button type="button" onClick={() => setShowContactModal(false)} className="btn btn-outline bg-white font-bold text-xs py-2 px-6">Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Renew Domain Modal */}
        {showRenewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowRenewModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative card border-3 border-black bg-white shadow-[8px_8px_0_#000] max-w-sm w-full overflow-hidden text-left p-0! z-10">
              <div className="flex justify-between items-center p-5 border-b-3 border-black bg-amber-100">
                <h3 className="font-extrabold text-sm">Perpanjang Domain</h3>
                <button onClick={() => setShowRenewModal(false)} className="w-7 h-7 border-2 border-black bg-white hover:bg-zinc-100 flex items-center justify-center rounded-sm font-bold">✕</button>
              </div>
              <form onSubmit={handleRenewSubmit}>
                <div className="p-5 flex flex-col gap-4 font-bold text-xs text-black">
                  <div className="flex flex-col gap-1">
                    <label>Durasi Perpanjangan</label>
                    <select
                      value={renewYears}
                      onChange={(e) => setRenewYears(Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-bold"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                        <option key={y} value={y}>{y} Tahun</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 border-2 border-black bg-zinc-50 flex justify-between items-center rounded-sm">
                    <span className="text-zinc-500">Estimasi Biaya:</span>
                    <span className="text-sm font-black text-rose-600">
                      {renewPriceLoading ? 'Menghitung...' : `Rp ${renewPrice.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
                <div className="p-5 border-t-2 border-black flex justify-end gap-2 bg-zinc-50">
                  <button type="submit" disabled={renewPriceLoading} className="btn btn-primary font-black text-xs py-2 px-6">Ajukan Perpanjangan</button>
                  <button type="button" onClick={() => setShowRenewModal(false)} className="btn btn-outline bg-white font-bold text-xs py-2 px-6">Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Admin Suspend Modal */}
        {showSuspendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowSuspendModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative card border-3 border-black bg-white shadow-[8px_8px_0_#000] max-w-sm w-full overflow-hidden text-left p-0! z-10">
              <div className="flex justify-between items-center p-5 border-b-3 border-black bg-rose-100 text-rose-800">
                <h3 className="font-extrabold text-sm">Suspend Domain</h3>
                <button onClick={() => setShowSuspendModal(false)} className="w-7 h-7 border-2 border-black bg-white hover:bg-zinc-100 flex items-center justify-center rounded-sm font-bold">✕</button>
              </div>
              <div className="p-5 flex flex-col gap-4 font-bold text-xs text-black">
                <div className="flex flex-col gap-1">
                  <label>Alasan Suspend</label>
                  <textarea
                    required
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-bold min-h-[80px]"
                    placeholder="misal: Melanggar Kebijakan Konten Pornografi / Phishing"
                  />
                </div>
              </div>
              <div className="p-5 border-t-2 border-black flex justify-end gap-2 bg-zinc-50">
                <button onClick={handleSuspend} className="btn bg-rose-500 hover:bg-rose-600 text-white border-black font-black text-xs py-2 px-6">Suspend</button>
                <button type="button" onClick={() => setShowSuspendModal(false)} className="btn btn-outline bg-white font-bold text-xs py-2 px-6">Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Admin Unsuspend Modal */}
        {showUnsuspendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowUnsuspendModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative card border-3 border-black bg-white shadow-[8px_8px_0_#000] max-w-sm w-full overflow-hidden text-left p-0! z-10">
              <div className="flex justify-between items-center p-5 border-b-3 border-black bg-emerald-100 text-emerald-800">
                <h3 className="font-extrabold text-sm">Aktifkan Kembali Domain</h3>
                <button onClick={() => setShowUnsuspendModal(false)} className="w-7 h-7 border-2 border-black bg-white hover:bg-zinc-100 flex items-center justify-center rounded-sm font-bold">✕</button>
              </div>
              <div className="p-5 font-bold text-xs text-black">
                Apakah Anda yakin ingin mengaktifkan kembali domain <strong>{domainNameStr}</strong>?
              </div>
              <div className="p-5 border-t-2 border-black flex justify-end gap-2 bg-zinc-50">
                <button onClick={handleUnsuspend} className="btn bg-emerald-500 hover:bg-emerald-600 text-white border-black font-black text-xs py-2 px-6">Aktifkan</button>
                <button type="button" onClick={() => setShowUnsuspendModal(false)} className="btn btn-outline bg-white font-bold text-xs py-2 px-6">Batal</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
