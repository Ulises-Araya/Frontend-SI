import { differenceInSeconds, formatDistanceToNowStrict } from 'date-fns';
import { clsx } from 'clsx';
import { Car, Clock, GaugeCircle, Hourglass, Radar } from 'lucide-react';
import type { LaneState } from '../api/types';

interface Props {
  lane: LaneState;
  index: number;
}

function asDate(value: number | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTimestamp(value: number | null): string {
  const date = asDate(value);
  if (!date) return '—';
  const relative = formatDistanceToNowStrict(date, { addSuffix: true });
  return `${date.toLocaleTimeString()} (${relative})`;
}

function formatDistance(distance: number | null): string {
  if (!Number.isFinite(distance ?? NaN)) {
    return '—';
  }
  return `${(distance as number).toFixed(1)} cm`;
}

function stateClasses(state: LaneState['state']): string {
  switch (state) {
    case 'green':
      return 'border-green-500 bg-green-500/10 text-green-700 dark:border-green-400 dark:bg-green-500/20 dark:text-green-300';
    case 'yellow':
      return 'border-amber-400 bg-amber-400/10 text-amber-600 dark:border-amber-300 dark:bg-amber-400/20 dark:text-amber-300';
    case 'red':
    default:
      return 'border-rose-500 bg-rose-500/10 text-rose-600 dark:border-rose-400 dark:bg-rose-500/20 dark:text-rose-300';
  }
}

export function LaneCard({ lane, index }: Props) {
  const lastVehicleDate = asDate(lane.lastVehicleAt);
  const lastChangeDate = asDate(lane.lastChangeAt);
  const secondsSinceChange =
    lastChangeDate != null ? differenceInSeconds(new Date(), lastChangeDate) : null;

  return (
    <article
      className={clsx(
        'flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-2xl dark:bg-slate-800',
        lane.waiting ? 'ring-2 ring-amber-500/60' : 'ring-1 ring-slate-200/60 dark:ring-slate-700/60',
      )}
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Semáforo {index + 1}</p>
          <h3 className="text-2xl font-semibold capitalize text-slate-900 dark:text-slate-100">{lane.id}</h3>
        </div>
        <span
          className={clsx(
            'flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold uppercase tracking-wide',
            stateClasses(lane.state),
          )}
        >
          <GaugeCircle className="h-4 w-4" />
          {lane.state}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 rounded-xl bg-slate-100/70 px-3 py-2 dark:bg-slate-700/70">
          <Radar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Distancia
            </dt>
            <dd className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {formatDistance(lane.lastDistanceCm)}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-100/70 px-3 py-2 dark:bg-slate-700/70">
          <Car className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Presencia
            </dt>
            <dd className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {lane.isOccupied ? 'Vehículo detectado' : 'Libre'}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-100/70 px-3 py-2 dark:bg-slate-700/70">
          <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Último cambio
            </dt>
            <dd className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {formatTimestamp(lane.lastChangeAt)}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-100/70 px-3 py-2 dark:bg-slate-700/70">
          <Hourglass className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tiempo en estado
            </dt>
            <dd className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {secondsSinceChange != null ? `${secondsSinceChange} s` : '—'}
            </dd>
          </div>
        </div>
      </dl>

      <div className="rounded-xl bg-slate-100/70 px-3 py-2 text-xs dark:bg-slate-700/70">
        <p className="font-medium text-slate-500 dark:text-slate-400">Último vehículo</p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {lastVehicleDate ? formatTimestamp(lane.lastVehicleAt) : 'Sin registros'}
        </p>
      </div>
    </article>
  );
}

export default LaneCard;
