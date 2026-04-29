import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createEpisode, listAllSeriesAdmin } from '@/api/catalog';
import { useQuery } from '@tanstack/react-query';
import { Upload, Loader2, CheckCircle2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminEpisodeCreator() {
  const [selectedSeries, setSelectedSeries] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { data: seriesList = [] } = useQuery({
    queryKey: ['allSeries'],
    queryFn: () => listAllSeriesAdmin(),
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!imageFile || !selectedSeries) return;
    setLoading(true);
    setResult(null);

    try {
      // Upload image
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

      // Extract episode titles from image
      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta imagem e extraia todos os títulos de episódios visíveis. 
        Retorne um JSON com a estrutura abaixo. 
        Se houver números de temporada ou episódio, extraia também.
        Caso não encontre, use season=1 e incremente o number.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            episodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  season: { type: 'number' },
                  number: { type: 'number' },
                },
              },
            },
          },
        },
      });

      // Create each episode
      const created = [];
      for (const ep of extracted.episodes) {
        await createEpisode({
          series_id: selectedSeries,
          title: ep.title,
          season: ep.season || 1,
          number: ep.number || null,
        });
        created.push(ep.title);
      }

      setResult({ success: true, count: created.length, titles: created });
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Criar Episódios por Imagem</h1>
        <p className="text-gray-400 mb-8 text-sm">Envie um print com os nomes dos episódios e o sistema criará automaticamente no banco de dados.</p>

        <div className="space-y-6">
          {/* Series selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Selecione a Série</label>
            <Select value={selectedSeries} onValueChange={setSelectedSeries}>
              <SelectTrigger className="bg-[#1A1A1A] border-white/10 text-white">
                <SelectValue placeholder="Escolha uma série..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-white/10">
                {seriesList.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-white">{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Print com os Episódios</label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#E50914]/50 transition-colors bg-[#1A1A1A]">
              {preview ? (
                <img src={preview} alt="preview" className="h-full w-full object-contain rounded-lg p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-sm">Clique para selecionar a imagem</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!imageFile || !selectedSeries || loading}
            className="w-full bg-[#E50914] hover:bg-[#FF3D3D] text-white font-semibold"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando imagem...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Criar Episódios</>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-4 ${result.success ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
              {result.success ? (
                <>
                  <div className="flex items-center gap-2 text-green-400 font-semibold mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {result.count} episódio(s) criado(s) com sucesso!
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {result.titles.map((t, i) => <li key={i} className="flex gap-2"><span className="text-gray-500">•</span>{t}</li>)}
                  </ul>
                </>
              ) : (
                <p className="text-red-400 text-sm">Erro: {result.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}