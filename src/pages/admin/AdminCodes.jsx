import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { safeBase44Query } from '@/lib/base44Safe';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DESENHOS-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const mutOnError = (e) => toast.error(e?.message || 'Falha na operação Base44');

export default function AdminCodes() {
  const queryClient = useQueryClient();
  const [customCode, setCustomCode] = useState('');

  const { data: result, isPending } = useQuery({
    queryKey: ['adminCodes'],
    queryFn: () =>
      safeBase44Query(() => base44.entities.AccessCode.list('-created_date')),
  });

  const codes = result?.ok ? result.data : [];
  const base44Error = result && !result.ok ? result.error : null;

  const createMut = useMutation({
    mutationFn: (code) => base44.entities.AccessCode.create({ code, active: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminCodes'] }); setCustomCode(''); toast.success('Código criado'); },
    onError: mutOnError,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.AccessCode.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminCodes'] }); toast.success('Removido'); },
    onError: mutOnError,
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }) => base44.entities.AccessCode.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCodes'] }),
    onError: mutOnError,
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const handleGenerate = () => createMut.mutate(generateCode());
  const handleCustom = () => {
    if (!customCode.trim()) return;
    createMut.mutate(customCode.trim().toUpperCase());
  };

  const bulkGenerate = () => {
    const batch = Array.from({ length: 10 }, () => ({ code: generateCode(), active: true }));
    base44.entities.AccessCode.bulkCreate(batch)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['adminCodes'] });
        toast.success('10 códigos criados');
      })
      .catch((e) => toast.error(e?.message || 'Falha ao gerar lote'));
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold flex-1">Códigos de Acesso</h1>
        </div>

        {base44Error && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">Lista de códigos indisponível</p>
            <p className="mt-1 text-amber-200/90">{base44Error}</p>
            <Link to="/Admin" className="mt-3 inline-block text-sm text-white underline hover:no-underline">
              Voltar ao painel admin
            </Link>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-8 p-4 bg-[#1A1A1A] rounded-xl">
          <Button onClick={handleGenerate} disabled={createMut.isPending} className="bg-[#E50914] hover:bg-[#FF3D3D]">
            <Plus className="w-4 h-4 mr-2" /> Gerar Código
          </Button>
          <Button onClick={bulkGenerate} variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
            Gerar 10 Códigos
          </Button>
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <Input
              placeholder="Código personalizado"
              value={customCode}
              onChange={e => setCustomCode(e.target.value)}
              className="bg-[#2A2A2A] border-none"
            />
            <Button onClick={handleCustom} disabled={!customCode.trim() || createMut.isPending} className="bg-[#E50914] hover:bg-[#FF3D3D]">
              Criar
            </Button>
          </div>
        </div>

        {isPending && <div className="py-12 text-center text-gray-500">Carregando…</div>}

        {!isPending && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {codes.map(c => (
              <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg ${c.used_by ? 'bg-[#1A1A1A]/50' : 'bg-[#1A1A1A]'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold">{c.code}</code>
                    <button type="button" onClick={() => copyCode(c.code)} className="text-gray-500 hover:text-white">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  {c.used_by ? (
                    <p className="text-[10px] text-green-400 mt-1">Usado por {c.used_by}</p>
                  ) : (
                    <p className="text-[10px] text-gray-500 mt-1">{c.active ? 'Disponível' : 'Desativado'}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!c.used_by && (
                    <button
                      type="button"
                      onClick={() => toggleMut.mutate({ id: c.id, active: !c.active })}
                      className={`p-1.5 rounded ${c.active ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {c.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  )}
                  <button type="button" onClick={() => deleteMut.mutate(c.id)} className="p-1.5 text-gray-500 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isPending && !base44Error && codes.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nenhum código cadastrado.</div>
        )}
      </div>
    </div>
  );
}
