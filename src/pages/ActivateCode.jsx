import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getFirebaseApp } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { appParams } from '@/lib/app-params';
import BrandWordmark from '@/components/BrandWordmark';

const hasValidBase44AppId = (appId) => Boolean(appId && appId !== 'null' && appId !== 'undefined');

export default function ActivateCode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firebaseOnly = !!getFirebaseApp() && !hasValidBase44AppId(appParams.appId);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (firebaseOnly) return;
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    const codes = await base44.entities.AccessCode.filter({ code: code.trim().toUpperCase() });

    if (codes.length === 0) {
      setError('Código inválido. Verifique e tente novamente.');
      setLoading(false);
      return;
    }

    const accessCode = codes[0];
    if (!accessCode.active) {
      setError('Este código está desativado.');
      setLoading(false);
      return;
    }
    if (accessCode.used_by) {
      setError('Este código já foi utilizado.');
      setLoading(false);
      return;
    }

    await base44.entities.AccessCode.update(accessCode.id, {
      used_by: user?.email,
      used_date: new Date().toISOString(),
    });

    await base44.auth.updateMe({ activated: true });

    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate('/ProfileSelect'), 2000);
  };

  if (firebaseOnly) {
    return (
      <div className="min-h-screen bg-[#0F171E] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Ativação por código</h1>
          <p className="text-gray-400 text-sm mb-6">
            O acesso passou a ser pelo <strong className="text-white">Firebase Authentication</strong>.
            Ativação por código do Base44 será recriada no Firestore quando os dados forem migrados.
          </p>
          <Button onClick={() => navigate('/ProfileSelect')} className="bg-[#00A8E1] hover:bg-[#36CFFF]">
            Ir para perfis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F171E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">
            <BrandWordmark className="text-3xl" />
          </h1>
          <p className="text-gray-400">Ative sua conta com um código de acesso</p>
        </div>

        <div className="bg-[#1A242F] rounded-xl p-6 border border-white/5">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Conta Ativada!</h2>
              <p className="text-gray-400">Redirecionando...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6 p-3 bg-[#252E39] rounded-lg">
                <Key className="w-5 h-5 text-[#FFC107]" />
                <p className="text-sm text-gray-300">
                  Insira o código de acesso que você recebeu ao adquirir o plano.
                </p>
              </div>

              <Input
                placeholder="Ex: DESENHOS-ABC123"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                className="bg-[#252E39] border-none text-lg text-center tracking-widest font-mono mb-4"
              />

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Button
                onClick={handleActivate}
                disabled={loading || !code.trim()}
                className="w-full bg-[#00A8E1] hover:bg-[#36CFFF] py-3 text-base"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ativar Código'}
              </Button>

              <button
                type="button"
                onClick={() => navigate('/Home')}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
              >
                Pular por agora
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
