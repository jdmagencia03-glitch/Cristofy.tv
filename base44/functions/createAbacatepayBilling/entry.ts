import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
const ASAAS_BASE_URL = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function getDueDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const PLANS = {
  mensal: { name: "CristoFy Mensal", amountCents: 990 },
  premium: { name: "CristoFy Plano Intermediário", amountCents: 1990 },
  anual: { name: "CristoFy Anual", amountCents: 9990 },
};

const headers = {
  access_token: ASAAS_API_KEY || "",
  "Content-Type": "application/json",
  accept: "application/json",
};

Deno.serve(async (req) => {
  if (!ASAAS_API_KEY) {
    return Response.json({ error: "ASAAS_API_KEY não configurada no ambiente." }, { status: 500 });
  }

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, payment_method, customer } = await req.json();

  if (!PLANS[plan]) return Response.json({ error: "Plano inválido" }, { status: 400 });

  const planInfo = PLANS[plan];
  const cpfCnpj = onlyDigits(customer?.cpf || "");
  if (!cpfCnpj || cpfCnpj.length < 11) {
    return Response.json({ error: "CPF inválido." }, { status: 400 });
  }

  // 1) Criar cliente na Asaas
  const customerRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: customer?.name || user.full_name || user.email,
      email: user.email,
      cpfCnpj,
      mobilePhone: onlyDigits(customer?.phone || ""),
      externalReference: user.id || user.email,
    }),
  });

  const customerData = await customerRes.json();
  const customerId = customerData?.id;

  if (!customerId) {
    return Response.json({ error: "Erro ao criar cliente no Asaas", details: customerData }, { status: 500 });
  }

  // 2) Criar cobrança
  // PIX: cobra direto por PIX
  // Cartão: gera fatura/checkout para pagamento hospedado no Asaas
  const billingType = payment_method === "pix" ? "PIX" : "UNDEFINED";
  const paymentRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: customerId,
      billingType,
      value: planInfo.amountCents / 100,
      dueDate: getDueDate(1),
      description: `Assinatura ${planInfo.name}`,
      externalReference: `${user.email}:${plan}:${Date.now()}`,
    }),
  });

  const paymentData = await paymentRes.json();
  const paymentId = paymentData?.id;
  const invoiceUrl = paymentData?.invoiceUrl || null;

  if (!paymentId) {
    return Response.json({ error: "Erro ao criar cobrança no Asaas", details: paymentData }, { status: 500 });
  }

  let pixQrCode = null;
  let pixCopyPaste = null;
  if (payment_method === "pix") {
    try {
      const pixRes = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`, { headers });
      const pixData = await pixRes.json();
      pixQrCode = pixData?.encodedImage || null;
      pixCopyPaste = pixData?.payload || null;
    } catch (_err) {
      // QR code é opcional no retorno; o usuário ainda pode pagar via invoiceUrl.
    }
  }

  // 3) Salvar assinatura pendente
  const now = new Date();
  const expiresAt = new Date(now);
  if (plan === "anual") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setMonth(expiresAt.getMonth() + 1);

  await base44.entities.Subscription.create({
    user_email: user.email,
    plan,
    status: "pending",
    payment_method,
    asaas_payment_id: paymentId,
    asaas_customer_id: customerId,
    // Mantém compatibilidade com dados legados
    abacatepay_billing_id: paymentId,
    abacatepay_customer_id: customerId,
    starts_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    pix_qr_code: pixQrCode || undefined,
    pix_copy_paste: pixCopyPaste || undefined,
  });

  return Response.json({
    billing_url: invoiceUrl,
    billing_id: paymentId,
    customer_id: customerId,
    pix_qr_code: pixQrCode,
    pix_copy_paste: pixCopyPaste,
  });
});