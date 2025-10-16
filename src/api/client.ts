import type { CompositeSnapshot, TrafficStateResponse } from './types';

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

export async function fetchSnapshot(): Promise<CompositeSnapshot> {
  const traffic = await fetchJson<TrafficStateResponse>('/api/traffic/lights');
  return { traffic };
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
