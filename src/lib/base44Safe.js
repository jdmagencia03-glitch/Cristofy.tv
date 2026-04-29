import { format } from 'date-fns';

/**
 * Evita tela preta quando Base44 não está configurado ou a API falha.
 */
export async function safeBase44Query(queryFn) {
	try {
		const data = await queryFn();
		return { ok: true, data: Array.isArray(data) ? data : data ?? [], error: null };
	} catch (e) {
		console.warn('[Base44]', e);
		return {
			ok: false,
			data: [],
			error: e?.message || String(e),
		};
	}
}

/** Evita RangeError do date-fns com datas inválidas (registros Base44 quebrados). */
export function safeFormatDatePtBr(value) {
	try {
		if (value == null || value === '') return null;
		const d = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(d.getTime())) return null;
		return format(d, 'dd/MM/yyyy');
	} catch {
		return null;
	}
}

/** Avatares embutidos no app (mesmo conjunto da seleção de perfil). */
export const BUILTIN_AVATARS = [
	{ id: 'builtin-1', name: 'Pomba', image_url: '/cristofy-avatar-dove.png' },
	{ id: 'builtin-2', name: 'Cruz', image_url: '/cristofy-avatar-cross.png' },
	{ id: 'builtin-3', name: 'Leao', image_url: '/cristofy-avatar-lion.png' },
	{ id: 'builtin-4', name: 'Jesus', image_url: '/cristofy-avatar-jesus.png' },
	{ id: 'builtin-5', name: 'Ceia', image_url: '/cristofy-avatar-communion.png' },
];
