import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/** Firebase Web config: Console → Project settings → Your apps → SDK setup & configuration. */
function buildFirebaseConfig() {
	return {
		apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
		authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
		projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
		storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
		appId: import.meta.env.VITE_FIREBASE_APP_ID,
		measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
	};
}

let cachedApp = null;
let cachedAnalytics = null;

/** Retorna o app Firebase ou `null` se as env não estiverem definidas (ex.: dev sem .env). */
export function getFirebaseApp() {
	if (cachedApp !== null) {
		return cachedApp;
	}
	const cfg = buildFirebaseConfig();
	if (!cfg.apiKey || !cfg.projectId) {
		cachedApp = null;
		return null;
	}
	cachedApp = getApps().length ? getApps()[0] : initializeApp(cfg);
	return cachedApp;
}

export function getFirebaseAuth() {
	const app = getFirebaseApp();
	return app ? getAuth(app) : null;
}

export function getFirebaseDb() {
	const app = getFirebaseApp();
	return app ? getFirestore(app) : null;
}

export function getFirebaseStorage() {
	const app = getFirebaseApp();
	return app ? getStorage(app) : null;
}

export async function getFirebaseAnalytics() {
	const app = getFirebaseApp();
	if (!app || !await isSupported()) {
		return null;
	}
	cachedAnalytics = cachedAnalytics || getAnalytics(app);
	return cachedAnalytics;
}
