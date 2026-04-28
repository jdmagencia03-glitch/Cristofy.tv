import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const defaultFirebaseConfig = {
	apiKey: 'AIzaSyB_R10irJeEqSRXbeJMqGCFOdID8lzYO_g',
	authDomain: 'cristofy-46bc8.firebaseapp.com',
	projectId: 'cristofy-46bc8',
	storageBucket: 'cristofy-46bc8.firebasestorage.app',
	messagingSenderId: '126915447284',
	appId: '1:126915447284:web:2f2c18e8482911e69291a1',
	measurementId: 'G-Z7QNQJM9GV',
};

/** Firebase Web config: Console → Project settings → Your apps → SDK setup & configuration. */
function buildFirebaseConfig() {
	return {
		apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
		authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
		projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
		storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
		messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
		appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
		measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId,
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
