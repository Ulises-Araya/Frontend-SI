import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { LayoutGrid, LineChart, MapPinned, Moon, Sun, LogOut, Menu } from 'lucide-react';
import { IntersectionsDashboard } from '../components/IntersectionsDashboard';

export default function IntersectionsPage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('selectedIntersection');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.id || null;
    }
    return null;
  });
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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

  useEffect(() => {
    if (selectedIntersectionId) {
      localStorage.setItem('selectedIntersection', JSON.stringify({ id: selectedIntersectionId }));
    } else {
      localStorage.removeItem('selectedIntersection');
    }
  }, [selectedIntersectionId]);

  const handleSelectIntersection = useCallback((intersectionId: string | null) => {
    setSelectedIntersectionId(intersectionId);
  }, []);

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
          <Link to="/" className={`flex items-center justify-center gap-3 rounded-full w-8 h-8 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white ${
            sidebarVisible || sidebarExpanded ? 'w-auto h-auto px-3 py-2' : 'justify-center items-center'
          } ${window.location.pathname === '/' ? 'bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}>
            <LayoutGrid className={`h-4 w-4 flex-shrink-0`} style={sidebarVisible || sidebarExpanded ? { paddingLeft: '12px !important' } : {}} />
            <span className={`transition-opacity duration-200 ${sidebarVisible || sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              Tiempo real
            </span>
          </Link>
          
          <Link to="/analisis" className={`flex items-center justify-center gap-3 rounded-full w-8 h-8 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white ${
            sidebarVisible || sidebarExpanded ? 'w-auto h-auto px-3 py-2' : 'justify-center items-center'
          } ${window.location.pathname === '/analisis' ? 'bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}>
            <LineChart className={`h-4 w-4 flex-shrink-0`} style={sidebarVisible || sidebarExpanded ? { paddingLeft: '12px !important' } : {}} />
            <span className={`transition-opacity duration-200 ${sidebarVisible || sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              Análisis
            </span>
          </Link>
          
          <Link to="/intersecciones" className={`flex items-center justify-center gap-3 rounded-full w-8 h-8 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white ${
            sidebarVisible || sidebarExpanded ? 'w-auto h-auto px-3 py-2' : 'justify-center items-center'
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

      <main className={`relative flex-1 overflow-auto transition-colors duration-300 md:ml-16 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-slate-100">
                Intersecciones
              </h1>
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
                  className={`absolute left-1 top-1 flex h-5 w-5 transform items-center justify-center rounded-full bg-white transition-transform ${
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
          </header>

          <IntersectionsDashboard
            activeIntersectionId={selectedIntersectionId}
            onSelectIntersection={handleSelectIntersection}
          />

          <footer className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:items-center">
            <p>Gestión de intersecciones</p>
          </footer>
        </div>
      </main>
    </div>
  );
}