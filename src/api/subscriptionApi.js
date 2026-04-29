import { base44 } from '@/api/base44Client';
import { getFirebaseAuth } from '@/lib/firebase';

function getFunctionsBaseUrl() {
  return (import.meta.env.VITE_FIREBASE_FUNCTIONS_BASE_URL || '').trim().replace(/\/+$/, '');
}

function allowBase44Fallback() {
  const raw = String(import.meta.env.VITE_SUBSCRIPTION_BASE44_FALLBACK || 'true').toLowerCase();
  return raw !== 'false' && raw !== '0';
}

async function getAuthHeader() {
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error('Usuário não autenticado no Firebase.');
  const token = await currentUser.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function callFirebaseFunction(path, payload, method = 'POST') {
  const baseUrl = getFunctionsBaseUrl();
  if (!baseUrl) throw new Error('VITE_FIREBASE_FUNCTIONS_BASE_URL não configurada.');
  const headers = await getAuthHeader();
  const res = await fetch(`${baseUrl}/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: method === 'GET' ? undefined : JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
  return data;
}

export async function createSubscriptionBilling(payload) {
  try {
    return await callFirebaseFunction('createAbacatepayBilling', payload);
  } catch (err) {
    if (!allowBase44Fallback()) throw err;
    const res = await base44.functions.invoke('createAbacatepayBilling', payload);
    return res?.data || {};
  }
}

export async function getMySubscription() {
  try {
    return await callFirebaseFunction('getMySubscription', {}, 'POST');
  } catch (err) {
    if (!allowBase44Fallback()) throw err;
    const res = await base44.functions.invoke('getMySubscription', {});
    return res?.data || { subscription: null, isActive: false };
  }
}

export async function cancelSubscription(payload) {
  try {
    return await callFirebaseFunction('cancelSubscription', payload);
  } catch (err) {
    if (!allowBase44Fallback()) throw err;
    const res = await base44.functions.invoke('cancelSubscription', payload);
    return res?.data || { ok: false };
  }
}
