import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon, GoogleIcon, MicrosoftIcon } from '../../components/icons';
import { useTheme } from '../contexts/ThemeContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { theme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email/phone and password.');
      return;
    }
    setIsLoggingIn(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] font-sans relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Glows */}
      {theme === 'dark' && (
        <>
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-600/20 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-600/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </>
      )}

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-2xl shadow-emerald-500/10">
          <div className="flex flex-col items-center mb-6">
            <LogoIcon className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TRUBank HR Portal</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-lg p-3 mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email or Phone Number
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-gray-200/50 dark:bg-black/40 border rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-white/20 focus:ring-emerald-500'
                }`}
                placeholder="you@trubank.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <a href="#" className="text-sm text-emerald-500 hover:text-emerald-400">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-gray-200/50 dark:bg-black/40 border rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-white/20 focus:ring-emerald-500'
                }`}
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

           <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-400 dark:border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">Or sign in with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 w-full bg-white/80 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-800 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                    <GoogleIcon className="w-5 h-5"/>
                    Google
                </button>
                 <button className="flex items-center justify-center gap-3 w-full bg-white/80 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-800 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                    <MicrosoftIcon className="w-5 h-5"/>
                    Microsoft
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;