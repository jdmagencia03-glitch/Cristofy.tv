import React, { useState } from 'react';
import {
  createFeaturedBanner,
  deleteFeaturedBanner,
  listFeaturedBannersAdmin,
  listPublishedSeries,
  updateFeaturedBanner,
} from '@/api/catalog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, RefreshCw, ArrowUp, ArrowDown, Eye, EyeOff, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import ImageUpload from '@/components/admin/ImageUpload';
import { toast } from 'sonner';

const emptyCustomForm = () => ({
  title: '',
  description: '',
  banner_url: '',
  banner_mobile_url: '',
  link_url: '',
});

export default function AdminBanner() {
  const queryClient = useQueryClient();
  /** null | 'catalog' | 'custom' */
  const [addingKind, setAddingKind] = useState(null);
  const [addingSlot, setAddingSlot] = useState(null);
  const [customForm, setCustomForm] = useState(emptyCustomForm);

  const { data: banners = [], isLoading: loadingBanners } = useQuery({
    queryKey: ['featuredBanners'],
    queryFn: () => listFeaturedBannersAdmin(),
  });

  const { data: allSeries = [] } = useQuery({
    queryKey: ['seriesAll'],
    queryFn: () => listPublishedSeries(),
  });

  const createMut = useMutation({
    mutationFn: (data) => createFeaturedBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredBanners'] });
      setAddingKind(null);
      setAddingSlot(null);
      setCustomForm(emptyCustomForm());
      toast.success('Slide adicionado ao banner');
    },
    onError: (e) => toast.error(e?.message || 'Não foi possível criar o slide'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateFeaturedBanner(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['featuredBanners'] }),
    onError: (e) => toast.error(e?.message || 'Erro ao atualizar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteFeaturedBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredBanners'] });
      toast.success('Removido');
    },
    onError: (e) => toast.error(e?.message || 'Erro ao excluir'),
  });

  const sortedBanners = [...banners].sort((a, b) => a.order - b.order);
  const maxOrder = sortedBanners.length > 0 ? Math.max(...sortedBanners.map(b => b.order)) : 0;

  const seriesById = Object.fromEntries(allSeries.map(s => [s.id, s]));

  const formatTitleLabel = (s) => {
    if (!s?.title) return '';
    const kind = s.content_type === 'movie' ? 'Filme' : 'Série';
    return `${s.title} (${kind})`;
  };

  const swapOrder = (indexA, indexB) => {
    const a = sortedBanners[indexA];
    const b = sortedBanners[indexB];
    if (!a || !b) return;
    updateMut.mutate({ id: a.id, data: { order: b.order } });
    updateMut.mutate({ id: b.id, data: { order: a.order } });
  };

  const openCatalogAdd = () => {
    setAddingSlot(maxOrder + 1);
    setAddingKind('catalog');
    setCustomForm(emptyCustomForm());
  };

  const openCustomAdd = () => {
    setAddingSlot(maxOrder + 1);
    setAddingKind('custom');
    setCustomForm(emptyCustomForm());
  };

  const cancelAdd = () => {
    setAddingKind(null);
    setAddingSlot(null);
    setCustomForm(emptyCustomForm());
  };

  const submitCustomSlide = () => {
    const bu = customForm.banner_url?.trim();
    const bm = customForm.banner_mobile_url?.trim();
    if (!bu && !bm) {
      toast.error('Envie pelo menos uma imagem (banner PC ou mobile)');
      return;
    }
    createMut.mutate({
      order: addingSlot,
      active: true,
      custom_title: customForm.title.trim() || 'Destaque',
      custom_description: customForm.description.trim() || undefined,
      custom_banner_url: bu || undefined,
      custom_banner_mobile_url: bm || undefined,
      link_url: customForm.link_url.trim() || undefined,
    });
  };

  const isCustomBannerDoc = (b) =>
    !b.series_id && (b.custom_banner_url || b.custom_banner_mobile_url);

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Banner Principal</h1>
            <p className="text-gray-400 text-sm mt-1">
              Monte o carrossel da home com <strong className="text-gray-300">títulos do catálogo</strong> ou{' '}
              <strong className="text-gray-300">imagens promocionais</strong> (sem precisar cadastrar série). Para slides do catálogo, capas e banners PC/mobile ficam em Admin → Séries e filmes.
            </p>
          </div>
          <Link to="/Admin">
            <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">← Voltar</Button>
          </Link>
        </div>

        {loadingBanners ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-[#E50914]" />
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBanners.map((banner, index) => {
              const series = banner.series_id ? seriesById[banner.series_id] : null;
              const custom = isCustomBannerDoc(banner);
              const thumbSrc = custom
                ? (banner.custom_banner_url || banner.custom_banner_mobile_url)
                : series?.cover_url;
              const titleText = custom
                ? (banner.custom_title || 'Banner promocional')
                : (series?.title || 'Título não encontrado');
              const subtitleText = custom
                ? 'Imagem própria • sem série'
                : [series?.content_type === 'movie' ? 'Filme' : 'Série', series?.category].filter(Boolean).join(' • ');

              return (
                <div
                  key={banner.id}
                  className="flex items-center gap-4 bg-[#1A1A1A] rounded-xl p-4 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-[#E50914]/20 text-[#E50914] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {banner.order}
                  </div>

                  {thumbSrc ? (
                    <img src={thumbSrc} alt="" className="w-12 h-16 object-cover rounded-md flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-16 bg-white/5 rounded-md flex-shrink-0 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{titleText}</p>
                    <p className="text-gray-500 text-xs truncate">{subtitleText}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateMut.mutate({ id: banner.id, data: { active: !banner.active } })}
                    className={`p-2 rounded-lg transition-colors ${banner.active ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-600 hover:bg-white/10'}`}
                    title={banner.active ? 'Ativo' : 'Inativo'}
                  >
                    {banner.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => swapOrder(index, index - 1)}
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sortedBanners.length - 1}
                      onClick={() => swapOrder(index, index + 1)}
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteMut.mutate(banner.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {addingKind === null ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={openCatalogAdd}
                  className="flex items-center justify-center gap-2 py-4 px-3 rounded-xl border-2 border-dashed border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all text-sm text-center"
                >
                  <Plus className="w-5 h-5 shrink-0" />
                  Adicionar série ou filme do catálogo
                </button>
                <button
                  type="button"
                  onClick={openCustomAdd}
                  className="flex items-center justify-center gap-2 py-4 px-3 rounded-xl border-2 border-dashed border-[#0057FF]/40 text-gray-300 hover:text-white hover:border-[#0057FF]/60 transition-all text-sm text-center"
                >
                  <ImageIcon className="w-5 h-5 shrink-0 text-[#0057FF]" />
                  Banner só com imagem (promoção, sem série)
                </button>
              </div>
            ) : addingKind === 'catalog' ? (
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#E50914]/30">
                <p className="text-gray-400 text-sm mb-3">
                  Escolha um título publicado (ordem {addingSlot}):
                </p>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <div className="flex-1">
                    <Select
                      onValueChange={(seriesId) => {
                        createMut.mutate({ series_id: seriesId, order: addingSlot, active: true });
                      }}
                    >
                      <SelectTrigger className="bg-[#2A2A2A] border-white/10 text-white">
                        <SelectValue placeholder="Selecione série ou filme..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-white/10">
                        {allSeries
                          .filter((s) => !banners.some((b) => b.series_id && b.series_id === s.id))
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id} className="text-white hover:bg-white/10">
                              {formatTitleLabel(s)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelAdd}
                    className="border-white/10 text-gray-400"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#0057FF]/30 space-y-4">
                <p className="text-gray-300 text-sm font-medium">
                  Slide promocional (ordem {addingSlot}) — imagens próprias, sem vínculo com série
                </p>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Banner PC / desktop</p>
                  <ImageUpload
                    value={customForm.banner_url}
                    onChange={(v) => setCustomForm((f) => ({ ...f, banner_url: v }))}
                    placeholder="Upload ou URL (recomendado 16:9 ou wide)"
                    minWidth={1600}
                    minHeight={900}
                    qualityHint="Qualidade recomendada: 1920x1080 ou maior."
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Banner mobile (opcional)</p>
                  <ImageUpload
                    value={customForm.banner_mobile_url}
                    onChange={(v) => setCustomForm((f) => ({ ...f, banner_mobile_url: v }))}
                    placeholder="Upload ou URL (retrato / 9:16)"
                    minWidth={900}
                    minHeight={1600}
                    qualityHint="Para mobile, prefira 1080x1920 (ou maior)."
                  />
                </div>
                <Input
                  placeholder="Título no hero (ex.: Black Friday, Novidade…)"
                  value={customForm.title}
                  onChange={(e) => setCustomForm((f) => ({ ...f, title: e.target.value }))}
                  className="bg-[#2A2A2A] border-none text-white"
                />
                <Textarea
                  placeholder="Subtítulo / descrição curta (opcional)"
                  value={customForm.description}
                  onChange={(e) => setCustomForm((f) => ({ ...f, description: e.target.value }))}
                  className="bg-[#2A2A2A] border-none text-white min-h-[72px]"
                />
                <div>
                  <p className="text-xs text-gray-400 mb-1">Link do botão “Acessar” (opcional)</p>
                  <Input
                    placeholder="Ex: /Subscription ou https://..."
                    value={customForm.link_url}
                    onChange={(e) => setCustomForm((f) => ({ ...f, link_url: e.target.value }))}
                    className="bg-[#2A2A2A] border-none text-white"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={cancelAdd} className="border-white/10 text-gray-400">
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={submitCustomSlide}
                    disabled={createMut.isPending}
                    className="bg-[#0057FF] hover:bg-[#0046cc] text-white"
                  >
                    {createMut.isPending ? 'Salvando…' : 'Salvar slide'}
                  </Button>
                </div>
              </div>
            )}

            {sortedBanners.length === 0 && addingKind === null && (
              <p className="text-center text-gray-500 py-6">
                Nenhum slide ainda. Use as opções acima ou publique conteúdo em Admin → Séries e filmes.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
