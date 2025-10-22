export type LightState = 'green' | 'yellow' | 'red';

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

export interface AnalyticsOverview {
  intersectionId: string;
  transitionCounts: PhaseTransitionCount[];
  laneDurations: LaneDurationSummary[];
  greenShare: GreenShareSummary[];
  presenceSamples: PresenceSample[];
  greenCycleTrend: GreenCycleTrendPoint[];
}
