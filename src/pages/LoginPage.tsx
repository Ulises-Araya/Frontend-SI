import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Shield, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simular autenticación
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Credenciales de ejemplo (en producción usarías una API real)
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({ username, role: 'admin' }));
      window.location.href = '/';
    } else if (username === 'operador' && password === 'operador123') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({ username, role: 'operator' }));
      window.location.href = '/';
    } else {
      setError('Credenciales incorrectas. Inténtalo de nuevo.');
    }

    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 ${
          isDarkMode ? 'bg-blue-500' : 'bg-blue-400'
        } blur-3xl`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 ${
          isDarkMode ? 'bg-purple-500' : 'bg-purple-400'
        } blur-3xl`}></div>
      </div>

      {/* Login Card */}
      <div className={`relative w-full max-w-md ${
        isDarkMode ? 'bg-slate-800/90' : 'bg-white/90'
      } backdrop-blur-xl rounded-3xl shadow-2xl border ${
        isDarkMode ? 'border-slate-700' : 'border-white/20'
      } p-8`}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
            isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
          }`}>
            <Shield className={`w-8 h-8 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Semáforos Inteligentes
          </h1>
          <p className={`text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            Sistema de Control de Tráfico
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Usuario
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                isDarkMode ? 'text-slate-400' : 'text-gray-400'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Contraseña
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                isDarkMode ? 'text-slate-400' : 'text-gray-400'
              }`}>
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                placeholder="Ingresa tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Register Link and Forgot Password */}
        <div className="mt-6 space-y-4">
          <div className="text-center">
            <a
              href="/register"
              className={`inline-flex items-center justify-center w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200'
              } shadow-lg hover:shadow-xl`}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Crear Nueva Cuenta
            </a>
          </div>
          <div className="text-center">
            <button
              className={`text-sm transition-colors ${
                isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => alert('Funcionalidad próximamente disponible')}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className={`mt-8 p-4 rounded-xl ${
          isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50/50'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 ${
            isDarkMode ? 'text-slate-300' : 'text-gray-700'
          }`}>
            Credenciales de Prueba:
          </h3>
          <div className={`text-xs space-y-1 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            <p><strong>Admin:</strong> admin / admin123</p>
            <p><strong>Operador:</strong> operador / operador123</p>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {isDarkMode ? (
              <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-slate-600"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}