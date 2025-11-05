export type LightState = 'green' | 'yellow' | 'red' | 'red_yellow';

export type IntersectionStatus = 'operational' | 'maintenance' | 'stopped';

export type JsonObject = Record<string, unknown>;

export interface IntersectionRecord {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  status: IntersectionStatus;
  last_seen: string | null;
  location: JsonObject | null;
  meta: JsonObject | null;
  created_at: string;
  updated_at: string;
}

export interface IntersectionsListResponse {
  intersections: IntersectionRecord[];
  statusOptions: IntersectionStatus[];
  persistenceDisabled?: boolean;
}

export interface IntersectionMutationResponse {
  intersection: IntersectionRecord;
  statusOptions: IntersectionStatus[];
}

export interface CreateIntersectionPayload {
  name: string;
  status?: IntersectionStatus;
  latitude?: number;
  longitude?: number;
  location?: JsonObject | null;
  meta?: JsonObject | null;
}

export interface UpdateIntersectionStatusPayload {
  status: IntersectionStatus;
}

export interface LaneState {
  id: string;
  state: LightState;
  lastChangeAt: number | null;
  lastVehicleAt: number | null;
  lastSampleAt: number | null;
  lastDistanceCm: number | null;
  isOccupied: boolean;
  lastClearedAt: number | null;
  waiting: boolean;
  cyclesCompleted: number;
  redSince: number | null;
}

export interface TrafficStateResponse {
  timestamp: number;
  lanes: LaneState[];
  queue: string[];
  config: Record<string, unknown>;
  databaseConnected: boolean;
  esp32Connected: boolean;
  intersectionId?: string | null;
}

export interface CompositeSnapshot {
  traffic: TrafficStateResponse | null;
}

export interface PhaseTransitionCount {
  laneKey: string;
  toState: 'green' | 'red';
  count: number;
}

export interface LaneDurationSummary {
  laneKey: string;
  greenMs: number;
  redMs: number;
}

export interface GreenShareSummary {
  laneKey: string;
  greenRatio: number;
}

export interface PresenceSample {
  laneKey: string;
  waitMs: number;
  detectedAt: string;
}

export interface GreenCycleTrendPoint {
  bucket: string;
  avgGreenMs: number;
  sampleCount: number;
}

export interface AnalyticsTotals {
  transitions: number;
}

export interface AnalyticsOverview {
  intersectionId: string;
  transitionCounts: PhaseTransitionCount[];
  laneDurations: LaneDurationSummary[];
  greenShare: GreenShareSummary[];
  presenceSamples: PresenceSample[];
  greenCycleTrend: GreenCycleTrendPoint[];
  totals?: AnalyticsTotals;
}
