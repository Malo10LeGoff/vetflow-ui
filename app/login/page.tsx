'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'signup';
type UserRole = 'VET' | 'ASV' | 'ADMIN';

const roles: { value: UserRole; label: string }[] = [
  { value: 'VET', label: 'Vétérinaire' },
  { value: 'ASV', label: 'ASV (Auxiliaire Spécialisé Vétérinaire)' },
  { value: 'ADMIN', label: 'Administrateur' },
];

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('VET');
  const [signupActivationCode, setSignupActivationCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      router.push('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (signupPassword !== signupConfirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        activation_code: signupActivationCode,
        email: signupEmail,
        password: signupPassword,
        role: signupRole,
        first_name: signupFirstName,
        last_name: signupLastName,
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('activation')) {
          setError('Code d\'activation invalide');
        } else if (err.message.includes('exists')) {
          setError('Un compte existe déjà avec cet email');
        } else {
          setError('Une erreur est survenue lors de l\'inscription');
        }
      } else {
        setError('Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">VetFlow</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestion hospitalière équine
          </p>
        </div>

        {/* Auth Card */}
        <div className="card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Inscription
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              /* Login Form */
              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="login-email" className="label">
                    Adresse email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input"
                    placeholder="nom@clinique.com"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="label">
                    Mot de passe
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="input"
                    placeholder="Entrez votre mot de passe"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 text-base"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Connexion en cours...
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </button>

              </form>
            ) : (
              /* Signup Form */
              <form className="space-y-4" onSubmit={handleSignup}>
                <div>
                  <label htmlFor="signup-activation" className="label">
                    Code d&apos;activation de la clinique
                  </label>
                  <input
                    id="signup-activation"
                    type="text"
                    required
                    value={signupActivationCode}
                    onChange={(e) => setSignupActivationCode(e.target.value)}
                    className="input font-mono uppercase"
                    placeholder="Ex: DEMO2024"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ce code vous a été fourni par votre clinique
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="signup-first-name" className="label">
                      Prénom
                    </label>
                    <input
                      id="signup-first-name"
                      type="text"
                      required
                      value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)}
                      className="input"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-last-name" className="label">
                      Nom
                    </label>
                    <input
                      id="signup-last-name"
                      type="text"
                      required
                      value={signupLastName}
                      onChange={(e) => setSignupLastName(e.target.value)}
                      className="input"
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-email" className="label">
                    Adresse email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="input"
                    placeholder="nom@clinique.com"
                  />
                </div>

                <div>
                  <label htmlFor="signup-role" className="label">
                    Rôle
                  </label>
                  <select
                    id="signup-role"
                    required
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="input"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="signup-password" className="label">
                    Mot de passe
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="input"
                    placeholder="Minimum 6 caractères"
                  />
                </div>

                <div>
                  <label htmlFor="signup-confirm-password" className="label">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="input"
                    placeholder="Retapez votre mot de passe"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 text-base mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Inscription en cours...
                    </span>
                  ) : (
                    'Créer mon compte'
                  )}
                </button>

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
