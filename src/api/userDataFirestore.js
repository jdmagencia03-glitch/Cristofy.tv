import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

function ensureDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase não configurado.');
  return db;
}

function myListCollection(uid, profileId) {
  return collection(ensureDb(), 'users', uid, 'profiles', profileId, 'my_list');
}

function watchHistoryCollection(uid, profileId) {
  return collection(ensureDb(), 'users', uid, 'profiles', profileId, 'watch_history');
}

function normalizeDoc(d) {
  const data = d.data() || {};
  return {
    id: d.id,
    ...data,
    created_at: data.created_at?.toDate?.()?.toISOString?.() || data.created_at || null,
    updated_at: data.updated_at?.toDate?.()?.toISOString?.() || data.updated_at || null,
    updated_date:
      data.updated_date?.toDate?.()?.toISOString?.() ||
      data.updated_date ||
      data.updated_at?.toDate?.()?.toISOString?.() ||
      data.updated_at ||
      null,
  };
}

export async function listMyList(uid, profileId) {
  const snap = await getDocs(myListCollection(uid, profileId));
  return snap.docs.map(normalizeDoc);
}

export async function addMyListItem(uid, profileId, seriesId) {
  const current = await listMyList(uid, profileId);
  if (current.some((x) => x.series_id === seriesId)) return current;
  await addDoc(myListCollection(uid, profileId), {
    profile_id: profileId,
    series_id: seriesId,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return listMyList(uid, profileId);
}

export async function seedMyListFromLegacy(uid, profileId, legacyItems = []) {
  if (!legacyItems.length) return listMyList(uid, profileId);
  const current = await listMyList(uid, profileId);
  const existing = new Set(current.map((x) => x.series_id));
  const toCreate = legacyItems
    .map((x) => x?.series_id)
    .filter(Boolean)
    .filter((seriesId) => !existing.has(seriesId));
  await Promise.all(toCreate.map((seriesId) => addDoc(myListCollection(uid, profileId), {
    profile_id: profileId,
    series_id: seriesId,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })));
  return listMyList(uid, profileId);
}

export async function removeMyListBySeries(uid, profileId, seriesId) {
  const items = await listMyList(uid, profileId);
  const targets = items.filter((x) => x.series_id === seriesId);
  await Promise.all(targets.map((x) => deleteDoc(doc(myListCollection(uid, profileId), x.id))));
  return listMyList(uid, profileId);
}

export async function removeMyListById(uid, profileId, itemId) {
  await deleteDoc(doc(myListCollection(uid, profileId), itemId));
  return listMyList(uid, profileId);
}

export async function listWatchHistory(uid, profileId, limit = 500) {
  const snap = await getDocs(watchHistoryCollection(uid, profileId));
  const all = snap.docs.map(normalizeDoc);
  return all
    .sort((a, b) => new Date(b.updated_date || 0).getTime() - new Date(a.updated_date || 0).getTime())
    .slice(0, limit);
}

export async function listWatchHistoryBySeries(uid, profileId, seriesId) {
  const all = await listWatchHistory(uid, profileId, 2000);
  return all.filter((h) => h.series_id === seriesId);
}

export async function listWatchHistoryByEpisode(uid, profileId, episodeId) {
  const all = await listWatchHistory(uid, profileId, 2000);
  return all.filter((h) => h.episode_id === episodeId);
}

export async function upsertWatchHistory(uid, profileId, row) {
  const all = await listWatchHistory(uid, profileId, 2500);
  const existing = all.find((h) => h.episode_id === row.episode_id);
  const payload = {
    ...row,
    profile_id: profileId,
    updated_at: serverTimestamp(),
    updated_date: serverTimestamp(),
  };
  if (existing) {
    await updateDoc(doc(watchHistoryCollection(uid, profileId), existing.id), payload);
    return { ...existing, ...row };
  }
  const ref = await addDoc(watchHistoryCollection(uid, profileId), {
    ...payload,
    created_at: serverTimestamp(),
  });
  return { id: ref.id, ...row };
}

export async function seedWatchHistoryFromLegacy(uid, profileId, legacyRows = []) {
  if (!legacyRows.length) return listWatchHistory(uid, profileId, 2000);
  const current = await listWatchHistory(uid, profileId, 2500);
  const byEpisode = new Set(current.map((x) => x.episode_id));
  const toCreate = legacyRows.filter((x) => x?.episode_id && !byEpisode.has(x.episode_id));
  await Promise.all(
    toCreate.map((row) =>
      addDoc(watchHistoryCollection(uid, profileId), {
        profile_id: profileId,
        episode_id: row.episode_id,
        series_id: row.series_id || null,
        watched_seconds: row.watched_seconds || 0,
        total_duration: row.total_duration || 0,
        completed: !!row.completed,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        updated_date: serverTimestamp(),
      })
    )
  );
  return listWatchHistory(uid, profileId, 2000);
}
