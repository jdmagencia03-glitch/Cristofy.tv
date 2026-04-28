import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AdminFirebaseNotice() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Painel em migração</h1>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-6">
          <p className="text-gray-200 mb-2">
            Esta área do admin ainda está no fluxo legado (Base44).
          </p>
          <p className="text-sm text-gray-400">
            No modo Firebase ela foi temporariamente desativada para evitar tela preta.
            Use as seções já migradas no painel principal (Séries/Episódios, Banner e Assinaturas).
          </p>
        </div>
      </div>
    </div>
  );
}
