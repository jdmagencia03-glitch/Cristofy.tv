import { FirebaseError } from 'firebase/app';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage, getFirebaseAuth } from '@/lib/firebase';
import { base44 } from '@/api/base44Client';

function firebaseErrorMessage(code, message) {
	if (code === 'storage/unauthorized') {
		return 'Sem permissão no Storage: publique as regras em Firebase Console → Storage → Regras (veja storage.rules no projeto) e faça login.';
	}
	if (code === 'storage/canceled') return 'Upload cancelado.';
	if (code === 'storage/unknown' || code === 'storage/retry-limit-exceeded') {
		return `Storage indisponível: ${message || code}`;
	}
	return message || code || 'Erro no Firebase Storage.';
}

async function tryBase44Upload(file) {
	const response = await base44.integrations.Core.UploadFile({ file });
	if (response?.file_url) return response.file_url;
	return null;
}

/**
 * Envia imagem e devolve uma URL permanente.
 * 1) Firebase Storage (usuário logado) — URL fica no projeto e não “some”.
 * 2) Fallback Base44 UploadFile (legado).
 */
export async function uploadImageFile(file) {
	if (!(file instanceof File)) {
		throw new Error('Arquivo inválido.');
	}
	if (!file.type.startsWith('image/')) {
		throw new Error('Selecione um arquivo de imagem.');
	}

	const storage = getFirebaseStorage();
	const auth = getFirebaseAuth();

	if (auth && typeof auth.authStateReady === 'function') {
		await auth.authStateReady();
	}

	const user = auth?.currentUser;

	if (storage && user) {
		const safe = (file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
		const path = `site-media/${user.uid}/${Date.now()}_${safe}`;
		const storageRef = ref(storage, path);
		try {
			await uploadBytes(storageRef, file, {
				contentType: file.type || 'image/jpeg',
			});
			return getDownloadURL(storageRef);
		} catch (err) {
			if (err instanceof FirebaseError) {
				const hint = firebaseErrorMessage(err.code, err.message);
				try {
					const url = await tryBase44Upload(file);
					if (url) return url;
				} catch {
					/* ignore */
				}
				throw new Error(hint);
			}
			try {
				const url = await tryBase44Upload(file);
				if (url) return url;
			} catch {
				/* ignore */
			}
			throw err instanceof Error ? err : new Error(String(err));
		}
	}

	try {
		const url = await tryBase44Upload(file);
		if (url) return url;
	} catch {
		/* segue */
	}

	throw new Error(
		'Faça login para enviar ao Firebase Storage (com Storage ativado no Console), ou cole uma URL HTTPS de imagem.'
	);
}
