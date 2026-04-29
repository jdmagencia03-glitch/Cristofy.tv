/**
 * Catálogo público e admin no Cloud Firestore (plano Spark — faixa gratuita).
 * Vídeos/imagens: use URLs externas (Bunny, Imgur, etc.), não Firebase Storage.
 */
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	serverTimestamp,
	updateDoc,
	where,
	writeBatch,
} from 'firebase/firestore';

/** Firestore rejeita `undefined` em documentos; removemos antes de addDoc/updateDoc. */
function stripUndefined(input) {
	if (input == null || typeof input !== 'object' || input instanceof Date) {
		return input;
	}
	return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
}

function serializeValue(v) {
	if (v == null) return v;
	if (typeof v.toDate === 'function') return v.toDate().toISOString();
	return v;
}

export function docToObject(d) {
	const data = d.data();
	const out = { id: d.id };
	for (const [k, v] of Object.entries(data || {})) {
		out[k] = serializeValue(v);
	}
	return out;
}

export async function listPublishedSeries(db) {
	const q = query(collection(db, 'series'), where('published', '==', true));
	const snap = await getDocs(q);
	return snap.docs.map(docToObject);
}

export async function listAllSeriesAdmin(db) {
	const snap = await getDocs(collection(db, 'series'));
	return snap.docs
		.map(docToObject)
		.sort((a, b) => {
			const ta = new Date(a.created_date || 0).getTime();
			const tb = new Date(b.created_date || 0).getTime();
			return tb - ta;
		});
}

export async function getSeriesById(db, id) {
	const ref = doc(db, 'series', id);
	const snap = await getDoc(ref);
	if (!snap.exists()) return null;
	return docToObject(snap);
}

export async function createSeries(db, data) {
	const clean = stripUndefined(data);
	const ref = await addDoc(collection(db, 'series'), {
		...clean,
		created_date: serverTimestamp(),
		updated_at: serverTimestamp(),
	});
	return { id: ref.id };
}

export async function updateSeries(db, id, data) {
	const clean = stripUndefined(data);
	await updateDoc(doc(db, 'series', id), {
		...clean,
		updated_at: serverTimestamp(),
	});
}

export async function deleteSeries(db, seriesId) {
	const eps = await listEpisodesBySeries(db, seriesId);
	const batch = writeBatch(db);
	eps.forEach((ep) => batch.delete(doc(db, 'episodes', ep.id)));
	const bannersSnap = await getDocs(
		query(collection(db, 'featured_banners'), where('series_id', '==', seriesId))
	);
	bannersSnap.docs.forEach((d) => batch.delete(d.ref));
	batch.delete(doc(db, 'series', seriesId));
	await batch.commit();
}

export async function listEpisodesBySeries(db, seriesId) {
	const q = query(collection(db, 'episodes'), where('series_id', '==', seriesId));
	const snap = await getDocs(q);
	return snap.docs.map(docToObject);
}

export async function getEpisodeById(db, id) {
	const snap = await getDoc(doc(db, 'episodes', id));
	if (!snap.exists()) return null;
	return docToObject(snap);
}

export async function listEpisodesForHome(db, max = 500) {
	const snap = await getDocs(collection(db, 'episodes'));
	const all = snap.docs.map(docToObject);
	return all
		.sort((a, b) => {
			if ((a.season || 1) !== (b.season || 1)) return (a.season || 1) - (b.season || 1);
			return (a.number || 0) - (b.number || 0);
		})
		.slice(0, max);
}

export async function createEpisode(db, data) {
	const clean = stripUndefined(data);
	const ref = await addDoc(collection(db, 'episodes'), {
		...clean,
		created_date: serverTimestamp(),
	});
	return { id: ref.id };
}

export async function updateEpisode(db, id, data) {
	const clean = stripUndefined(data);
	await updateDoc(doc(db, 'episodes', id), {
		...clean,
		updated_at: serverTimestamp(),
	});
}

export async function deleteEpisode(db, id) {
	await deleteDoc(doc(db, 'episodes', id));
}

/** Banners ativos para a home, ordenados */
export async function listFeaturedBannersActive(db) {
	const snap = await getDocs(collection(db, 'featured_banners'));
	return snap.docs
		.map(docToObject)
		.filter((b) => b.active !== false)
		.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function listFeaturedBannersAdmin(db) {
	const snap = await getDocs(collection(db, 'featured_banners'));
	return snap.docs.map(docToObject).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function createFeaturedBanner(db, data) {
	const clean = stripUndefined(data);
	const ref = await addDoc(collection(db, 'featured_banners'), {
		...clean,
		created_date: serverTimestamp(),
	});
	return { id: ref.id };
}

export async function updateFeaturedBanner(db, id, data) {
	const clean = stripUndefined(data);
	await updateDoc(doc(db, 'featured_banners', id), clean);
}

export async function deleteFeaturedBanner(db, id) {
	await deleteDoc(doc(db, 'featured_banners', id));
}
