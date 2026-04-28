/**
 * Catálogo: Firestore quando configurado; senão Base44 (legado).
 */
import { getFirebaseDb } from '@/lib/firebase';
import { base44 } from '@/api/base44Client';
import * as cfs from '@/api/catalogFirestore';

export function catalogUsesFirestore() {
	return !!getFirebaseDb();
}

export async function listPublishedSeries() {
	const db = getFirebaseDb();
	if (db) return cfs.listPublishedSeries(db);
	return base44.entities.Series.filter({ published: true });
}

export async function listAllSeriesAdmin() {
	const db = getFirebaseDb();
	if (db) return cfs.listAllSeriesAdmin(db);
	return base44.entities.Series.list('-created_date');
}

export async function getSeriesById(seriesId) {
	const db = getFirebaseDb();
	if (db) return cfs.getSeriesById(db, seriesId);
	const list = await base44.entities.Series.filter({ id: seriesId });
	return list[0] || null;
}

export async function createSeries(data) {
	const db = getFirebaseDb();
	if (db) return cfs.createSeries(db, data);
	return base44.entities.Series.create(data);
}

export async function updateSeries(id, data) {
	const db = getFirebaseDb();
	if (db) return cfs.updateSeries(db, id, data);
	return base44.entities.Series.update(id, data);
}

export async function deleteSeries(id) {
	const db = getFirebaseDb();
	if (db) return cfs.deleteSeries(db, id);
	return base44.entities.Series.delete(id);
}

export async function listEpisodesBySeries(seriesId) {
	const db = getFirebaseDb();
	if (db) return cfs.listEpisodesBySeries(db, seriesId);
	return base44.entities.Episode.filter({ series_id: seriesId });
}

export async function getEpisodeById(episodeId) {
	const db = getFirebaseDb();
	if (db) return cfs.getEpisodeById(db, episodeId);
	const list = await base44.entities.Episode.filter({ id: episodeId });
	return list[0] || null;
}

export async function listEpisodesForHome(limit = 500) {
	const db = getFirebaseDb();
	if (db) return cfs.listEpisodesForHome(db, limit);
	return base44.entities.Episode.list('-season', limit);
}

export async function createEpisode(data) {
	const db = getFirebaseDb();
	if (db) return cfs.createEpisode(db, data);
	return base44.entities.Episode.create(data);
}

export async function updateEpisode(id, data) {
	const db = getFirebaseDb();
	if (db) return cfs.updateEpisode(db, id, data);
	return base44.entities.Episode.update(id, data);
}

export async function deleteEpisode(id) {
	const db = getFirebaseDb();
	if (db) return cfs.deleteEpisode(db, id);
	return base44.entities.Episode.delete(id);
}

export async function listFeaturedBannersHome() {
	const db = getFirebaseDb();
	if (db) return cfs.listFeaturedBannersActive(db);
	return base44.entities.FeaturedBanner.filter({ active: true }, 'order', 5);
}

export async function listFeaturedBannersAdmin() {
	const db = getFirebaseDb();
	if (db) return cfs.listFeaturedBannersAdmin(db);
	return base44.entities.FeaturedBanner.list('order', 10);
}

export async function createFeaturedBanner(data) {
	const db = getFirebaseDb();
	if (db) return cfs.createFeaturedBanner(db, data);
	return base44.entities.FeaturedBanner.create(data);
}

export async function updateFeaturedBanner(id, data) {
	const db = getFirebaseDb();
	if (db) return cfs.updateFeaturedBanner(db, id, data);
	return base44.entities.FeaturedBanner.update(id, data);
}

export async function deleteFeaturedBanner(id) {
	const db = getFirebaseDb();
	if (db) return cfs.deleteFeaturedBanner(db, id);
	return base44.entities.FeaturedBanner.delete(id);
}
