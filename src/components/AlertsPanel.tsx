import { AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import type { TrafficStateResponse } from '../api/types';

export interface AlertItem {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  description?: string;
}

interface Props {
  alerts: AlertItem[];
}

const variantStyles: Record<AlertItem['level'], string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-900 dark:text-sky-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-200',
  critical: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-900 dark:text-rose-200',
};

const variantIcon: Record<AlertItem['level'], JSX.Element> = {
  info: <Clock className="h-4 w-4" />, 
  warning: <AlertTriangle className="h-4 w-4" />, 
  critical: <AlertCircle className="h-4 w-4" />, 
};

export function AlertsPanel({ alerts }: Props) {
  if (!alerts.length) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
        Alertas
      </h2>
      <div className="flex flex-col gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${variantStyles[alert.level]}`}
          >
            <span className="mt-1">{variantIcon[alert.level]}</span>
            <div>
              <p className="font-semibold">{alert.title}</p>
              {alert.description ? <p className="text-xs opacity-80">{alert.description}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function buildAlerts(
  traffic: TrafficStateResponse | null,
  lastUpdated: number | null,
  now: number,
  sseConnected: boolean,
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Solo alerta cuando se pierde la conexión SSE con el backend
  if (!sseConnected) {
    alerts.push({
      id: 'backend-disconnected',
      level: 'critical',
      title: 'Conexión perdida con el backend',
      description: 'No se puede recibir actualizaciones en tiempo real.',
    });
  }

  return alerts;
}

export default AlertsPanel;
