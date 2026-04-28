import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	serverTimestamp,
	updateDoc,
	writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

function profileCollection(uid) {
	const db = getFirebaseDb();
	if (!db) throw new Error('Firebase não configurado.');
	return collection(db, 'users', uid, 'profiles');
}

function normalizeProfile(docSnap) {
	const data = docSnap.data();
	return {
		id: docSnap.id,
		...data,
		created_at: data.created_at?.toDate?.()?.toISOString?.() || data.created_at || null,
		updated_at: data.updated_at?.toDate?.()?.toISOString?.() || data.updated_at || null,
	};
}

export async function listProfiles(uid) {
	const snap = await getDocs(profileCollection(uid));
	return snap.docs
		.map(normalizeProfile)
		.sort((a, b) => {
			const ta = new Date(a.created_at || 0).getTime();
			const tb = new Date(b.created_at || 0).getTime();
			return ta - tb;
		});
}

export async function createProfile(uid, data) {
	const ref = await addDoc(profileCollection(uid), {
		...data,
		user_uid: uid,
		created_at: serverTimestamp(),
		updated_at: serverTimestamp(),
	});
	return {
		id: ref.id,
		...data,
		user_uid: uid,
	};
}

export async function updateProfile(uid, id, data) {
	await updateDoc(doc(profileCollection(uid), id), {
		...data,
		updated_at: serverTimestamp(),
	});
	return { id, ...data };
}

export async function deleteProfile(uid, id) {
	await deleteDoc(doc(profileCollection(uid), id));
}

export async function deleteAllProfiles(uid) {
	const snap = await getDocs(profileCollection(uid));
	if (snap.empty) return;
	const batch = writeBatch(getFirebaseDb());
	snap.docs.forEach((profileDoc) => batch.delete(profileDoc.ref));
	await batch.commit();
}

