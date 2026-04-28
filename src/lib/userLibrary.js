/**
 * Minha lista e histórico de exibição salvos no navegador (sem custo).
 * Usado quando o catálogo está no Firestore.
 */

function myListKey(profileId) {
	return `desenhos_mylist_${profileId}`;
}

function watchKey(profileId) {
	return `desenhos_watch_${profileId}`;
}

export function getMyList(profileId) {
	try {
		return JSON.parse(localStorage.getItem(myListKey(profileId)) || '[]');
	} catch {
		return [];
	}
}

export function setMyList(profileId, items) {
	localStorage.setItem(myListKey(profileId), JSON.stringify(items));
}

export function addMyListItem(profileId, seriesId) {
	const list = getMyList(profileId);
	if (list.some((x) => x.series_id === seriesId)) return list;
	const id = crypto.randomUUID?.() || `ml-${Date.now()}`;
	const next = [...list, { id, profile_id: profileId, series_id: seriesId }];
	setMyList(profileId, next);
	return next;
}

export function removeMyListBySeries(profileId, seriesId) {
	const next = getMyList(profileId).filter((x) => x.series_id !== seriesId);
	setMyList(profileId, next);
	return next;
}

export function removeMyListById(profileId, itemId) {
	const next = getMyList(profileId).filter((x) => x.id !== itemId);
	setMyList(profileId, next);
	return next;
}

export function getWatchHistory(profileId, limit = 500) {
	try {
		const all = JSON.parse(localStorage.getItem(watchKey(profileId)) || '[]');
		const sorted = [...all].sort(
			(a, b) =>
				new Date(b.updated_date || 0).getTime() - new Date(a.updated_date || 0).getTime()
		);
		return sorted.slice(0, limit);
	} catch {
		return [];
	}
}

export function getWatchHistoryBySeries(profileId, seriesId) {
	return getWatchHistory(profileId, 2000).filter((h) => h.series_id === seriesId);
}

export function getWatchHistoryByEpisode(profileId, episodeId) {
	return getWatchHistory(profileId, 2000).filter((h) => h.episode_id === episodeId);
}

export function upsertWatchHistory(profileId, row) {
	const all = JSON.parse(localStorage.getItem(watchKey(profileId)) || '[]');
	const idx = all.findIndex((h) => h.episode_id === row.episode_id);
	const ts = new Date().toISOString();
	if (idx >= 0) {
		all[idx] = { ...all[idx], ...row, updated_date: ts };
	} else {
		all.unshift({
			...row,
			id: crypto.randomUUID?.() || `wh-${Date.now()}`,
			updated_date: ts,
		});
	}
	localStorage.setItem(watchKey(profileId), JSON.stringify(all.slice(0, 2500)));
}
