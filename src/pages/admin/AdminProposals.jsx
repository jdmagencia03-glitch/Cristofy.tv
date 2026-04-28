import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProposals() {
  const queryClient = useQueryClient();

  const { data: proposals = [] } = useQuery({
    queryKey: ['adminProposals'],
    queryFn: () => base44.entities.ContentProposal.list('-created_date'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ContentProposal.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProposals'] }),
  });

  const statusColors = {
    pendente: 'bg-yellow-500/20 text-yellow-400',
    aprovado: 'bg-green-500/20 text-green-400',
    rejeitado: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold">Propostas de Conteúdo</h1>
        </div>

        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className="p-4 bg-[#1A1A1A] rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{p.suggested_title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[p.status] || ''}`}>{p.status}</span>
                  </div>
                  {p.description && <p className="text-sm text-gray-400 mt-1">{p.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {p.user_email && <span>{p.user_email}</span>}
                    {p.created_date && <span>{format(new Date(p.created_date), 'dd/MM/yyyy')}</span>}
                  </div>
                </div>
                {p.status === 'pendente' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateMut.mutate({ id: p.id, status: 'aprovado' })}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => updateMut.mutate({ id: p.id, status: 'rejeitado' })}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {proposals.length === 0 && (
            <div className="text-center py-12 text-gray-500">Nenhuma proposta recebida.</div>
          )}
        </div>
      </div>
    </div>
  );
}