import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ImageUpload from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import { safeBase44Query, BUILTIN_AVATARS } from '@/lib/base44Safe';

export default function AdminAvatars() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', image_url: '' });

  const { data: result, isPending } = useQuery({
    queryKey: ['avatars'],
    queryFn: () => safeBase44Query(() => base44.entities.Avatar.list()),
  });

  const avatars = result?.ok ? result.data : [];
  const base44Error = result && !result.ok ? result.error : null;

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Avatar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
      setDialogOpen(false);
      setForm({ name: '', image_url: '' });
      toast.success('Avatar criado');
    },
    onError: (e) => toast.error(e?.message || 'Falha ao criar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Avatar.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['avatars'] }); toast.success('Removido'); },
    onError: (e) => toast.error(e?.message || 'Falha ao excluir'),
  });

  return (
    <div className="min-h-screen bg-[#0F171E] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold flex-1">Avatares</h1>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#00A8E1] hover:bg-[#36CFFF]">
            <Plus className="w-4 h-4 mr-2" /> Novo Avatar
          </Button>
        </div>

        {base44Error && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">Lista de avatares do servidor indisponível</p>
            <p className="mt-1 text-amber-200/90">{base44Error}</p>
            <p className="mt-2 text-xs text-amber-200/70">Abaixo: avatares padrão já embutidos no app (somente leitura).</p>
            <Link to="/Admin" className="mt-3 inline-block text-sm text-white underline hover:no-underline">
              Voltar ao painel admin
            </Link>
          </div>
        )}

        {isPending && <div className="py-12 text-center text-gray-500">Carregando…</div>}

        {base44Error && !isPending && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3">Avatares padrão do app</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {BUILTIN_AVATARS.map(av => (
                <div key={av.id} className="flex flex-col items-center">
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#1A242F]">
                    <img src={av.image_url} alt={av.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate w-full text-center">{av.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isPending && result?.ok && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {avatars.map(av => (
              <div key={av.id} className="relative group flex flex-col items-center">
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#1A242F]">
                  <img src={av.image_url} alt={av.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate w-full text-center">{av.name}</p>
                <button
                  type="button"
                  onClick={() => { if (confirm('Excluir avatar?')) deleteMut.mutate(av.id); }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {avatars.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>Nenhum avatar cadastrado no servidor.</p>
              </div>
            )}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#1A242F] border-white/10 text-white max-w-sm">
            <DialogHeader><DialogTitle>Novo Avatar</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome (ex: Goku, Mickey...)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-[#252E39] border-none" />
              <ImageUpload value={form.image_url} onChange={v => setForm({ ...form, image_url: v })} placeholder="Clique para enviar a imagem" aspectRatio="square" />
              <Button onClick={() => createMut.mutate(form)} disabled={!form.name.trim() || !form.image_url.trim() || createMut.isPending} className="w-full bg-[#00A8E1] hover:bg-[#36CFFF]">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
