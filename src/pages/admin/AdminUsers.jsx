import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { safeBase44Query, safeFormatDatePtBr } from '@/lib/base44Safe';

export default function AdminUsers() {
  const { data: result, isPending } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () =>
      safeBase44Query(() => base44.entities.User.list('-created_date')),
  });

  const users = result?.ok ? result.data : [];
  const base44Error = result && !result.ok ? result.error : null;

  return (
    <div className="min-h-screen bg-[#0F171E] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold flex-1">Usuários</h1>
          <span className="text-sm text-gray-400">{isPending ? '…' : `${users.length} usuários`}</span>
        </div>

        {base44Error && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">Catálogo de usuários indisponível</p>
            <p className="mt-1 text-amber-200/90">{base44Error}</p>
            <p className="mt-2 text-xs text-amber-200/70">
              Verifique se o Base44 está configurado (variáveis de ambiente) ou tente mais tarde.
            </p>
            <Link to="/Admin" className="mt-3 inline-block text-sm text-white underline hover:no-underline">
              Voltar ao painel admin
            </Link>
          </div>
        )}

        {isPending && (
          <div className="py-12 text-center text-gray-500">Carregando…</div>
        )}

        {!isPending && (
          <div className="space-y-2">
            {users.map(u => {
              const createdLabel = safeFormatDatePtBr(u.created_date);
              return (
              <div key={u.id} className="flex items-center gap-4 p-4 bg-[#1A242F] rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[#00A8E1] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">{u.full_name?.[0] || u.email?.[0] || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.full_name || 'Sem nome'}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-[#FFC107]/20 text-[#FFC107]' : 'bg-white/10 text-gray-300'}`}>
                    {u.role || 'user'}
                  </span>
                  {createdLabel && (
                    <p className="text-[10px] text-gray-500 mt-1">{createdLabel}</p>
                  )}
                </div>
              </div>
            );})}
            {!base44Error && users.length === 0 && (
              <div className="py-12 text-center text-gray-500">Nenhum usuário listado.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
