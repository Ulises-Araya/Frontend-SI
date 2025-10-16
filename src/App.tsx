import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CloudOff,
  LayoutGrid,
  LineChart,
  Loader2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { fetchSnapshot, getApiBaseUrl, getBackendBaseUrl } from './api/client';
import type { CompositeSnapshot, LaneState } from './api/types';
import LaneCard from './components/LaneCard';
import AlertsPanel, { buildAlerts } from './components/AlertsPanel';
import HistoricalPanel from './components/HistoricalPanel';
import { getSupabaseClient, hasSupabaseConfig } from './supabase/client';

function formatQueue(queue: string[] | undefined): string {
  if (!queue || queue.length === 0) {
    return 'Vacía';
  }
  return queue.join(' → ');
}

export default function App() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'realtime' | 'history'>('realtime');
  const [now, setNow] = useState(() => Date.now());
  const [sseConnected, setSseConnected] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const latestTimestampRef = useRef<number>(0);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['snapshot'],
    queryFn: async () => {
      const result = await fetchSnapshot();
      const incomingTs = result.traffic?.timestamp ?? 0;
      if (latestTimestampRef.current && incomingTs && incomingTs < latestTimestampRef.current) {
        const current = queryClient.getQueryData<CompositeSnapshot>(['snapshot']);
        return current ?? result;
      }
      if (incomingTs > latestTimestampRef.current) {
        latestTimestampRef.current = incomingTs;
      }
      return result;
    },
    refetchInterval: activeTab === 'realtime' && autoRefresh ? 2000 : false,
  });

  const supabaseEnabled = hasSupabaseConfig();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const streamUrl = useMemo(() => {
    const apiBase = getApiBaseUrl();
    return apiBase ? `${apiBase}/api/traffic/stream` : '/api/traffic/stream';
  }, []);

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
        queryClient.setQueryData<CompositeSnapshot>(['snapshot'], (prev) => {
          const incomingTs = data?.timestamp ?? 0;
          if (latestTimestampRef.current && incomingTs && incomingTs < latestTimestampRef.current) {
            return prev ?? { traffic: data };
          }
          if (incomingTs > latestTimestampRef.current) {
            latestTimestampRef.current = incomingTs;
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
  const alerts = useMemo(() => buildAlerts(traffic, lastUpdatedAt, now), [traffic, lastUpdatedAt, now]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            {activeTab === 'realtime' ? 'Panel en tiempo real' : 'Analítica histórica'}
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Semáforo inteligente – tablero de pruebas
          </h1>
          <p className="text-sm text-slate-500">
            Backend activo en <span className="font-mono text-slate-700">{backendUrl}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {query.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setAutoRefresh((value: boolean) => !value)}
            disabled={activeTab !== 'realtime'}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'realtime'
                ? 'border-slate-300 text-slate-700 hover:border-slate-500 hover:text-slate-900'
                : 'cursor-not-allowed border-slate-200 text-slate-400'
            }`}
          >
            {autoRefresh ? (
              <ToggleRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-slate-400" />
            )}
            Auto ({autoRefresh ? 'ON' : 'OFF'})
          </button>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              sseConnected
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('realtime')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'realtime' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Tiempo real
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'history' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
            }`}
          >
            <LineChart className="h-4 w-4" />
            Histórico
          </button>
        </div>
        {!supabaseEnabled && activeTab === 'history' ? (
          <span className="text-xs text-amber-600">
            Configura Supabase para habilitar el historial.
          </span>
        ) : null}
      </div>

      {query.error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold">No se pudo obtener el estado</p>
            <p className="text-sm">{(query.error as Error).message}</p>
          </div>
        </div>
      ) : null}

      {activeTab === 'realtime' ? (
        <>
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Cola de prioridad
              </p>
              <p className="text-lg font-semibold text-slate-900">{formatQueue(traffic?.queue)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Estado general
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {traffic ? 'Recibiendo datos del controlador' : 'En espera de datos'}
              </p>
              {lastUpdatedAt ? (
                <p className="mt-2 text-xs text-slate-500">
                  Última actualización {new Date(lastUpdatedAt).toLocaleTimeString()}
                </p>
              ) : null}
            </div>
          </section>

          <AlertsPanel alerts={alerts} />

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Estado por carril</h2>
            {lanes.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-slate-500">
                <CloudOff className="h-5 w-5" />
                Aún no hay datos disponibles.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {lanes.map((lane: LaneState, index) => (
                  <LaneCard key={lane.id} lane={lane} index={index} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-800">Telemetría del controlador</h2>
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              La información en tiempo real proviene directamente del backend mediante Server-Sent Events
              (SSE). Aquí se muestran únicamente los estados del controlador y de sus carriles.
            </p>
          </section>
        </>
      ) : null}

      {activeTab === 'history' ? <HistoricalPanel /> : null}

      <footer className="mt-auto flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
        <p>
          Actualizado{' '}
          {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : 'sin datos'}
        </p>
        <p className="font-mono">Versión app: {__APP_VERSION__}</p>
      </footer>
    </div>
  );
}
