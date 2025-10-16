# Frontend – Semáforo inteligente

Panel web en React + Vite para visualizar el estado del backend (`/Backend`) en tiempo real, revisar la cola de prioridad y explorar los mensajes (payloads) recibidos del ESP32.

## Requisitos

- Node.js 18+
- Backend en marcha (por defecto en `http://localhost:3000`).

## Variables de entorno

Crea un archivo `.env` (opcional) en la carpeta `Frontend` con las siguientes claves:

```
VITE_BACKEND_URL=http://localhost:3000
VITE_BACKEND_PROXY=true
VITE_DEV_SERVER_PORT=5173
```

- `VITE_BACKEND_URL`: URL base del backend. Si se omite se asume mismo origen.
- `VITE_BACKEND_PROXY`: si es `true`, Vite proxeará `/api` hacia el backend (útil en desarrollo local).
- `VITE_DEV_SERVER_PORT`: puerto del servidor de desarrollo.

## Scripts

```powershell
npm install         # instala dependencias
npm run dev         # modo desarrollo con recarga en caliente
npm run build       # compila versión de producción (salida en dist/)
npm run preview     # sirve la build generada
```

## Características

- Refresco automático cada 2 segundos (conmutador manual).
- Tarjetas con estado individual por carril: color actual, distancia medida, presencia y tiempos.
- Indicadores de cola de prioridad y contador de mensajes recibidos.
- Log expandible de los últimos mensajes (`/api/messages`).

## Despliegue rápido

1. Levanta el backend (`npm run dev`) en la carpeta `Backend`.
2. Desde `Frontend`, ejecuta `npm run dev`.
3. Abre <http://localhost:5173> y comienza a enviar eventos al backend (por ejemplo desde el ESP32 o con `curl`).
