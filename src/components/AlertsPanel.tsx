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
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  critical: 'border-rose-200 bg-rose-50 text-rose-800',
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
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
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
): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (!traffic) {
    alerts.push({
      id: 'no-data',
      level: 'info',
      title: 'Aún no se reciben datos del backend',
      description: 'Envía eventos desde el ESP32 o revisa la conexión.',
    });
    return alerts;
  }

  if (lastUpdated != null) {
    const diffSeconds = Math.round((now - lastUpdated) / 1000);
    if (diffSeconds > 5) {
      alerts.push({
        id: 'stale-data',
        level: diffSeconds > 15 ? 'critical' : 'warning',
        title: `Sin nuevas lecturas desde hace ${diffSeconds} s`,
        description: 'Verifica la conexión serial o el WiFi del dispositivo.',
      });
    }
  }

  const maxRedMs = Number(traffic.config?.maxRedMs ?? traffic.config?.MAX_RED_MS ?? 0);
  const maxRedSeconds = maxRedMs / 1000;

  for (const lane of traffic.lanes) {
    if (lane.redSince && lane.waiting) {
      const redSeconds = Math.round((now - lane.redSince) / 1000);
      if (maxRedSeconds && redSeconds > maxRedSeconds) {
        alerts.push({
          id: `overdue-${lane.id}`,
          level: 'critical',
          title: `El carril ${lane.id} supera el máximo en rojo (${redSeconds}s)`,
          description: 'La cola de prioridad se atenderá en cuanto el carril actual quede libre.',
        });
      }
    }
  }

  if (traffic.queue.length > 0) {
    alerts.push({
      id: 'queue-non-empty',
      level: 'info',
      title: `Cola de prioridad activa (${traffic.queue.length} carriles en espera)`,
      description: `Orden actual: ${traffic.queue.join(' → ')}`,
    });
  }

  return alerts;
}

export default AlertsPanel;
