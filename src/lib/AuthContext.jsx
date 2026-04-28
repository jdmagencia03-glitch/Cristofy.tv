import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

const AuthContext = createContext();

function parseAdminEmails() {
	const raw = import.meta.env.VITE_ADMIN_EMAILS || '';
	return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/** Objeto compatível com o que as telas esperavam do Base44 (`email`, `full_name`, `role`). */
export function normalizeFirebaseUser(fu) {
	if (!fu) return null;
	const emails = parseAdminEmails();
	const email = fu.email || '';
	const role = emails.includes(email.toLowerCase()) ? 'admin' : 'user';
	return {
		uid: fu.uid,
		email,
		full_name: fu.displayName || (email ? email.split('@')[0] : 'Usuário'),
		photo_url: fu.photoURL,
		role,
	};
}

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoadingAuth, setIsLoadingAuth] = useState(true);
	const [authError, setAuthError] = useState(null);

	useEffect(() => {
		const auth = getFirebaseAuth();
		if (!auth) {
			setAuthError({
				type: 'firebase_not_configured',
				message: 'Defina VITE_FIREBASE_* no ambiente.',
			});
			setUser(null);
			setIsAuthenticated(false);
			setIsLoadingAuth(false);
			return undefined;
		}

		setAuthError(null);
		const unsub = onAuthStateChanged(auth, (firebaseUser) => {
			setUser(normalizeFirebaseUser(firebaseUser));
			setIsAuthenticated(!!firebaseUser);
			setIsLoadingAuth(false);
		});

		return () => unsub();
	}, []);

	const logout = async (shouldRedirect = true) => {
		const auth = getFirebaseAuth();
		if (auth) {
			await signOut(auth);
		}
		setUser(null);
		setIsAuthenticated(false);
		if (shouldRedirect) {
			window.location.href = '/login';
		}
	};

	const navigateToLogin = () => {
		window.location.href = '/login';
	};

	const checkAppState = async () => {
		/* compat: antes recarregava estado Base44; Firebase atualiza via onAuthStateChanged */
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				isLoadingAuth,
				isLoadingPublicSettings: false,
				authError,
				appPublicSettings: null,
				logout,
				navigateToLogin,
				checkAppState,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
