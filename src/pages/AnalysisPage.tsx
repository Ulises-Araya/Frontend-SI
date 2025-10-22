import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowLeft, BarChart3, Clock3, Gauge, RefreshCw, Sun, Moon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { fetchAnalyticsOverview } from '../api/client';
import type {
  AnalyticsOverview,
  GreenShareSummary,
  LaneDurationSummary,
  PhaseTransitionCount,
  PresenceSample,
} from '../api/types';

const WAIT_BUCKETS = [
  { label: '0-5 s', min: 0, max: 5_000 },
  { label: '5-10 s', min: 5_000, max: 10_000 },
  { label: '10-20 s', min: 10_000, max: 20_000 },
  { label: '20-40 s', min: 20_000, max: 40_000 },
  { label: '40-60 s', min: 40_000, max: 60_000 },
  { label: '> 60 s', min: 60_000, max: Number.POSITIVE_INFINITY },
];

const LANE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626'];

function buildLaneKeys(data: AnalyticsOverview | undefined): string[] {
  if (!data) {
    return [];
  }

  const keys = new Set<string>();
  data.transitionCounts.forEach((item) => keys.add(item.laneKey));
  data.laneDurations.forEach((item) => keys.add(item.laneKey));
  data.presenceSamples.forEach((item) => keys.add(item.laneKey));
  data.greenShare.forEach((item) => keys.add(item.laneKey));
  return Array.from(keys).sort();
}

function buildTransitionDataset(transitionCounts: PhaseTransitionCount[], laneKeys: string[]) {
  return laneKeys.map((laneKey) => {
    const toGreen = transitionCounts.find((item) => item.laneKey === laneKey && item.toState === 'green');
    const toRed = transitionCounts.find((item) => item.laneKey === laneKey && item.toState === 'red');
    return {
      laneKey,
      toGreen: toGreen?.count ?? 0,
      toRed: toRed?.count ?? 0,
    };
  });
}

function buildWaitHistogram(samples: PresenceSample[], laneKeys: string[]) {
  const buckets = WAIT_BUCKETS.map((bucket) => {
    const entry: Record<string, number | string> = { bucket: bucket.label };
    laneKeys.forEach((laneKey) => {
      entry[laneKey] = 0;
    });
    return entry;
  });

  samples.forEach((sample) => {
    const bucket = WAIT_BUCKETS.find((range) => sample.waitMs >= range.min && sample.waitMs < range.max);
    if (!bucket) {
      return;
    }
    const entry = buckets.find((item) => item.bucket === bucket.label);
    if (!entry) {
      return;
    }
    entry[sample.laneKey] = (entry[sample.laneKey] as number) + 1;
  });

  return buckets;
}

function buildDurationDataset(laneDurations: LaneDurationSummary[]) {
  return laneDurations.map((item) => ({
    laneKey: item.laneKey,
    greenSeconds: item.greenMs / 1_000,
    redSeconds: item.redMs / 1_000,
  }));
}

function buildGreenTrendDataset(trend: AnalyticsOverview['greenCycleTrend']) {
  return trend.map((item) => ({
    label: new Date(item.bucket).toLocaleString('es-CR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    avgGreenSeconds: item.avgGreenMs / 1_000,
    sampleCount: item.sampleCount,
  }));
}

function buildGreenShareByLane(greenShare: GreenShareSummary[], laneKeys: string[]) {
  return laneKeys.map((laneKey) => {
    const summary = greenShare.find((item) => item.laneKey === laneKey);
    return {
      laneKey,
      greenRatio: summary?.greenRatio ?? 0,
    };
  });
}

const pieColors = ['#16a34a', '#64748b'];

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AnalysisPage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const analyticsQuery = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: fetchAnalyticsOverview,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  const laneKeys = useMemo(() => buildLaneKeys(analyticsQuery.data), [analyticsQuery.data]);

  const transitionDataset = useMemo(
    () => buildTransitionDataset(analyticsQuery.data?.transitionCounts ?? [], laneKeys),
    [analyticsQuery.data?.transitionCounts, laneKeys],
  );

  const waitHistogramDataset = useMemo(
    () => buildWaitHistogram(analyticsQuery.data?.presenceSamples ?? [], laneKeys),
    [analyticsQuery.data?.presenceSamples, laneKeys],
  );

  const durationDataset = useMemo(
    () => buildDurationDataset(analyticsQuery.data?.laneDurations ?? []),
    [analyticsQuery.data?.laneDurations],
  );

  const greenTrendDataset = useMemo(
    () => buildGreenTrendDataset(analyticsQuery.data?.greenCycleTrend ?? []),
    [analyticsQuery.data?.greenCycleTrend],
  );

  const greenShareDataset = useMemo(
    () => buildGreenShareByLane(analyticsQuery.data?.greenShare ?? [], laneKeys),
    [analyticsQuery.data?.greenShare, laneKeys],
  );

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="fixed left-0 top-0 z-10 h-full w-8" onMouseEnter={() => setSidebarVisible(true)} />
      <Sidebar
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode((value) => !value)}
        isVisible={sidebarVisible}
        onMouseEnter={() => setSidebarVisible(true)}
        onMouseLeave={() => setSidebarVisible(false)}
      />
      <main className={`flex-1 overflow-auto ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to="/"
                className="mb-2 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ArrowLeft className="h-4 w-4" /> Volver al panel principal
              </Link>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Análisis de desempeño</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Estadísticas generadas directamente desde Supabase. Actualización automática cada minuto.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDarkMode((value) => !value)}
                className="relative inline-flex h-7 w-14 items-center rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-600"
              >
                <span
                  className={`absolute left-1 top-1 flex h-5 w-5 transform items-center justify-center rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-7' : 'translate-x-0'
                  }`}
                >
                  {isDarkMode ? <Sun className="h-3 w-3 text-yellow-500" /> : <Moon className="h-3 w-3 text-slate-600" />}
                </span>
              </button>
              <button
                type="button"
                onClick={() => analyticsQuery.refetch()}
                disabled={analyticsQuery.isFetching}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                <RefreshCw className={`h-4 w-4 ${analyticsQuery.isFetching ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>

          {analyticsQuery.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-800 dark:bg-rose-900 dark:text-rose-200">
              <p className="font-semibold">No se pudo obtener la información analítica.</p>
              <p className="text-sm">{(analyticsQuery.error as Error).message}</p>
            </div>
          ) : null}

          {analyticsQuery.isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-card dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Procesando datos históricos…
            </div>
          ) : null}

          {analyticsQuery.data ? (
            <div className="space-y-8">
              <section className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Transiciones registradas</p>
                  </div>
                  <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                    {analyticsQuery.data.transitionCounts.reduce((acc, item) => acc + item.count, 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900">
                      <Clock3 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Eventos de espera analizados</p>
                  </div>
                  <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                    {analyticsQuery.data.presenceSamples.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                      <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Intersección analizada</p>
                  </div>
                  <p className="break-all text-sm text-slate-500 dark:text-slate-400">
                    {analyticsQuery.data.intersectionId}
                  </p>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Cambios por estado (histograma)</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transitionDataset}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                        <XAxis dataKey="laneKey" stroke={isDarkMode ? '#cbd5f5' : '#475569'} />
                        <YAxis stroke={isDarkMode ? '#cbd5f5' : '#475569'} allowDecimals={false} />
                        <Tooltip formatter={(value: number) => [value, 'Cambios']} labelFormatter={(label) => `Carril ${label}`} />
                        <Legend />
                        <Bar dataKey="toGreen" name="Pasadas a verde" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="toRed" name="Pasadas a rojo" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Distribución de tiempo en cola
                  </h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waitHistogramDataset}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                        <XAxis dataKey="bucket" stroke={isDarkMode ? '#cbd5f5' : '#475569'} />
                        <YAxis stroke={isDarkMode ? '#cbd5f5' : '#475569'} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        {laneKeys.map((laneKey, index) => (
                          <Bar key={laneKey} dataKey={laneKey} name={`Carril ${laneKey}`} fill={LANE_COLORS[index % LANE_COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Tiempo promedio por carril
                  </h2>
                  <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                    Promedio de duración por ciclo (segundos) considerando los registros más recientes.
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={durationDataset}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                        <XAxis dataKey="laneKey" stroke={isDarkMode ? '#cbd5f5' : '#475569'} />
                        <YAxis stroke={isDarkMode ? '#cbd5f5' : '#475569'} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="greenSeconds" stackId="time" name="Tiempo en verde (s)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="redSeconds" stackId="time" name="Tiempo en rojo (s)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Duración promedio de ciclos verdes
                  </h2>
                  <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                    Promedio calculado en ventanas de 10 segundos sobre las transiciones más recientes.
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={greenTrendDataset}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                        <XAxis dataKey="label" stroke={isDarkMode ? '#cbd5f5' : '#475569'} />
                        <YAxis stroke={isDarkMode ? '#cbd5f5' : '#475569'} />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)} s`, 'Promedio']} />
                        <Legend />
                        <Line type="monotone" dataKey="avgGreenSeconds" name="Segundos" stroke="#38bdf8" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Porcentaje de tiempo en verde por carril
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {greenShareDataset.map((item, index) => (
                    <div
                      key={item.laneKey}
                      className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card dark:border-slate-700 dark:bg-slate-800"
                    >
                      <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Carril {item.laneKey}</h3>
                      <div className="mx-auto h-40 w-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              dataKey="value"
                              data={[
                                { name: 'verde', value: item.greenRatio },
                                { name: 'rojo', value: Math.max(0, 1 - item.greenRatio) },
                              ]}
                              innerRadius="60%"
                              outerRadius="100%"
                              startAngle={90}
                              endAngle={-270}
                            >
                              {[
                                { name: 'verde', value: item.greenRatio },
                                { name: 'rojo', value: Math.max(0, 1 - item.greenRatio) },
                              ].map((slice, sliceIndex) => (
                                <Cell key={slice.name} fill={pieColors[sliceIndex]} opacity={sliceIndex === 0 ? 1 : 0.4} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {formatPercentage(item.greenRatio)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tiempo en verde vs. total registrado</p>
                    </div>
                  ))}
                  {greenShareDataset.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Aún no hay datos suficientes.</p>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}