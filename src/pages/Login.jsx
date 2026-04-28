import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function Login() {
	const { isAuthenticated } = useAuth();
	const [mode, setMode] = useState('login');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	if (isAuthenticated) {
		return <Navigate to="/ProfileSelect" replace />;
	}

	const submit = async (e) => {
		e.preventDefault();
		setError('');
		const auth = getFirebaseAuth();
		if (!auth) {
			setError('Firebase não configurado.');
			return;
		}
		if (!email.trim() || !password) {
			setError('Preencha e-mail e senha.');
			return;
		}

		setLoading(true);
		try {
			if (mode === 'login') {
				await signInWithEmailAndPassword(auth, email.trim(), password);
			} else {
				await createUserWithEmailAndPassword(auth, email.trim(), password);
			}
		} catch (err) {
			const map = {
				'auth/email-already-in-use': 'Este e-mail já está cadastrado. Faça login.',
				'auth/invalid-email': 'E-mail inválido.',
				'auth/weak-password': 'Senha fraca (use pelo menos 6 caracteres).',
				'auth/user-not-found': 'Usuário não encontrado.',
				'auth/wrong-password': 'Senha incorreta.',
				'auth/invalid-credential': 'E-mail ou senha incorretos.',
			};
			setError(map[err.code] || err.message || 'Não foi possível entrar.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-black mb-2">
						<span className="text-[#E50914]">Cristo</span>
						<span className="text-[#FFC107]">Fy</span>
					</h1>
					<p className="text-gray-400">
						{mode === 'login' ? 'Entre com sua conta' : 'Crie sua conta'}
					</p>
				</div>

				<form onSubmit={submit} className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 space-y-4">
					<Input
						type="email"
						autoComplete="email"
						placeholder="E-mail"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="bg-[#2A2A2A] border-none text-white"
					/>
					<Input
						type="password"
						autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
						placeholder="Senha"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="bg-[#2A2A2A] border-none text-white"
					/>

					{error && (
						<p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
					)}

					<Button
						type="submit"
						disabled={loading}
						className="w-full bg-[#E50914] hover:bg-[#FF3D3D] py-3"
					>
						{loading ? (
							<Loader2 className="w-5 h-5 animate-spin mx-auto" />
						) : mode === 'login' ? (
							'Entrar'
						) : (
							'Cadastrar'
						)}
					</Button>

					<button
						type="button"
						onClick={() => {
							setMode(mode === 'login' ? 'register' : 'login');
							setError('');
						}}
						className="w-full text-sm text-gray-400 hover:text-white py-2"
					>
						{mode === 'login'
							? 'Não tem conta? Cadastre-se'
							: 'Já tem conta? Entrar'}
					</button>
				</form>
			</div>
		</div>
	);
}
