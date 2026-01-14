import { Coupon } from '../types';

/**
 * Your live Cloudflare Worker endpoint.
 */
const API_BASE = 'https://opencoupon-worker.beobhan.workers.dev';

export interface StoreDataResponse {
  coupons: Coupon[];
  referral: string | null;
}

export const getStoreData = async (domain: string): Promise<StoreDataResponse> => {
  try {
    const resp = await fetch(`${API_BASE}/store-data?domain=${domain}`);
    if (!resp.ok) {
      throw new Error(`D1 API responded with ${resp.status}`);
    }
    return await resp.json();
  } catch (e) {
    console.error(`D1 API unreachable for domain: ${domain}`, e);
    return { coupons: [], referral: null };
  }
};

export const saveCoupon = async (coupon: { store: string; code: string; description: string }): Promise<void> => {
  try {
    const resp = await fetch(`${API_BASE}/add-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coupon),
    });
    if (!resp.ok) throw new Error(`Failed to save coupon: ${resp.status}`);
  } catch (e) {
    console.error('Failed to save coupon to D1:', e);
    throw e;
  }
};

/**
 * Sends a vote or un-vote action to the server.
 * Allowed types: 'up', 'down', 'remove_up', 'remove_down'
 */
export const voteCoupon = async (
  id: string, 
  type: 'up' | 'down' | 'remove_up' | 'remove_down'
): Promise<void> => {
  try {
    const resp = await fetch(`${API_BASE}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type }),
    });
    if (!resp.ok) throw new Error(`Failed to vote: ${resp.status}`);
  } catch (e) {
    console.error('Failed to submit vote to API:', e);
  }
};

export const getMissingReferrals = async (): Promise<{ store: string }[]> => {
  try {
    const resp = await fetch(`${API_BASE}/missing-referrals`);
    if (!resp.ok) throw new Error(`API Error: ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.error('Failed to fetch missing referrals from D1:', e);
    return [];
  }
};