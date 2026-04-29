import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  if (webhookToken) {
    const incoming = req.headers.get("asaas-access-token");
    if (!incoming || incoming !== webhookToken) {
      return Response.json({ error: "Unauthorized webhook" }, { status: 401 });
    }
  }

  const base44 = createClientFromRequest(req);

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Asaas webhook payload: { event, payment, ... }
  const event = body?.event;
  const payment = body?.payment;
  const paymentId = payment?.id || body?.id;

  if (!paymentId) return Response.json({ ok: true });

  let subscriptions = await base44.asServiceRole.entities.Subscription.filter({
    asaas_payment_id: paymentId,
  });
  if (!subscriptions || subscriptions.length === 0) {
    subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      abacatepay_billing_id: paymentId,
    });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return Response.json({ ok: true, message: "Subscription not found" });
  }

  const subscription = subscriptions[0];

  let newStatus = subscription.status;

  // Eventos/status Asaas
  if (
    event === "PAYMENT_RECEIVED" ||
    event === "PAYMENT_CONFIRMED" ||
    payment?.status === "RECEIVED" ||
    payment?.status === "CONFIRMED" ||
    payment?.status === "RECEIVED_IN_CASH"
  ) {
    newStatus = "active";
  } else if (
    event === "PAYMENT_DELETED" ||
    payment?.status === "DELETED" ||
    payment?.status === "REFUNDED"
  ) {
    newStatus = "cancelled";
  } else if (event === "PAYMENT_OVERDUE" || payment?.status === "OVERDUE") {
    newStatus = "expired";
  } else if (event === "PAYMENT_REFUNDED") {
    newStatus = "cancelled";
  }

  if (newStatus !== subscription.status) {
    await base44.asServiceRole.entities.Subscription.update(subscription.id, {
      status: newStatus,
    });
  }

  return Response.json({ ok: true });
});