**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

## Configuração de Assinaturas (Firebase + Asaas)

O checkout usa Firebase Cloud Functions para criar cobranças no Asaas e atualizar status da assinatura no Firestore.

### 1) Deploy das Cloud Functions

No diretório `functions/`:

```bash
npm install
firebase deploy --only functions
```

### 2) Variáveis nas Cloud Functions

Configure no ambiente das functions:

- `ASAAS_API_KEY` = sua chave da API no Asaas
- `ASAAS_BASE_URL` = `https://api-sandbox.asaas.com/v3` (sandbox) ou `https://api.asaas.com/v3` (produção)
- `ASAAS_WEBHOOK_TOKEN` = token secreto para validar webhook

### 3) Variáveis do frontend

- `VITE_FIREBASE_FUNCTIONS_BASE_URL` = base URL das functions (sem barra no final)
  - Ex: `https://southamerica-east1-SEU_PROJETO.cloudfunctions.net`
- `VITE_SUBSCRIPTION_BASE44_FALLBACK` = `true` (cutover gradual) ou `false` (Firebase-only)

### 4) Webhook no Asaas

- URL: `${VITE_FIREBASE_FUNCTIONS_BASE_URL}/handleAbacatepayWebhook`
- Token: mesmo valor de `ASAAS_WEBHOOK_TOKEN`
- Eventos:
  - `PAYMENT_RECEIVED`
  - `PAYMENT_CONFIRMED`
  - `PAYMENT_OVERDUE`
  - `PAYMENT_REFUNDED`
  - `PAYMENT_DELETED`

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
