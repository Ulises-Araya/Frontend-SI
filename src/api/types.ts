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
