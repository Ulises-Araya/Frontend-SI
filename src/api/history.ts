import { getSupabaseClient } from '../supabase/client';

export interface TrafficEventRow {
  id: string;
  device_id: string | null;
  intersection_id: string | null;
  sensors: Record<string, unknown> | null;
  state_snapshot: Record<string, unknown> | null;
  evaluation: Record<string, unknown> | null;
  ip: string | null;
  received_at: string;
}

export interface HistoryMetrics {
  totalEvents: number;
  eventsLastHour: number;
  uniqueDevices: number;
  detectionsByLane: Array<{ lane: string; count: number }>;
}

const SENSOR_LANE_MAP: Record<string, string> = {
  sensor1: 'north',
  sensor2: 'west',
  sensor3: 'south',
  sensor4: 'east',
};

const DETECTION_THRESHOLD = Number(import.meta.env.VITE_DETECTION_THRESHOLD_CM || 30);

export async function fetchTrafficEvents(limit = 200): Promise<TrafficEventRow[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase no configurado');
  }

  const { data, error } = await supabase
    .from('traffic_events')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data as TrafficEventRow[];
}

export function computeHistoryMetrics(events: TrafficEventRow[]): HistoryMetrics {
  const now = Date.now();
  const lastHourThreshold = now - 60 * 60 * 1000;
  const detections: Record<string, number> = {
    north: 0,
    west: 0,
    south: 0,
    east: 0,
  };
  const devices = new Set<string>();

  let eventsLastHour = 0;

  for (const event of events) {
    if (event.device_id) {
      devices.add(event.device_id);
    }

    const timestamp = Date.parse(event.received_at);
    if (!Number.isNaN(timestamp) && timestamp >= lastHourThreshold) {
      eventsLastHour += 1;
    }

    const sensors = event.sensors ?? {};
    for (const [sensorKey, value] of Object.entries(sensors)) {
      const lane = SENSOR_LANE_MAP[sensorKey];
      if (!lane) continue;
      if (typeof value === 'number' && value <= DETECTION_THRESHOLD) {
        detections[lane] += 1;
      }
    }
  }

  return {
    totalEvents: events.length,
    eventsLastHour,
    uniqueDevices: devices.size,
    detectionsByLane: Object.entries(detections).map(([lane, count]) => ({ lane, count })),
  };
}
