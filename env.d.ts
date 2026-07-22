/**
 * Custom environment variables used by the Quasar configuration and client.
 * Quasar supplies its own QUASAR_* declarations automatically.
 */
interface ImportMetaEnv {
  readonly APP_VERSION: string;
  readonly DEV_API_PROXY_TARGET?: string;
  readonly PUBLIC_PATH?: string;
}

declare module 'vue-instantsearch/vue3/es';
