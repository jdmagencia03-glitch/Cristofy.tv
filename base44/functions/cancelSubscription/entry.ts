import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
const ASAAS_BASE_URL = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription_id } = await req.json();

  const subscriptions = await base44.entities.Subscription.filter({ user_email: user.email }, "-created_date", 1);
  const subscription = subscriptions?.[0];

  if (!subscription) return Response.json({ error: "Assinatura não encontrada" }, { status: 404 });
  if (subscription.id !== subscription_id) return Response.json({ error: "Acesso negado" }, { status: 403 });

  // Tenta cancelar cobrança pendente no Asaas quando houver payment_id
  const paymentId = subscription.asaas_payment_id || subscription.abacatepay_billing_id;
  if (paymentId && ASAAS_API_KEY) {
    try {
      await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
        method: "DELETE",
        headers: {
          access_token: ASAAS_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      });
    } catch (_err) {
      // Mesmo se o cancelamento remoto falhar, cancelamos localmente.
    }
  }

  await base44.entities.Subscription.update(subscription.id, { status: "cancelled" });

  return Response.json({ ok: true });
});