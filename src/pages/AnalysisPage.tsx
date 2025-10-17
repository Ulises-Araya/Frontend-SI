import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Activity, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function AnalysisPage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="fixed left-0 top-0 w-8 h-full z-10" onMouseEnter={() => setSidebarVisible(true)} />
      <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} isVisible={sidebarVisible} onMouseEnter={() => setSidebarVisible(true)} onMouseLeave={() => setSidebarVisible(false)} />
      <main className={`flex-1 overflow-auto ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al panel principal
              </Link>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Análisis Estadístico
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Página en construcción. Aquí se mostrarán gráficos y estadísticas detalladas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="relative inline-flex h-7 w-14 items-center rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-600"
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 transform rounded-full bg-white transition-transform flex items-center justify-center ${
                  isDarkMode ? 'translate-x-7' : 'translate-x-0'
                }`}
              >
                {isDarkMode ? (
                  <Sun className="h-3 w-3 text-yellow-500" />
                ) : (
                  <Moon className="h-3 w-3 text-slate-600" />
                )}
              </span>
            </button>
          </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Flujo de Vehículos
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Análisis del flujo vehicular por hora y día de la semana.
            </p>
            <div className="mt-4">
              <iframe 
                src="https://app.powerbi.com/view?r=tu-enlace-flujo-vehicular" 
                width="100%" 
                height="300" 
                frameBorder="0" 
                allowFullScreen={true}
                className="rounded-lg"
              ></iframe>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Eficiencia del Sistema
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Métricas de rendimiento y optimización del sistema de semáforos.
            </p>
            <div className="mt-4">
              <iframe 
                src="https://app.powerbi.com/view?r=tu-enlace-eficiencia" 
                width="100%" 
                height="300" 
                frameBorder="0" 
                allowFullScreen={true}
                className="rounded-lg"
              ></iframe>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Patrones de Congestión
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Identificación de patrones de tráfico y puntos de congestión.
            </p>
            <div className="mt-4">
              <iframe 
                src="https://app.powerbi.com/view?r=tu-enlace-congestion" 
                width="100%" 
                height="300" 
                frameBorder="0" 
                allowFullScreen={true}
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-card border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Funcionalidades Planificadas
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ul className="space-y-3 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Gráficos interactivos de flujo vehicular</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Análisis de eficiencia por intersección</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Predicciones de tráfico basadas en IA</span>
              </li>
            </ul>
            <ul className="space-y-3 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Reportes automáticos de rendimiento</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Comparativas históricas mensuales</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Alertas de anomalías en el sistema</span>
              </li>
            </ul>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}