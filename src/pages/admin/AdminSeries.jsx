import React, { useState } from 'react';
import {
	createSeries,
	deleteSeries,
	listAllSeriesAdmin,
	updateSeries,
} from '@/api/catalog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, EyeOff, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/admin/ImageUpload';
import { toast } from 'sonner';

const HIGHLIGHT_NONE = '__none__';

export default function AdminSeries() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    year: '',
    cover_url: '',
    banner_url: '',
    banner_mobile_url: '',
    published: true,
    featured: false,
    age_rating: 'Livre',
    highlighted_home_section: null,
    content_type: 'series',
  });

  const { data: series = [], isLoading } = useQuery({
    queryKey: ['adminSeries'],
    queryFn: () => listAllSeriesAdmin(),
  });

  const createMut = useMutation({
    mutationFn: (data) => createSeries(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSeries'] });
      closeDialog();
      toast.success('Título criado');
    },
    onError: (e) => toast.error(e?.message || 'Não foi possível criar. Verifique login no Firebase e tente de novo.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateSeries(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSeries'] });
      closeDialog();
      toast.success('Alterações salvas');
    },
    onError: (e) => toast.error(e?.message || 'Não foi possível salvar.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteSeries(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminSeries'] }); toast.success('Removido'); },
    onError: (e) => toast.error(e?.message || 'Não foi possível excluir.'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      category: '',
      year: '',
      cover_url: '',
      banner_url: '',
      banner_mobile_url: '',
      published: true,
      featured: false,
      age_rating: 'Livre',
      highlighted_home_section: null,
      content_type: 'series',
    });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title || '', description: s.description || '', category: s.category || '',
      year: s.year || '', cover_url: s.cover_url || '', banner_url: s.banner_url || '', banner_mobile_url: s.banner_mobile_url || '',
      published: s.published !== false, featured: s.featured || false, age_rating: s.age_rating || 'Livre',
      highlighted_home_section: s.highlighted_home_section || null,
      content_type: s.content_type === 'movie' ? 'movie' : 'series',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleSubmit = () => {
    if (!form.title?.trim()) {
      toast.error('Preencha o título');
      return;
    }
    const data = { ...form, year: form.year ? Number(form.year) : undefined };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold flex-1">Séries e filmes</h1>
          <Button onClick={openCreate} className="bg-[#E50914] hover:bg-[#FF3D3D]">
            <Plus className="w-4 h-4 mr-2" /> Novo título
          </Button>
        </div>

        <div className="space-y-3">
          {series.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg hover:bg-[#222] transition-colors">
              <div className="shrink-0 w-16 h-24 rounded overflow-hidden bg-[#2A2A2A]">
                {s.cover_url ? (
                  <img src={s.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">{s.title?.[0]}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{s.title}</h3>
                  {s.content_type === 'movie' && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-[#0057FF]/25 text-[#5eb0ff] shrink-0">Filme</span>
                  )}
                  {s.featured && <Star className="w-4 h-4 text-[#FFC107] fill-current shrink-0" />}
                  {!s.published && <EyeOff className="w-4 h-4 text-gray-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">{s.category} • {s.year} • {s.age_rating}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/AdminEpisodes?seriesId=${s.id}`} className="text-xs text-[#E50914] hover:text-[#FF3D3D] px-3 py-1 border border-[#E50914] rounded">
                  {s.content_type === 'movie' ? 'Vídeo' : 'Episódios'}
                </Link>
                <button onClick={() => openEdit(s)} className="p-2 text-gray-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Excluir este título?')) deleteMut.mutate(s.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {series.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma série ou filme cadastrado.</p>
              <Button onClick={openCreate} className="mt-4 bg-[#E50914] hover:bg-[#FF3D3D]">Criar primeiro título</Button>
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? (form.content_type === 'movie' ? 'Editar filme' : 'Editar série') : 'Novo título'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Tipo</p>
                <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
                  <SelectTrigger className="bg-[#2A2A2A] border-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="series">Série</SelectItem>
                    <SelectItem value="movie">Filme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-[#2A2A2A] border-none" />
              <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-[#2A2A2A] border-none h-24" />
              <Input placeholder="Categorias (ex: Anime, Ação)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-[#2A2A2A] border-none" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Ano" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="bg-[#2A2A2A] border-none" />
                <Select value={form.age_rating} onValueChange={v => setForm({ ...form, age_rating: v })}>
                  <SelectTrigger className="bg-[#2A2A2A] border-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Livre', '10+', '12+', '14+', '16+', '18+'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Capa da série (cartazes, grades)</p>
                <ImageUpload
                  value={form.cover_url}
                  onChange={(v) => setForm({ ...form, cover_url: v })}
                  placeholder="https://... (URL direta da imagem da capa)"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Banner PC / desktop (home hero e topo da página — largura grande, ex. 16:9 ou 21:9)</p>
                <ImageUpload
                  value={form.banner_url}
                  onChange={(v) => setForm({ ...form, banner_url: v })}
                  placeholder="Upload ou URL — exibido em telas md e maiores"
                  minWidth={1600}
                  minHeight={900}
                  qualityHint="Qualidade recomendada: 1920x1080 ou maior para não ficar borrado no banner."
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Banner mobile (opcional — retrato/9:16; se vazio, usa o banner PC)</p>
                <ImageUpload
                  value={form.banner_mobile_url}
                  onChange={(v) => setForm({ ...form, banner_mobile_url: v })}
                  placeholder="Upload ou URL — só no celular"
                  minWidth={900}
                  minHeight={1600}
                  qualityHint="Para mobile, prefira 1080x1920 (ou acima) para melhor nitidez."
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.published} onCheckedChange={v => setForm({ ...form, published: v })} /> Publicada</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={v => setForm({ ...form, featured: v })} /> Destaque</label>
              </div>
              <Select
                value={form.highlighted_home_section ?? HIGHLIGHT_NONE}
                onValueChange={(v) =>
                  setForm({ ...form, highlighted_home_section: v === HIGHLIGHT_NONE ? null : v })
                }
              >
                <SelectTrigger className="bg-[#2A2A2A] border-none"><SelectValue placeholder="Nenhuma seção especial" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={HIGHLIGHT_NONE}>Nenhuma seção especial</SelectItem>
                  <SelectItem value="mais_assistidos">Mais Assistidos</SelectItem>
                  <SelectItem value="destaques">Destaques</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createMut.isPending || updateMut.isPending}
                className="w-full bg-[#E50914] hover:bg-[#FF3D3D]"
              >
                {editing ? (updateMut.isPending ? 'Salvando…' : 'Salvar') : createMut.isPending ? 'Criando…' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}