import type {
  AnalyticsOverview,
  CompositeSnapshot,
  TrafficStateResponse,
  IntersectionsListResponse,
  CreateIntersectionPayload,
  IntersectionMutationResponse,
  IntersectionStatus,
} from './types';

const DEFAULT_BACKEND_URL = 'http://localhost:3000';

const useProxy = import.meta.env.VITE_BACKEND_PROXY === 'true';

function resolveBaseUrl(): string {
  const explicit = import.meta.env.VITE_BACKEND_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  if (useProxy) {
    return '';
  }

  if (import.meta.env.DEV) {
    return DEFAULT_BACKEND_URL;
  }

  return '';
}

const baseUrl = resolveBaseUrl();

export interface IntersectionsFilters {
  status?: IntersectionStatus;
  ids?: string[];
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let url = baseUrl ? `${baseUrl}${path}` : path;
  const method = (init?.method ?? 'GET').toUpperCase();
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}cb=${Date.now()}`;
  }
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchSnapshot(intersectionId?: string | null): Promise<CompositeSnapshot> {
  const params = new URLSearchParams();
  if (intersectionId) {
    params.set('intersectionId', intersectionId);
  }
  const path = params.size ? `/api/traffic/lights?${params.toString()}` : '/api/traffic/lights';

  const traffic = await fetchJson<TrafficStateResponse>(path);
  return { traffic };
}

export async function fetchAnalyticsOverview(intersectionId?: string | null): Promise<AnalyticsOverview> {
  const params = new URLSearchParams();
  if (intersectionId) {
    params.set('intersectionId', intersectionId);
  }
  const query = params.toString();
  const path = query ? `/api/analytics/overview?${query}` : '/api/analytics/overview';
  return fetchJson<AnalyticsOverview>(path);
}

export async function fetchIntersections(filters: IntersectionsFilters = {}): Promise<IntersectionsListResponse> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.ids && filters.ids.length > 0) {
    params.set('ids', filters.ids.join(','));
  }

  const query = params.toString();
  const path = query ? `/api/intersections?${query}` : '/api/intersections';

  return fetchJson<IntersectionsListResponse>(path);
}

export async function createIntersection(payload: CreateIntersectionPayload): Promise<IntersectionMutationResponse> {
  return fetchJson<IntersectionMutationResponse>('/api/intersections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateIntersectionStatus(
  intersectionId: string,
  status: IntersectionStatus,
): Promise<IntersectionMutationResponse> {
  if (!intersectionId) {
    throw new Error('intersectionId es obligatorio');
  }

  return fetchJson<IntersectionMutationResponse>(`/api/intersections/${intersectionId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function updateIntersectionCoords(
  intersectionId: string,
  latitude: number,
  longitude: number,
): Promise<IntersectionMutationResponse> {
  if (!intersectionId) {
    throw new Error('intersectionId es obligatorio');
  }

  return fetchJson<IntersectionMutationResponse>(`/api/intersections/${intersectionId}`, {
    method: 'PUT',
    body: JSON.stringify({ latitude, longitude }),
  });
}

export function getBackendBaseUrl(): string {
  if (baseUrl) {
    return baseUrl;
  }

  if (useProxy) {
    return `${window.location.origin} (proxy)`;
  }

  return DEFAULT_BACKEND_URL;
}

export function getApiBaseUrl(): string {
  return baseUrl;
}
