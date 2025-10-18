import { BarChart3, Home, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isVisible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function Sidebar({ isDarkMode, toggleDarkMode, isVisible, onMouseEnter, onMouseLeave }: SidebarProps) {
  const location = useLocation();
  const activePage = location.pathname === '/analisis' ? 'analysis' : 'home';

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 z-20 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : '-translate-x-full'
      } ${isDarkMode ? 'bg-gray-800 text-white border-r border-gray-700' : 'bg-white text-black border-r border-gray-200'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="p-6">
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Semáforo Inteligente</h1>
      </div>
      <nav className="px-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/"
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition ${
                activePage === 'home'
                  ? isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-black'
                  : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <Home className="h-5 w-5" />
              Inicio
            </Link>
          </li>
          <li>
            <Link
              to="/analisis"
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition ${
                activePage === 'analysis'
                  ? isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-black'
                  : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              Análisis
            </Link>
          </li>
        </ul>
      </nav>
      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition ${
            isDarkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-100 text-black hover:bg-gray-200'
          }`}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;