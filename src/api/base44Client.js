import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

function createDisabledBase44Client() {
  const notConfigured = async () => {
    throw new Error('Base44 não configurado (VITE_BASE44_APP_ID ausente).');
  };
  const empty = async () => [];
  return {
    auth: {
      me: notConfigured,
      logout: async () => {},
      updateMe: notConfigured,
    },
    entities: new Proxy(
      {},
      {
        get: () => ({
          list: empty,
          filter: empty,
          create: notConfigured,
          update: notConfigured,
          delete: notConfigured,
          bulkCreate: notConfigured,
          subscribe: () => () => {},
        }),
      }
    ),
    functions: {
      invoke: notConfigured,
    },
    integrations: {
      Core: {
        UploadFile: notConfigured,
        InvokeLLM: notConfigured,
      },
    },
  };
}

const hasAppId = Boolean(appId && appId !== 'null' && appId !== 'undefined');

export const base44 = hasAppId
  ? createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl,
    })
  : createDisabledBase44Client();
