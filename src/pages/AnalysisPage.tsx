import { Link } from 'react-router-dom';
import { LayoutGrid, LineChart, MapPinned, ArrowLeft, Sun, Moon, LogOut, Menu } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Analysis from '../components/Analysis';
import { useIntersections } from '../api/intersections';

export default function AnalysisPage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const [selectedIntersectionId] = useState<string | null>(() => {
    // Support both keys used across the app: 'selectedIntersection' (object) and 'selectedIntersectionId' (string)
    try {
      const raw = localStorage.getItem('selectedIntersection');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.id === 'string') return parsed.id;
      }
    } catch (e) {
      // ignore
    }
    const byId = localStorage.getItem('selectedIntersectionId');
    return byId ?? null;
  });

  const intersectionsQuery = useIntersections(selectedIntersectionId ? { ids: [selectedIntersectionId] } : {} , { staleTime: 30_000 });

  const intersectionName = useMemo(() => {
    const first = intersectionsQuery.data?.intersections?.[0];
    return first?.name ?? undefined;
  }, [intersectionsQuery.data]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-[1001] flex flex-col gap-4 border-r border-slate-200 bg-white/95 shadow-lg ring-1 ring-slate-900/5 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/95 ${
          sidebarVisible || sidebarExpanded ? 'w-56 translate-x-0' : 'w-16 -translate-x-full md:translate-x-0'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-6 ${sidebarVisible || sidebarExpanded ? '' : 'px-3'}`}>
          <span className={`text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 transition-opacity duration-200 ${
            sidebarVisible || sidebarExpanded ? 'opacity-100' : 'opacity-0'
          }`}>
            Paneles
          </span>
        </div>
        
        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2 px-4 pb-6">
          <Link to="/" className={`flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white ${
            sidebarVisible || sidebarExpanded ? 'w-auto h-auto px-3 py-2 gap-3' : 'justify-center items-center'
          } ${window.location.pathname === '/' ? 'bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}>
            <LayoutGrid className={`h-4 w-4 flex-shrink-0`} style={sidebarVisible || sidebarExpanded ? { paddingLeft: '12px !important' } : {}} />
            <span className={`transition-opacity duration-200 ${sidebarVisible || sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              Tiempo real
            </span>
          </Link>
          
          <Link to="/analisis" className={`flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white ${
            sidebarVisible || sidebarExpanded ? 'w-auto h-auto px-3 py-2 gap-3' : 'justify-center items-center'
          } ${window.location.pathname === '/analisis' ? 'bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}>
            <LineChart className={`h-4 w-4 flex-shrink-0`} style={sidebarVisible || sidebarExpanded ? { paddingLeft: '12px !important' } : {}} />
            <span className={`transition-opacity duration-200 ${sidebarVisible || sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              Análisis
            </span>
          </Link>
          
          <Link to="/intersecciones" className={`flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white ${
            sidebarVisible || sidebarExpanded ? 'w-auto h-auto px-3 py-2 gap-3' : 'justify-center items-center'
          } ${window.location.pathname === '/intersecciones' ? 'bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}>
            <MapPinned className={`h-4 w-4 flex-shrink-0`} style={sidebarVisible || sidebarExpanded ? { paddingLeft: '12px !important' } : {}} />
            <span className={`transition-opacity duration-200 ${sidebarVisible || sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              Intersecciones
            </span>
          </Link>
        </nav>
      </div>
      {/* Overlay for mobile sidebar */}
      {sidebarVisible && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/50 md:hidden" 
          onClick={() => setSidebarVisible(false)}
        />
      )}

      <main className={`flex-1 overflow-auto transition-all duration-300 md:ml-16 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
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
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
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
          </div>

        <div className="mb-8">
          <Analysis intersectionId={selectedIntersectionId} intersectionName={intersectionName} />
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