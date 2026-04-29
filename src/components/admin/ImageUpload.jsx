import React, { useState, useRef } from 'react';
import { uploadImageFile } from '@/lib/uploadImage';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Upload, X, Loader2, Link2 } from 'lucide-react';

function looksLikeUrl(str) {
	if (!str || typeof str !== 'string') return false;
	const t = str.trim();
	return /^https?:\/\//i.test(t);
}

// Firebase Storage está ativo: permite enviar capas, banners e thumbnails pelo admin.
const SHOW_FILE_UPLOAD = true;

/**
 * Upload de arquivo → Firebase Storage (URL fixa no projeto) ou URL colada.
 * Requer login Firebase para upload; regras Storage em `storage.rules`.
 */
export default function ImageUpload({
	value,
	onChange,
	placeholder = 'https://...',
	aspectRatio = 'cover',
	minWidth = 0,
	minHeight = 0,
	qualityHint = '',
}) {
	const [uploading, setUploading] = useState(false);
	const inputRef = useRef(null);

	const handleFileChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		try {
			if (minWidth > 0 || minHeight > 0) {
				const dims = await readImageDimensions(file);
				if (dims.width < minWidth || dims.height < minHeight) {
					throw new Error(
						`Imagem pequena (${dims.width}x${dims.height}). Mínimo recomendado: ${minWidth}x${minHeight}.`
					);
				}
			}
			const url = await uploadImageFile(file);
			onChange(url);
			toast({
				title: 'Imagem enviada',
				description: 'O link foi salvo — não some ao recarregar o site.',
			});
		} catch (err) {
			toast({
				title: 'Não foi possível enviar',
				description: err?.message || 'Tente outra imagem ou cole uma URL.',
				variant: 'destructive',
			});
		} finally {
			setUploading(false);
			e.target.value = '';
		}
	};

	const heightClass = aspectRatio === 'square' ? 'aspect-square' : 'h-36';

	return (
		<div className="space-y-3">
			{SHOW_FILE_UPLOAD && (
				<div>
					<p className="text-xs text-gray-400 mb-1">Enviar do computador</p>
					<div
						onClick={() => !uploading && inputRef.current?.click()}
						className="relative w-full h-28 rounded-lg overflow-hidden bg-[#2A2A2A] border-2 border-dashed border-white/15 hover:border-[#E50914]/50 cursor-pointer flex items-center justify-center transition-colors"
					>
						{uploading ? (
							<Loader2 className="w-8 h-8 animate-spin text-[#E50914]" />
						) : (
							<div className="flex flex-col items-center gap-1 text-gray-400 px-2 text-center">
								<Upload className="w-7 h-7" />
								<span className="text-[11px] leading-tight">
									Clique para escolher imagem — gera um link permanente (Firebase Storage)
								</span>
							</div>
						)}
					</div>
					<p className="text-[10px] text-gray-500 mt-1 leading-snug">
						Você precisa estar <strong className="text-gray-400">logado</strong>. No plano gratuito há cota de armazenamento;
						o arquivo vira uma URL HTTPS salva no catálogo (capa/banner não somem).
					</p>
					{qualityHint && (
						<p className="text-[10px] text-[#FFC107] mt-1 leading-snug">{qualityHint}</p>
					)}
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleFileChange}
					/>
				</div>
			)}

			<div className="flex items-start gap-2 rounded-lg border border-white/10 bg-[#222]/80 p-2">
				<Link2 className="w-4 h-4 text-[#FFC107] shrink-0 mt-2.5" />
				<div className="flex-1 min-w-0 space-y-1">
					<p className="text-xs text-gray-400">Cole uma URL de imagem</p>
					<Input
						type="url"
						inputMode="url"
						autoComplete="off"
						placeholder={placeholder}
						value={value || ''}
						onChange={(e) => onChange(e.target.value.trim())}
						className="bg-[#2A2A2A] border-white/10 text-white text-sm"
					/>
					<p className="text-[10px] text-gray-500 leading-snug">
						Se preferir, cole uma URL externa. Para arquivo do computador, use o envio acima via Firebase Storage.
					</p>
				</div>
			</div>

			<div
				className={`relative w-full ${heightClass} rounded-lg overflow-hidden bg-[#2A2A2A] border border-white/10 flex items-center justify-center`}
			>
				{looksLikeUrl(value) ? (
					<>
						<img
							src={value}
							alt=""
							className="w-full h-full object-cover"
							onError={(e) => {
								e.target.style.display = 'none';
							}}
						/>
						<div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
							<button
								type="button"
								onClick={() => onChange('')}
								className="text-xs bg-black/70 text-white px-3 py-1.5 rounded-md hover:bg-red-900/80"
							>
								Limpar
							</button>
						</div>
					</>
				) : (
					<p className="text-xs text-gray-600 px-4 text-center">Prévia aparece quando a URL for válida</p>
				)}
			</div>

			{value && (
				<button
					type="button"
					onClick={() => onChange('')}
					className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
				>
					<X className="w-3 h-3" /> Remover imagem
				</button>
			)}
		</div>
	);
}

function readImageDimensions(file) {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
			URL.revokeObjectURL(url);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Não foi possível ler as dimensões da imagem.'));
		};
		img.src = url;
	});
}
