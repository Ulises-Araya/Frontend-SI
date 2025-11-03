import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, MapPin, Settings, TriangleAlert, Plus, AlertCircle, X, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useIntersections, intersectionsQueryKey } from '../api/intersections';
import { createIntersection, updateIntersectionStatus, updateIntersectionCoords } from '../api/client';
import type { CreateIntersectionPayload, IntersectionRecord, IntersectionStatus } from '../api/types';

const STATUS_LABELS: Record<IntersectionStatus, string> = {
  operational: 'Operativa',
  maintenance: 'Mantenimiento',
  stopped: 'Detenida',
};

const STATUS_COLORS: Record<IntersectionStatus, string> = {
  operational: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  maintenance: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  stopped: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

const STATUS_INDICATOR: Record<IntersectionStatus, string> = {
  operational: 'bg-emerald-500',
  maintenance: 'bg-amber-500',
  stopped: 'bg-rose-500',
};

function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) {
    return 'Sin datos';
  }
  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return 'Sin datos';
    }
    return date.toLocaleString();
  } catch (error) {
    return 'Sin datos';
  }
}

interface StatusFilterButtonProps {
  status: IntersectionStatus | 'all';
  active: boolean;
  onSelect: (status: IntersectionStatus | 'all') => void;
  count: number | undefined;
}

function StatusFilterButton({ status, active, onSelect, count = 0 }: StatusFilterButtonProps) {
  const label = status === 'all' ? 'Todas' : STATUS_LABELS[status];
  const colorClass =
    status === 'all'
      ? 'border-slate-300 dark:border-slate-600'
      : STATUS_COLORS[status].replace('bg-', 'border-');

  return (
    <button
      type="button"
      onClick={() => onSelect(status)}
      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
        active ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : `${colorClass} bg-white dark:bg-slate-800`
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="ml-2 rounded-full bg-slate-900/10 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-100/10 dark:text-slate-200">
        {count ?? 0}
      </span>
    </button>
  );
}

function formatLocation(location: IntersectionRecord['location']) {
  if (!location || typeof location !== 'object') {
    return 'Ubicación no disponible';
  }
  const address = typeof location.address === 'string' ? location.address : null;
  const city = typeof location.city === 'string' ? location.city : null;
  if (address && city) {
    return `${address}, ${city}`;
  }
  if (address) {
    return address;
  }
  if (city) {
    return city;
  }
  return 'Ubicación no disponible';
}

function LocationSelector({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface IntersectionsDashboardProps {
  activeIntersectionId?: string | null;
  onSelectIntersection?: (intersectionId: string | null) => void;
}

function IntersectionsDashboardComponent({
  activeIntersectionId,
  onSelectIntersection,
}: IntersectionsDashboardProps = {}) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<IntersectionStatus | 'all'>('all');
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string | null>(() => {
    if (typeof activeIntersectionId === 'string') {
      return activeIntersectionId;
    }
    if (activeIntersectionId === null) {
      return null;
    }
    return localStorage.getItem('selectedIntersectionId');
  });
  const [activeModalIntersectionId, setActiveModalIntersectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [modifiedCoords, setModifiedCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [modifiedStatuses, setModifiedStatuses] = useState<Record<string, IntersectionStatus>>({});
  const [editMode, setEditMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    status: 'operational' as IntersectionStatus,
    latitude: 0,
    longitude: 0,
  });

  const handleDragEnd = useCallback((id: string, newLatLng: L.LatLng) => {
    setModifiedCoords(prev => ({ ...prev, [id]: { lat: newLatLng.lat, lng: newLatLng.lng } }));
  }, []);

  const IntersectionMarker = React.memo(({ intersection, coords, currentStatus, editMode, onDragEnd, onOpenModal }: {
    intersection: IntersectionRecord;
    coords: { lat: number; lng: number };
    currentStatus: IntersectionStatus;
    editMode: boolean;
    onDragEnd: (id: string, newLatLng: L.LatLng) => void;
    onOpenModal: (id: string) => void;
  }) => {
    const position = useMemo(() => [coords.lat, coords.lng] as [number, number], [coords.lat, coords.lng]);
    const eventHandlers = useMemo(() => ({
      ...(editMode ? {} : {
        mouseover: (e: any) => e.target.openPopup(),
        mouseout: (e: any) => e.target.closePopup(),
        click: () => onOpenModal(intersection.id),
      }),
      ...(editMode ? {
        dragend: (e: any) => {
          const newLatLng = e.target.getLatLng();
          onDragEnd(intersection.id, newLatLng);
        }
      } : {})
    }), [editMode, intersection.id, onOpenModal, onDragEnd]);
    return (
      <Marker
        position={position}
        icon={getIcon(intersection.status)}
        draggable={editMode}
        eventHandlers={eventHandlers}
      >
        {!editMode && (
          <Popup>
            <div className="text-sm">
              <p><strong>Nombre:</strong> {intersection.name}</p>
              <p><strong>Ubicación:</strong> {formatLocation(intersection.location)}</p>
              <p><strong>Estado:</strong> {STATUS_LABELS[currentStatus]}</p>
            </div>
          </Popup>
        )}
      </Marker>
    );
  });

  useEffect(() => {
    if (activeIntersectionId === undefined) {
      return;
    }
    if (activeIntersectionId !== selectedIntersectionId) {
      setSelectedIntersectionId(activeIntersectionId);
    }
  }, [activeIntersectionId, selectedIntersectionId]);

  const filters = useMemo(() => ({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  }), [selectedStatus]);

  const intersectionsQuery = useIntersections(filters);
  const rawIntersections = intersectionsQuery.data?.intersections ?? [];
  const intersections = rawIntersections.map(intersection => ({
    ...intersection,
    latitude: intersection.latitude ?? (intersection.location as any)?.latitude ?? null,
    longitude: intersection.longitude ?? (intersection.location as any)?.longitude ?? null,
  }));
  const persistenceDisabled = intersectionsQuery.data?.persistenceDisabled ?? false;
  const activeModalIntersection = activeModalIntersectionId
    ? intersections.find((item) => item.id === activeModalIntersectionId) ?? null
    : null;

  const coordsMap = useMemo(() => {
    const map: Record<string, { lat: number; lng: number }> = {};
    intersections.forEach(i => {
      if (i.latitude && i.longitude) {
        map[i.id] = modifiedCoords[i.id] || { lat: i.latitude, lng: i.longitude };
      }
    });
    return map;
  }, [intersections, modifiedCoords]);

  useEffect(() => {
    if (selectedIntersectionId) {
      localStorage.setItem('selectedIntersectionId', selectedIntersectionId);
    } else {
      localStorage.removeItem('selectedIntersectionId');
    }
  }, [selectedIntersectionId]);

  useEffect(() => {
    if (!selectedIntersectionId) {
      return;
    }

    const exists = intersections.some((item) => item.id === selectedIntersectionId);
    if (!exists) {
      setSelectedIntersectionId(null);
      if (onSelectIntersection) {
        onSelectIntersection(null);
      }
    }
  }, [intersections, onSelectIntersection, selectedIntersectionId]);
  useEffect(() => {
    if (!activeModalIntersectionId) {
      return;
    }

    const exists = intersections.some((item) => item.id === activeModalIntersectionId);
    if (!exists) {
      setActiveModalIntersectionId(null);
    }
  }, [activeModalIntersectionId, intersections]);
  const readOnly = persistenceDisabled;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: intersectionsQueryKey(filters) });
  };

  const handleStatusChange = async (intersectionId: string, status: IntersectionStatus) => {
    if (editMode) {
      // En modo edición, solo actualizar localmente sin afectar el cache
      setModifiedStatuses(prev => ({ ...prev, [intersectionId]: status }));
      return;
    }

    // Actualizar localmente primero
    queryClient.setQueryData(intersectionsQueryKey(filters), (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        intersections: oldData.intersections.map((i: any) => i.id === intersectionId ? { ...i, status } : i)
      };
    });
    queryClient.setQueryData(intersectionsQueryKey({}), (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        intersections: oldData.intersections.map((i: any) => i.id === intersectionId ? { ...i, status } : i)
      };
    });

    // Intentar actualizar en backend si persistencia está habilitada
    if (!readOnly) {
      try {
        await updateIntersectionStatus(intersectionId, status);
      } catch (error) {
        console.error('Error updating status in backend', error);
        // No revertir, dejar el cambio local
      }
    }
  };

  const handleCreateIntersection = () => {
    if (readOnly) {
      window.alert('La persistencia está deshabilitada. No se pueden crear intersecciones nuevas.');
      return;
    }
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async () => {
    if (!createForm.name.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }
    try {
      await createIntersection({
        name: createForm.name,
        status: createForm.status,
        latitude: createForm.latitude,
        longitude: createForm.longitude,
        location: {
          latitude: createForm.latitude,
          longitude: createForm.longitude,
        },
      });
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        status: 'operational',
        latitude: 0,
        longitude: 0,
      });
      queryClient.refetchQueries({ queryKey: ['intersections'] });
    } catch (error) {
      alert('Error al crear la intersección: ' + (error as Error).message);
    }
  };

  const processedIntersections = intersections.map(intersection => ({
    ...intersection,
    latitude: intersection.latitude ?? (intersection.location as any)?.latitude ?? null,
    longitude: intersection.longitude ?? (intersection.location as any)?.longitude ?? null,
  }));

  const statusCounts = useMemo(() => {
    const counts: Record<IntersectionStatus, number> = {
      operational: 0,
      maintenance: 0,
      stopped: 0,
    };

    rawIntersections.forEach((item) => {
      counts[item.status] += 1;
    });

    return counts;
  }, [rawIntersections]);

  const startTrackingIntersection = (intersectionId: string) => {
    if (intersectionId !== selectedIntersectionId) {
      setSelectedIntersectionId(intersectionId);
    }

    setActiveModalIntersectionId(null);

    if (onSelectIntersection) {
      onSelectIntersection(intersectionId);
    }

    queryClient.invalidateQueries({ queryKey: ['snapshot'] });
  };
  const openModal = useCallback((intersectionId: string) => {
    setActiveModalIntersectionId(intersectionId);
  }, []);
  const closeModal = useCallback(() => {
    setActiveModalIntersectionId(null);
  }, []);

  const getIcon = (status: IntersectionStatus) => {
    const color = status === 'operational' ? '#10b981' : status === 'maintenance' ? '#f59e0b' : '#ef4444';
    return L.divIcon({
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 4px rgba(0,0,0,0.3);"><span style="color: white; font-size: 12px;">🚦</span></div>`,
      className: 'custom-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={
                  viewMode === 'list'
                    ? 'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900'
                    : 'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition text-slate-600 dark:text-slate-400'
                }
              >
                Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={
                  viewMode === 'map'
                    ? 'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition bg-slate-900 text-white shadow dark:bg-slate-100 dark:text-slate-900'
                    : 'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition text-slate-600 dark:text-slate-400'
                }
              >
                Mapa
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500"
            >
              Filtros
            </button>
            {viewMode === 'map' && !editMode && (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500"
              >
                Editar ubicaciones
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleCreateIntersection}
            disabled={readOnly}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              readOnly
                ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                : 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
            }`}
          >
            <Plus className="h-4 w-4" /> Nueva intersección
          </button>
        </div>
        {viewMode === 'map' && editMode && (
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {!editMode ? (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                Editar ubicaciones
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    if (Object.keys(modifiedCoords).length === 0 && Object.keys(modifiedStatuses).length === 0) {
                      alert('No hay cambios para cargar.');
                      return;
                    }
                    try {
                      await Promise.all([
                        ...Object.entries(modifiedCoords).map(([id, coords]) =>
                          updateIntersectionCoords(id, coords.lat, coords.lng)
                        ),
                        ...Object.entries(modifiedStatuses).map(([id, status]) => updateIntersectionStatus(id, status)),
                      ]);
                      const coordsCount = Object.keys(modifiedCoords).length;
                      const statusCount = Object.keys(modifiedStatuses).length;
                      alert(`Cargados ${coordsCount} cambios de coordenadas y ${statusCount} cambios de estado al backend.`);
                      setModifiedCoords({});
                      setModifiedStatuses({});
                      setEditMode(false);
                      queryClient.invalidateQueries({ queryKey: intersectionsQueryKey({}) });
                      queryClient.invalidateQueries({ queryKey: intersectionsQueryKey(filters) });
                    } catch (error) {
                      alert('Error al cargar cambios: ' + (error as Error).message);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Cargar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModifiedCoords({});
                    setModifiedStatuses({});
                    setEditMode(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {readOnly ? (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Persistencia deshabilitada</p>
            <p className="text-xs">
              Supabase no está configurado. Se muestra una vista de solo lectura con la intersección por defecto.
            </p>
          </div>
        </div>
      ) : null}

      {showFilters && (
        <div className="grid gap-3 md:grid-cols-4">
          <StatusFilterButton
            status="all"
            active={selectedStatus === 'all'}
            onSelect={setSelectedStatus}
            count={intersections.length}
          />
          {(Object.keys(STATUS_LABELS) as IntersectionStatus[]).map((status) => (
            <StatusFilterButton
              key={status}
              status={status}
              active={selectedStatus === status}
              onSelect={setSelectedStatus}
              count={statusCounts[status]}
            />
          ))}
        </div>
      )}



      {intersectionsQuery.isError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">No se pudo cargar el catálogo de intersecciones.</p>
            <p className="text-xs opacity-80">{(intersectionsQuery.error as Error).message}</p>
          </div>
        </div>
      ) : intersectionsQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-slate-500 dark:border-slate-600 dark:text-slate-400">
          <Settings className="mr-3 h-5 w-5 animate-spin" />
          Cargando intersecciones...
        </div>
      ) : intersections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
          <TriangleAlert className="h-8 w-8" />
          <p className="text-sm font-medium">No hay intersecciones con el filtro seleccionado.</p>
          <p className="text-xs text-slate-400">Prueba cambiando el estado o creando una nueva intersección.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-800">
          <div className="hidden grid-cols-[2fr,3fr,1fr] gap-6 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 md:grid">
            <span>Intersección</span>
            <span>Ubicación</span>
            <span className="text-right">Estado</span>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {intersections.map((intersection) => {
              const locationText = formatLocation(intersection.location);
              const isActive = selectedIntersectionId === intersection.id;
              const currentStatus = modifiedStatuses[intersection.id] || intersection.status;
              return (
                <button
                  type="button"
                  key={intersection.id}
                  onClick={() => openModal(intersection.id)}
                  className={`w-full px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${
                    isActive
                      ? 'bg-slate-900/5 dark:bg-slate-100/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:grid md:grid-cols-[2fr,3fr,1fr] md:items-center md:gap-6">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {intersection.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 md:hidden">
                        {locationText}
                      </p>
                    </div>
                    <div className="hidden min-w-0 text-sm text-slate-500 dark:text-slate-400 md:block">
                      <p className="truncate">{locationText}</p>
                    </div>
                    <div className="flex justify-end">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[currentStatus]}`}>
                        <span className={`h-2 w-2 rounded-full ${STATUS_INDICATOR[currentStatus]}`} />
                        {STATUS_LABELS[currentStatus]}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-800" style={{ height: '600px' }}>
          <MapContainer key={intersections.length} center={[-31.4275, -62.0842]} zoom={15.3} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {intersections.filter(i => i.latitude && i.longitude).map(intersection => {
              const coords = coordsMap[intersection.id];
              const currentStatus = modifiedStatuses[intersection.id] || intersection.status;
              return (
                <IntersectionMarker
                  key={intersection.id}
                  intersection={intersection}
                  coords={coords}
                  currentStatus={currentStatus}
                  editMode={editMode}
                  onDragEnd={handleDragEnd}
                  onOpenModal={openModal}
                />
              );
            })}
          </MapContainer>
        </div>
      )}

      {activeModalIntersection ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 px-4 py-10">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-full border border-transparent p-1 text-slate-500 transition hover:border-slate-200 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeModalIntersection.name}</h3>
                <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  {formatLocation(activeModalIntersection.location)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {(() => {
                  const currentStatus = modifiedStatuses[activeModalIntersection.id] || activeModalIntersection.status;
                  return (
                    <>
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[currentStatus]}`}>
                        <span className={`h-2 w-2 rounded-full ${STATUS_INDICATOR[currentStatus]}`} />
                        {STATUS_LABELS[currentStatus]}
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        Última señal: {formatTimestamp(activeModalIntersection.last_seen)}
                      </span>
                    </>
                  );
                })()}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['operational', 'maintenance', 'stopped'] as IntersectionStatus[]).map((option) => {
                  const currentStatus = modifiedStatuses[activeModalIntersection.id] || activeModalIntersection.status;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleStatusChange(activeModalIntersection.id, option)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        option === currentStatus
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400'
                      }`}
                    >
                      {STATUS_LABELS[option]}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => startTrackingIntersection(activeModalIntersection.id)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
                >
                  Ver en tiempo real
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  ID interno: {activeModalIntersection.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nueva intersección</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Nombre de la intersección"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value as IntersectionStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="operational">Operativa</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="stopped">Detenida</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Latitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={createForm.latitude}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Longitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={createForm.longitude}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar ubicación en el mapa</label>
                <div className="mt-2 h-48 w-full overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600">
                  <MapContainer center={[createForm.latitude || -31.4275, createForm.longitude || -62.0842]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationSelector onLocationSelect={(lat, lng) => setCreateForm(prev => ({ ...prev, latitude: lat, longitude: lng }))} />
                    {createForm.latitude && createForm.longitude && (
                      <Marker position={[createForm.latitude, createForm.longitude]}>
                        <Popup>Nueva intersección</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitCreate}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export const IntersectionsDashboard = React.memo(IntersectionsDashboardComponent);
