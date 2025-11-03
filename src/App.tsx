import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CloudOff,
  LayoutGrid,
  LineChart,
  MapPinned,
  Moon,
  Sun,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { fetchSnapshot, getApiBaseUrl, getBackendBaseUrl } from './api/client';
import type { CompositeSnapshot, LaneState } from './api/types';
import LaneCard from './components/LaneCard';
import AlertsPanel, { buildAlerts } from './components/AlertsPanel';
import { Analysis } from './components/Analysis';
import { IntersectionsDashboard } from './components/IntersectionsDashboard';
import { getSupabaseClient, hasSupabaseConfig } from './supabase/client';
import { useIntersections } from './api/intersections';

function formatQueue(queue: string[] | undefined): string {
  if (!queue || queue.length === 0) {
    return 'Vacía';
  }
  return queue.join(' → ');
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'realtime' | 'analysis' | 'intersections'>('realtime');
  const [now, setNow] = useState(() => Date.now());
  const [sseConnected, setSseConnected] = useState(false);
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
  const [selectedIntersectionName, setSelectedIntersectionName] = useState<string>(() => {
    const saved = localStorage.getItem('selectedIntersection');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.name || 'default';
    }
    return 'default';
  });
  const [navExpanded, setNavExpanded] = useState(false);
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (selectedIntersectionId && selectedIntersectionName !== 'default') {
      localStorage.setItem('selectedIntersection', JSON.stringify({ id: selectedIntersectionId, name: selectedIntersectionName }));
    } else {
      localStorage.removeItem('selectedIntersection');
    }
  }, [selectedIntersectionId, selectedIntersectionName]);

  const latestTimestampRef = useRef<Record<string, number>>({});
  const queryClient = useQueryClient();
  const activeSnapshotKey = selectedIntersectionId ?? 'default';

  const query = useQuery({
    queryKey: ['snapshot', activeSnapshotKey],
    queryFn: async () => {
      const result = await fetchSnapshot(selectedIntersectionId);
      const incomingTs = result.traffic?.timestamp ?? 0;
      const previousTs = latestTimestampRef.current[activeSnapshotKey] ?? 0;

      if (previousTs && incomingTs && incomingTs < previousTs) {
        const current = queryClient.getQueryData<CompositeSnapshot>(['snapshot', activeSnapshotKey]);
        return current ?? result;
      }

      if (incomingTs > previousTs) {
        latestTimestampRef.current[activeSnapshotKey] = incomingTs;
      }

      return result;
    },
    refetchInterval: activeTab === 'realtime' ? 2000 : false,
  });

  const supabaseEnabled = hasSupabaseConfig();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const streamUrl = useMemo(() => {
    const apiBase = getApiBaseUrl();
    return apiBase ? `${apiBase}/api/traffic/stream` : '/api/traffic/stream';
  }, []);

  const intersectionsQuery = useIntersections({});

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel('traffic-events-listener')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'traffic_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['snapshot'] });
          queryClient.invalidateQueries({ queryKey: ['history'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    const source = new EventSource(streamUrl);

    const updateTraffic = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const normalizedId =
          typeof data?.intersectionId === 'string' && data.intersectionId
            ? data.intersectionId
            : 'default';

        queryClient.setQueryData<CompositeSnapshot>(['snapshot', normalizedId], (prev) => {
          const incomingTs = data?.timestamp ?? 0;
          const previousTs = latestTimestampRef.current[normalizedId] ?? 0;

          if (previousTs && incomingTs && incomingTs < previousTs) {
            return prev ?? { traffic: data };
          }

          if (incomingTs > previousTs) {
            latestTimestampRef.current[normalizedId] = incomingTs;
          }

          return { traffic: data };
        });
      } catch (error) {
        console.error('[sse] No se pudo parsear traffic-state', error);
      }
    };

    source.onopen = () => setSseConnected(true);
    source.onerror = () => setSseConnected(false);
    source.addEventListener('traffic-state', updateTraffic as EventListener);

    return () => {
      source.removeEventListener('traffic-state', updateTraffic as EventListener);
      source.close();
      setSseConnected(false);
    };
  }, [queryClient, streamUrl]);

  const traffic = query.data?.traffic ?? null;
  const lanes = traffic?.lanes ?? [];
  const backendUrl = useMemo(() => getBackendBaseUrl(), []);

  const lastUpdatedAt = traffic?.timestamp ?? null;
  const alerts = useMemo(() => buildAlerts(traffic, lastUpdatedAt, now, sseConnected), [traffic, lastUpdatedAt, now, sseConnected]);

  const handleSelectIntersection = useCallback((intersectionId: string | null) => {
    setSelectedIntersectionId(intersectionId);
    if (intersectionId) {
      const name = intersectionsQuery.data?.intersections.find(i => i.id === intersectionId)?.name || 'default';
      setSelectedIntersectionName(name);
    } else {
      setSelectedIntersectionName('default');
    }
  }, [intersectionsQuery.data]);

  const handleSidebarEnter = useCallback(() => {
    setNavExpanded(true);
  }, []);

  const handleSidebarLeave = useCallback(() => {
    setNavExpanded(false);
  }, []);

  const navButtonClasses = useCallback((tab: 'realtime' | 'analysis' | 'intersections') => {
    return activeTab === tab
      ? 'flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow dark:bg-slate-100 dark:text-slate-900'
      : 'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60';
  }, [activeTab]);

  const handleNavClick = useCallback((tab: 'realtime' | 'analysis' | 'intersections') => {
    setActiveTab(tab);
    setNavExpanded(false);
  }, [setActiveTab]);

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="relative flex w-full">
        <div
          aria-hidden="true"
          className="fixed inset-y-0 left-0 z-[1000] w-3 cursor-pointer bg-transparent"
          onMouseEnter={handleSidebarEnter}
        />
        <aside
          className={`fixed inset-y-0 left-0 z-[1001] flex w-56 transform flex-col gap-4 border-r border-slate-200 bg-white/95 px-4 py-6 shadow-lg ring-1 ring-slate-900/5 transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900/95 ${navExpanded ? 'translate-x-0' : '-translate-x-full'}`}
          onMouseEnter={handleSidebarEnter}
          onMouseLeave={handleSidebarLeave}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Paneles
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-2">
            <button type="button" onClick={() => handleNavClick('realtime')} className={navButtonClasses('realtime')}>
              <LayoutGrid className="h-4 w-4" />
              Tiempo real
            </button>
            <button type="button" onClick={() => handleNavClick('analysis')} className={navButtonClasses('analysis')}>
              <LineChart className="h-4 w-4" />
              Análisis
            </button>
            <button type="button" onClick={() => handleNavClick('intersections')} className={navButtonClasses('intersections')}>
              <MapPinned className="h-4 w-4" />
              Intersecciones
            </button>
          </nav>
          {!supabaseEnabled && activeTab === 'analysis' ? (
            <p className="text-xs text-amber-600">
              Configura Supabase para habilitar el análisis.
            </p>
          ) : null}
        </aside>
        <main className={`relative flex-1 overflow-auto transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-slate-100">
                  {activeTab === 'analysis' ? 'Análisis de desempeño' : activeTab === 'intersections' ? 'Intersecciones' : 'Semáforo inteligente – tablero de pruebas'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
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
                <span
                  className={
                    sseConnected
                      ? 'inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }
                >
                  {sseConnected ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  Tiempo real
                </span>
              </div>
            </header>

            {!supabaseEnabled && activeTab === 'analysis' ? (
              <span className="text-xs text-amber-600">
                Configura Supabase para habilitar el análisis.
              </span>
            ) : null}

            {query.error ? (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 dark:border-rose-800 dark:bg-rose-900 dark:text-rose-300">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">No se pudo obtener el estado</p>
                  <p className="text-sm">{(query.error as Error).message}</p>
                </div>
              </div>
            ) : null}

            {activeTab === 'realtime' ? (
              <div className="grid gap-6 lg:[grid-template-columns:minmax(11rem,18rem)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6 lg:max-w-[18rem]">
                  <section className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Cola de prioridad</h2>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{formatQueue(traffic?.queue)}</p>
                    </div>
                  </section>
                  <section className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Estado general</h2>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-800">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          {sseConnected ? (
                            <Wifi className="h-4 w-4 text-green-500" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-500" />
                          )}
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {sseConnected ? 'Conectado al backend' : 'Backend desconectado'}
                          </p>
                        </div>
                        {traffic?.databaseConnected !== undefined && (
                          <div className="flex items-center gap-2">
                            {traffic.databaseConnected ? (
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                            )}
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              Base de datos: {traffic.databaseConnected ? 'Conectada' : 'Desconectada'}
                            </p>
                          </div>
                        )}
                        {traffic?.esp32Connected !== undefined && (
                          <div className="flex items-center gap-2">
                            {traffic.esp32Connected ? (
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                            )}
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              ESP32: {traffic.esp32Connected ? 'Conectado' : 'Desconectado'}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Intersección: {selectedIntersectionName}
                        </p>
                      </div>
                    </div>
                  </section>
                  <AlertsPanel alerts={alerts} />
                </div>
                <section className="flex flex-col gap-4">
                  <h2 className="text-lg font-semibold text-slate-800">Estado por carril</h2>
                  {lanes.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      <CloudOff className="h-5 w-5" />
                      Aún no hay datos disponibles.
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {lanes.map((lane: LaneState, index) => (
                        <LaneCard key={lane.id} lane={lane} index={index} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {activeTab === 'analysis' ? <Analysis intersectionId={selectedIntersectionId} intersectionName={selectedIntersectionName} /> : null}
            {activeTab === 'intersections' ? (
              <IntersectionsDashboard
                activeIntersectionId={selectedIntersectionId}
                onSelectIntersection={handleSelectIntersection}
              />
            ) : null}

            <footer className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:items-center">
              <p>
                Actualizado{' '}
                {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : 'sin datos'}
              </p>
              <div className="flex flex-col items-start gap-1 text-xs sm:items-end">
                <p className="font-mono">Versión app: {__APP_VERSION__}</p>
                <p className="font-mono text-slate-400">Backend: {backendUrl}</p>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
