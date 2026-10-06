/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_GEMINI_FALLBACK_MODELS?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_MCA_API_URL?: string;
  readonly VITE_MCA_API_KEY?: string;
  /** Hosted review build only: '1' seeds the Sagar/Indhic demo companies. */
  readonly VITE_ALLOW_DEMO_SEED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
