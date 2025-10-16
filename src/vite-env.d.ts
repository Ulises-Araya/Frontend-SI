/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
	readonly VITE_BACKEND_URL?: string;
	readonly VITE_BACKEND_PROXY?: string;
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_DETECTION_THRESHOLD_CM?: string;
}
