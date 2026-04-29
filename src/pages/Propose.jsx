import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getFirebaseApp } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Propose() {
  const { user } = useAuth();
  const firebaseConfigured = !!getFirebaseApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (firebaseConfigured) {
      return;
    }
    if (!title.trim()) return;
    setLoading(true);
    await base44.entities.ContentProposal.create({
      user_email: user?.email,
      suggested_title: title.trim(),
      description: description.trim(),
      status: 'pendente',
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F171E] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-lg mx-auto">
        <Link to="/Home" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-2">Sugerir Desenho</h1>
        <p className="text-gray-400 text-sm mb-6">Sugira um desenho que você gostaria de ver na plataforma!</p>

        {firebaseConfigured && (
          <p className="text-sm text-yellow-100 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 mb-6">
            Sugestões por formulário voltam assim que os dados estiverem no Firestore (migração em andamento).
          </p>
        )}

        {sent ? (
          <div className="text-center py-12 bg-[#1A242F] rounded-xl">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Sugestão Enviada!</h2>
            <p className="text-gray-400">Obrigado pela sua contribuição. Vamos avaliar sua sugestão.</p>
          </div>
        ) : (
          <div className="bg-[#1A242F] rounded-xl p-6 space-y-4">
            <Input
              placeholder="Nome do desenho"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#252E39] border-none"
            />
            <Textarea
              placeholder="Descrição (opcional) - conte-nos mais sobre o desenho"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#252E39] border-none h-32"
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !title.trim() || firebaseConfigured}
              className="w-full bg-[#00A8E1] hover:bg-[#36CFFF]"
            >
              <Send className="w-4 h-4 mr-2" /> Enviar Sugestão
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}