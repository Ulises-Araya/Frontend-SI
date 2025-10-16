import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, Database } from 'lucide-react';
import { fetchTrafficEvents, computeHistoryMetrics, type TrafficEventRow } from '../api/history';
import { hasSupabaseConfig } from '../supabase/client';

function formatSensors(sensors: TrafficEventRow['sensors']): string {
  if (!sensors) return 'sin datos';
  return Object.entries(sensors)
    .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(1) : value}`)
    .join(' · ');
}

export function HistoricalPanel() {
  const enabled = hasSupabaseConfig();

  const query = useQuery({
    queryKey: ['history', { limit: 200 }],
    queryFn: () => fetchTrafficEvents(200),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });

  const metrics = useMemo(() => {
    if (!query.data) return null;
    return computeHistoryMetrics(query.data);
  }, [query.data]);

  if (!enabled) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900">
        <h2 className="text-lg font-semibold">Configura Supabase</h2>
        <p className="mt-1 text-sm">
          Define <code className="rounded bg-amber-200 px-1 py-0.5 font-mono">VITE_SUPABASE_URL</code> y{' '}
          <code className="rounded bg-amber-200 px-1 py-0.5 font-mono">VITE_SUPABASE_ANON_KEY</code> en
          <code className="rounded bg-amber-200 px-1 py-0.5 font-mono">Frontend/.env</code> para habilitar el historial.
        </p>
      </section>
    );
  }

  if (query.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
        Cargando historial...
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-rose-700">
        <p className="font-semibold">No se pudo cargar el historial</p>
        <p className="text-sm">{(query.error as Error).message}</p>
      </div>
    );
  }

  if (!query.data?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
        Aún no hay eventos guardados en Supabase.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Eventos</p>
            <Database className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics?.totalEvents ?? 0}</p>
          <p className="text-xs text-slate-500">Total almacenado</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Última hora</p>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics?.eventsLastHour ?? 0}</p>
          <p className="text-xs text-slate-500">Eventos registrados en los últimos 60 minutos</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dispositivos</p>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics?.uniqueDevices ?? 0}</p>
          <p className="text-xs text-slate-500">IDs únicos que enviaron eventos</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Detecciones por carril
        </h3>
        <ul className="mt-4 grid gap-3 text-sm">
          {metrics?.detectionsByLane.map(({ lane, count }) => (
            <li key={lane} className="flex items-center justify-between rounded-xl bg-slate-100/70 px-4 py-3">
              <span className="font-semibold capitalize text-slate-700">{lane}</span>
              <span className="font-mono text-slate-600">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Últimos eventos persistidos
        </h3>
        <div className="mt-4 grid gap-3">
          {query.data.slice(0, 12).map((event) => (
            <article
              key={event.id}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {new Date(event.received_at).toLocaleString()}
                  </span>
                  <span>·</span>
                  <span className="font-mono uppercase tracking-wide">
                    {event.device_id ?? 'unknown-device'}
                  </span>
                </div>
                {event.intersection_id ? (
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase text-slate-600">
                    {event.intersection_id}
                  </span>
                ) : null}
              </header>
              <p className="mt-2 text-xs text-slate-600">{formatSensors(event.sensors)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HistoricalPanel;
