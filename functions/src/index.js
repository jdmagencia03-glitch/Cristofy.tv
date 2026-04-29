const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3';
const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

const PLANS = {
  mensal: { name: 'CristoFy Mensal', amountCents: 990 },
  premium: { name: 'CristoFy Plano Intermediário', amountCents: 1990 },
  anual: { name: 'CristoFy Anual', amountCents: 9990 },
};

function jsonResponse(res, status, payload) {
  res.status(status).json(payload);
}

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, asaas-access-token');
  res.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
}

async function requireUser(req) {
  const authHeader = req.headers.authorization || '';
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    return await admin.auth().verifyIdToken(m[1]);
  } catch {
    return null;
  }
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

function getDueDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

async function asaasRequest(path, method = 'GET', body) {
  if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada.');
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      access_token: ASAAS_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error('Falha na API Asaas');
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

async function getLatestSubscription(user) {
  const byUid = await db
    .collection('subscriptions')
    .where('user_uid', '==', user.uid)
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();
  if (!byUid.empty) return byUid.docs[0];

  const byEmail = await db
    .collection('subscriptions')
    .where('user_email', '==', user.email || '')
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();
  if (!byEmail.empty) return byEmail.docs[0];
  return null;
}

exports.createAbacatepayBilling = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return jsonResponse(res, 401, { error: 'Unauthorized' });

  const { plan, payment_method, customer } = req.body || {};
  if (!PLANS[plan]) return jsonResponse(res, 400, { error: 'Plano inválido' });

  const cpfCnpj = onlyDigits(customer?.cpf || '');
  if (cpfCnpj.length < 11) return jsonResponse(res, 400, { error: 'CPF inválido' });

  try {
    const customerData = await asaasRequest('/customers', 'POST', {
      name: customer?.name || user.name || user.email,
      email: user.email,
      cpfCnpj,
      mobilePhone: onlyDigits(customer?.phone || ''),
      externalReference: user.uid || user.email,
    });

    const billingType = payment_method === 'pix' ? 'PIX' : 'UNDEFINED';
    const planInfo = PLANS[plan];
    const paymentData = await asaasRequest('/payments', 'POST', {
      customer: customerData.id,
      billingType,
      value: planInfo.amountCents / 100,
      dueDate: getDueDate(1),
      description: `Assinatura ${planInfo.name}`,
      externalReference: `${user.email}:${plan}:${Date.now()}`,
    });

    let pixQrCode = null;
    let pixCopyPaste = null;
    if (payment_method === 'pix') {
      try {
        const pixData = await asaasRequest(`/payments/${paymentData.id}/pixQrCode`);
        pixQrCode = pixData.encodedImage || null;
        pixCopyPaste = pixData.payload || null;
      } catch {
        // fallback para invoiceUrl
      }
    }

    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === 'anual') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    await db.collection('subscriptions').add({
      user_uid: user.uid,
      user_email: user.email || '',
      plan,
      status: 'pending',
      payment_method,
      asaas_payment_id: paymentData.id,
      asaas_customer_id: customerData.id,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      pix_qr_code: pixQrCode || null,
      pix_copy_paste: pixCopyPaste || null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return jsonResponse(res, 200, {
      billing_url: paymentData.invoiceUrl || null,
      billing_id: paymentData.id,
      customer_id: customerData.id,
      pix_qr_code: pixQrCode,
      pix_copy_paste: pixCopyPaste,
    });
  } catch (err) {
    return jsonResponse(res, 500, {
      error: 'Erro ao criar cobrança no Asaas',
      details: err?.data || String(err),
    });
  }
});

exports.getMySubscription = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST' && req.method !== 'GET') return jsonResponse(res, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return jsonResponse(res, 401, { error: 'Unauthorized' });

  const docSnap = await getLatestSubscription(user);
  if (!docSnap) return jsonResponse(res, 200, { subscription: null, isActive: false });

  const subscription = { id: docSnap.id, ...docSnap.data() };
  const isActive = subscription.status === 'active' && new Date(subscription.expires_at || 0).getTime() > Date.now();
  return jsonResponse(res, 200, { subscription, isActive });
});

exports.cancelSubscription = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Method not allowed' });

  const user = await requireUser(req);
  if (!user) return jsonResponse(res, 401, { error: 'Unauthorized' });

  const { subscription_id } = req.body || {};
  if (!subscription_id) return jsonResponse(res, 400, { error: 'subscription_id é obrigatório' });

  const subRef = db.collection('subscriptions').doc(subscription_id);
  const subSnap = await subRef.get();
  if (!subSnap.exists) return jsonResponse(res, 404, { error: 'Assinatura não encontrada' });

  const sub = subSnap.data();
  if (sub.user_uid !== user.uid && sub.user_email !== (user.email || '')) {
    return jsonResponse(res, 403, { error: 'Acesso negado' });
  }

  if (sub.asaas_payment_id && ASAAS_API_KEY) {
    try {
      await asaasRequest(`/payments/${sub.asaas_payment_id}`, 'DELETE');
    } catch {
      // mantém cancelamento local mesmo com falha remota
    }
  }

  await subRef.update({
    status: 'cancelled',
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return jsonResponse(res, 200, { ok: true });
});

exports.handleAbacatepayWebhook = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Method not allowed' });

  if (ASAAS_WEBHOOK_TOKEN) {
    const incoming = req.headers['asaas-access-token'];
    if (!incoming || incoming !== ASAAS_WEBHOOK_TOKEN) {
      return jsonResponse(res, 401, { error: 'Unauthorized webhook' });
    }
  }

  const event = req.body?.event;
  const payment = req.body?.payment || {};
  const paymentId = payment.id || req.body?.id;
  if (!paymentId) return jsonResponse(res, 200, { ok: true });

  const subs = await db.collection('subscriptions').where('asaas_payment_id', '==', paymentId).limit(1).get();
  if (subs.empty) return jsonResponse(res, 200, { ok: true, message: 'subscription_not_found' });

  const docSnap = subs.docs[0];
  const current = docSnap.data();
  let nextStatus = current.status;

  if (
    event === 'PAYMENT_RECEIVED' ||
    event === 'PAYMENT_CONFIRMED' ||
    payment.status === 'RECEIVED' ||
    payment.status === 'CONFIRMED' ||
    payment.status === 'RECEIVED_IN_CASH'
  ) {
    nextStatus = 'active';
  } else if (event === 'PAYMENT_OVERDUE' || payment.status === 'OVERDUE') {
    nextStatus = 'expired';
  } else if (
    event === 'PAYMENT_REFUNDED' ||
    event === 'PAYMENT_DELETED' ||
    payment.status === 'REFUNDED' ||
    payment.status === 'DELETED'
  ) {
    nextStatus = 'cancelled';
  }

  if (nextStatus !== current.status) {
    await docSnap.ref.update({
      status: nextStatus,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return jsonResponse(res, 200, { ok: true });
});
