import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-[#0F171E] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-8xl font-black text-[#00A8E1] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Página não encontrada</h2>
        <p className="text-gray-400 mb-8">O conteúdo que você procura não existe ou foi removido.</p>
        <Link
          to="/Home"
          className="inline-flex items-center gap-2 bg-[#00A8E1] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#36CFFF] transition-colors"
        >
          <Home className="w-5 h-5" />
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}