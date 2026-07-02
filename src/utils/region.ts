import { apiFetch } from './api';

/**
 * Utility helper to fetch Indonesian administrative regions from local backend proxy
 */

export interface RegionItem {
  id: string;
  name: string;
}

export async function fetchProvinces(): Promise<RegionItem[]> {
  try {
    return await apiFetch('/api/auth/regions/provinces', { requireAuth: false });
  } catch (err) {
    throw new Error('Gagal mengambil data provinsi', { cause: err });
  }
}

export async function fetchRegencies(provinceId: string): Promise<RegionItem[]> {
  try {
    return await apiFetch(`/api/auth/regions/regencies/${provinceId}`, { requireAuth: false });
  } catch (err) {
    throw new Error('Gagal mengambil data kabupaten/kota', { cause: err });
  }
}

export async function fetchDistricts(regencyId: string): Promise<RegionItem[]> {
  try {
    return await apiFetch(`/api/auth/regions/districts/${regencyId}`, { requireAuth: false });
  } catch (err) {
    throw new Error('Gagal mengambil data kecamatan', { cause: err });
  }
}

export async function fetchVillages(districtId: string): Promise<RegionItem[]> {
  try {
    return await apiFetch(`/api/auth/regions/villages/${districtId}`, { requireAuth: false });
  } catch (err) {
    throw new Error('Gagal mengambil data kelurahan', { cause: err });
  }
}
