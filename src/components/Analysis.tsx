import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
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
import { BarChart3, Gauge } from 'lucide-react';
import { fetchAnalyticsOverview } from '../api/client';
import type {
  AnalyticsOverview,
  GreenShareSummary,
  LaneDurationSummary,
  PhaseTransitionCount,
  PresenceSample,
} from '../api/types';

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
    return {
      laneKey,
      changes: toGreen?.count ?? 0,
    };
  });
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

export function Analysis({ intersectionId, intersectionName }: { intersectionId?: string | null; intersectionName?: string }) {
  const analyticsQuery = useQuery<AnalyticsOverview, Error>({
    queryKey: ['analytics-overview', intersectionId],
    queryFn: () => fetchAnalyticsOverview(intersectionId),
    refetchInterval: 1_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const laneKeys = useMemo(() => buildLaneKeys(analyticsQuery.data), [analyticsQuery.data]);

  const rawTransitionDataset = useMemo(
    () => buildTransitionDataset(analyticsQuery.data?.transitionCounts ?? [], laneKeys),
    [analyticsQuery.data?.transitionCounts, laneKeys],
  );

  const [cumulativeTransitionCounts, setCumulativeTransitionCounts] = useState<Record<string, number>>({});
  const transitionTrackerRef = useRef<{
    intersectionKey: string;
    counts: Record<string, number>;
  }>({
    intersectionKey: '__init__',
    counts: {},
  });

  useEffect(() => {
    const intersectionKey = intersectionId ?? '__default__';
    const tracker = transitionTrackerRef.current;
    const shouldReset = tracker.intersectionKey !== intersectionKey;
    if (shouldReset) {
      tracker.intersectionKey = intersectionKey;
      tracker.counts = {};
    }

    let changed = shouldReset;
    for (const entry of rawTransitionDataset) {
      const previous = tracker.counts[entry.laneKey] ?? 0;
      const next = shouldReset ? entry.changes : Math.max(entry.changes, previous);
      if (next !== previous) {
        tracker.counts[entry.laneKey] = next;
        changed = true;
      }
    }

    const laneSet = new Set(rawTransitionDataset.map((entry) => entry.laneKey));
    Object.keys(tracker.counts).forEach((laneKey) => {
      if (!laneSet.has(laneKey)) {
        delete tracker.counts[laneKey];
        changed = true;
      }
    });

    if (changed) {
      setCumulativeTransitionCounts({ ...tracker.counts });
    }
  }, [rawTransitionDataset, intersectionId]);

  const transitionChartDataset = useMemo(() => {
    if (Object.keys(cumulativeTransitionCounts).length === 0) {
      return rawTransitionDataset;
    }
    return laneKeys.map((laneKey) => ({
      laneKey,
      changes: cumulativeTransitionCounts[laneKey] ?? 0,
    }));
  }, [cumulativeTransitionCounts, laneKeys, rawTransitionDataset]);

  const totalTransitionsFromApi = analyticsQuery.data?.totals?.transitions;

  const totalTransitions = useMemo(() => {
    if (typeof totalTransitionsFromApi === 'number' && Number.isFinite(totalTransitionsFromApi)) {
      return totalTransitionsFromApi;
    }
    if (laneKeys.length === 0) {
      return rawTransitionDataset.reduce((accumulator, item) => accumulator + item.changes, 0);
    }
    if (Object.keys(cumulativeTransitionCounts).length === 0) {
      return rawTransitionDataset.reduce((accumulator, item) => accumulator + item.changes, 0);
    }
    return laneKeys.reduce((accumulator, laneKey) => accumulator + (cumulativeTransitionCounts[laneKey] ?? 0), 0);
  }, [totalTransitionsFromApi, laneKeys, cumulativeTransitionCounts, rawTransitionDataset]);

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
    <div className="space-y-8">

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
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Transiciones registradas</p>
              </div>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                {totalTransitions}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                  <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Intersección analizada</p>
              </div>
              <p className="break-all text-sm text-slate-500 dark:text-slate-400">
                {intersectionName}
              </p>
            </div>
          </section>

          <section>
            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Cambios a verde por semáforo</h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transitionChartDataset}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="laneKey" stroke="#475569" />
                      <YAxis stroke="#475569" allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number) => [value, 'Cambios a verde']}
                        labelFormatter={(label) => `Carril ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="changes" name="Pasadas a verde" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
                Tiempo promedio por carril
              </h2>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Promedio de duración por ciclo (segundos) considerando los registros más recientes.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={durationDataset}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="laneKey" stroke="#475569" />
                      <YAxis stroke="#475569" />
                      <Tooltip formatter={(value: number | string, name) => [`${Number(value).toFixed(1)} s`, name]} />
                      <Legend />
                      <Bar dataKey="greenSeconds" stackId="time" name="Tiempo en verde (s)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="redSeconds" stackId="time" name="Tiempo en rojo (s)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
                Duración promedio de ciclos verdes
              </h2>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Promedio calculado en ventanas de 10 segundos sobre las transiciones más recientes.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={greenTrendDataset}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" stroke="#475569" />
                      <YAxis stroke="#475569" />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(1)} s`, 'Promedio']} />
                      <Legend />
                      <Line type="monotone" dataKey="avgGreenSeconds" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
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
  );
}

export default Analysis;