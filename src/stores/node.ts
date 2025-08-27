import type { AxiosError, AxiosResponse } from 'axios';
import type { CollectionSchema, CollectionUpdateSchema } from 'typesense/lib/Typesense/Collection';
import type { CollectionAliasSchema } from 'typesense/lib/Typesense/Aliases';
import type { KeySchema } from 'typesense/lib/Typesense/Key';
import type { SynonymSchema } from 'typesense/lib/Typesense/Synonym';
import type { SynonymCreateSchema } from 'typesense/lib/Typesense/Synonyms';
import type { OverrideSchema } from 'typesense/lib/Typesense/Override';
import type { SearchParams } from 'typesense/lib/Typesense/Documents';
import type { DebugResponseSchema } from 'typesense/lib/Typesense/Debug';
import type { AnalyticsRuleSchema } from 'typesense/lib/Typesense/AnalyticsRule';
import type { PresetSchema } from 'typesense/lib/Typesense/Preset';
import type { StopwordSchema } from 'typesense/lib/Typesense/Stopword';
import type { NodeConfiguration } from 'typesense/lib/Typesense/Configuration';
import type { RouteLocationNormalized } from 'vue-router';

import FileSaver from 'file-saver';
import { LocalStorage, Notify } from 'quasar';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { Api } from 'src/shared/api';

export interface NodeDataInterface {
  debug: any;

  metrics: any;

  stats: any;
  collections: CollectionSchema[];
  aliases: CollectionAliasSchema[];
  apiKeys: KeySchema[];
  analyticsRules: AnalyticsRuleSchema[];
  searchPresets: PresetSchema<any>[];
  stopwords: StopwordSchema[];
  overrides: OverrideSchema[];
  synonyms: SynonymSchema[];
  defaultDocVersion: string;
  features: {
    stopwords: boolean;
    analyticsRules: boolean;
    searchPresets: boolean;
    stats: boolean;
    aliases: boolean;
    apiKeys: boolean;
    debug: boolean;
  };
}

export interface CustomNodeConfiguration extends NodeConfiguration {
  tls: boolean;
}

export interface NodeLoginDataInterface {
  node: CustomNodeConfiguration;
  apiKey: string;
}

export interface NodeLoginPayloadInterface extends NodeLoginDataInterface {
  forceHomeRedirect?: boolean;
}

export interface UIConfigInterface {
  hideProjectInfo?: boolean;
}

export interface NodeStateInterface {
  loginData: NodeLoginDataInterface | null;
  loginHistory: string[];
  forceHomeRedirect: boolean;
  isConnected: boolean;
  previousRoute: RouteLocationNormalized | null;
  error: string | null;
  data: NodeDataInterface;
  currentCollection: CollectionSchema | null;
  uiConfig: UIConfigInterface;

  documentsToEdit: any[] | null;
}

export const STORAGE_KEY_LOGIN = 'typesense-logindata';
export const STORAGE_KEY_LOGIN_HISTORY = 'typesense-loginhistory';

function state(): NodeStateInterface {
  return {
    loginData: LocalStorage.getItem(STORAGE_KEY_LOGIN),
    loginHistory: LocalStorage.getItem(STORAGE_KEY_LOGIN_HISTORY) || [],
    forceHomeRedirect: false,
    isConnected: false,
    previousRoute: null,
    error: null,
    currentCollection: null,
    documentsToEdit: [],
    uiConfig: {
      hideProjectInfo: false,
    },
    data: {
      debug: {},
      metrics: {},
      stats: {},
      collections: [],
      aliases: [],
      apiKeys: [],
      analyticsRules: [],
      searchPresets: [],
      stopwords: [],
      overrides: [],
      synonyms: [],
      defaultDocVersion: '28.0',
      features: {
        stopwords: false,
        analyticsRules: false,
        searchPresets: false,
        stats: false,
        aliases: false,
        apiKeys: false,
        debug: false,
      },
    },
  };
}

export const useNodeStore = defineStore('node', {
  state,
  getters: {
    api(state): Api | void {
      if (state.loginData && state.loginData.apiKey) {
        const electron: Api | null = (window as any).electron;
        let api = new Api();
        if (electron) {
          api = electron;
          (electron as any).rejectTLS(Number(state.loginData.node.tls));
        }
        api.init({
          node: { ...state.loginData.node },
          apiKey: state.loginData.apiKey,
        });
        return api;
      }
    },
  },
  actions: {
    connectionCheck() {
      if (this.loginData) {
        this.api
          ?.get('/metrics.json')
          ?.then(async (response: AxiosResponse) => {
            this.setData({
              metrics: response.data,
            });
            // minimal required data to consider the connection as successful
            await this.getCollections();
            // optional features depending on the apiKey and server capabilities
            [
              'getAliases',
              'getSearchPresets',
              'getAnalyticsRules',
              'getStopwords',
              'getApiKeys',
              'getDebug',
            ].forEach((funcName) => {
              const key = (funcName[3]?.toLowerCase() +
                funcName.slice(4)) as keyof NodeDataInterface['features'];
              const func = (this as any)[funcName];
              func()
                .then(() => {
                  this.setFeature({
                    key,
                    value: true,
                  });
                })
                .catch(() => {
                  this.setFeature({
                    key,
                    value: false,
                  });
                });
            });
            this.setIsConnected(true);
            this.saveHistory();
            this.setError(null);
          })
          .catch((error: AxiosError) => {
            this.setIsConnected(false);
            this.setError(error.message);
          });
      } else {
        this.setIsConnected(false);
      }
    },
    refreshServerStatus() {
      void this.api?.get('/metrics.json')?.then((response: AxiosResponse) => {
        this.setData({
          metrics: response.data,
        });
      });
      this.api
        ?.get('/stats.json')
        ?.then((response: AxiosResponse) => {
          this.setData({
            stats: response.data,
          });
          if (!this.data.features.stats) {
            this.setFeature({
              key: 'stats',
              value: true,
            });
          }
        })
        .catch(() => {
          this.setFeature({
            key: 'stats',
            value: false,
          });
        });
    },
    async getDebug() {
      await this.api?.getDebug()?.then((response: DebugResponseSchema) => {
        this.setData({
          debug: response,
        });
      });
    },
    async getCollections() {
      await this.api
        ?.getCollections()
        ?.then((response: CollectionSchema[]) => {
          this.setData({
            collections: response,
          });
        })
        .catch((err: Error) => {
          console.log(err);
          void this.connectionCheck();
        });
    },
    async getAliases() {
      await this.api?.getAliases()?.then((response: { aliases: CollectionAliasSchema[] }) => {
        this.setData({
          aliases: response.aliases,
        });
      });
    },
    async getApiKeys() {
      await this.api?.getApiKeys()?.then((response: { keys: KeySchema[] }) => {
        this.setData({
          apiKeys: response.keys,
        });
      });
    },
    async getAnalyticsRules() {
      await this.api?.getAnalyticsRules()?.then((response: any) => {
        this.setData({
          analyticsRules: response.rules,
        });
      });
    },
    async deleteAnalyticsRule(name: string) {
      await this.api?.deleteAnalyticsRule(name);
      void this.getAnalyticsRules();
    },
    async createAnalyticsRule(rule: AnalyticsRuleSchema) {
      try {
        this.setError(null);
        await this.api?.upsertAnalyticsRule(rule.name, rule);
        void this.getAnalyticsRules();
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async getSearchPresets() {
      await this.api?.getSearchPresets()?.then((response: { presets: PresetSchema<any>[] }) => {
        this.setData({
          searchPresets: response.presets,
        });
      });
    },
    async deleteSearchPreset(name: string) {
      await this.api?.deleteSearchPreset(name);
      void this.getSearchPresets();
    },
    async upsertSearchPreset(preset: any) {
      try {
        this.setError(null);
        await this.api?.upsertSearchPreset(preset.name, preset);
        void this.getSearchPresets();
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async getStopwords() {
      await this.api?.getStopwords()?.then((response: { stopwords: StopwordSchema[] }) => {
        this.setData({
          stopwords: response.stopwords,
        });
      });
    },
    async upsertStopwords(stopwordsSet: any) {
      try {
        this.setError(null);
        await this.api?.upsertStopwords(stopwordsSet.id, stopwordsSet);
        void this.getStopwords();
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async deleteStopwords(id: string) {
      await this.api?.deleteStopwords(id);
      void this.getStopwords();
    },
    getSynonyms(collectionName: string) {
      void this.api
        ?.getSynonyms(collectionName)
        ?.then((response: { synonyms: SynonymSchema[] }) => {
          this.setData({
            synonyms: response.synonyms,
          });
        });
    },
    getOverrides(collectionName: string) {
      void this.api
        ?.getOverrides(collectionName)
        ?.then((response: { overrides: OverrideSchema[] }) => {
          this.setData({
            overrides: response.overrides,
          });
        });
    },
    login(loginData: NodeLoginPayloadInterface) {
      const { apiKey, node, forceHomeRedirect = false } = loginData;
      this.setForceRedirect(forceHomeRedirect);
      this.setNodeData({ apiKey, node });
      void this.connectionCheck();
    },
    logout() {
      LocalStorage.remove(STORAGE_KEY_LOGIN);
      this.setNodeData(null);
      this.setCurrentCollection(null);
      this.setIsConnected(false);
    },
    loadCurrentCollection(collection: CollectionSchema | null) {
      this.setCurrentCollection(collection);
      if (!collection) {
        return;
      }
      void this.getSynonyms(collection.name);
      void this.getOverrides(collection.name);
      if (this.router.currentRoute.value.params?.name) {
        const params = { ...this.router.currentRoute.value.params, name: collection.name };
        void this.router.push({ name: this.router.currentRoute.value.name, params });
      }
    },
    loadCurrentCollectionByName(collectionName: string) {
      const collection = this.data.collections.find((c) => c.name === collectionName);
      if (collection) {
        return this.loadCurrentCollection(collection);
      }
    },
    async dropCollection(name: string) {
      this.setCurrentCollection(null);
      await this.api?.dropCollection(name);
      void this.getCollections();
    },
    async createCollection(schema: CollectionSchema) {
      try {
        this.setError(null);
        const collection: CollectionSchema | undefined = await this.api?.createCollection(
          JSON.parse(JSON.stringify(schema)),
        );
        if (!collection) {
          throw new Error('Failed to create collection');
        }
        this.setData({
          collections: this.data.collections.concat([collection]),
        });
        this.setCurrentCollection(collection);
        await this.router.push(`/collection/${collection.name}/schema`);
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async updateCollection(payload: { collectionName: string; schema: CollectionUpdateSchema }) {
      try {
        this.setError(null);
        await this.api?.updateCollection(payload.collectionName, payload.schema);
        const collection = await this.api?.getCollection(payload.collectionName);
        this.setData({
          collections: this.data.collections.map((c) => {
            if (c.name === payload.collectionName) {
              return collection;
            }
            return c;
          }),
        });
        if (collection) {
          this.setCurrentCollection(collection);
        }
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async cloneCollectionSchema(payload: { collectionName: string; destinationName: string }) {
      try {
        this.setError(null);
        await this.api?.post(`/collections?src_name=${payload.collectionName}`, {
          name: payload.destinationName,
        });
        const collection = await this.api?.getCollection(payload.destinationName);
        if (!collection) {
          throw new Error('Failed to clone collection');
        }
        this.setData({
          collections: this.data.collections.concat([collection]),
        });
        this.setCurrentCollection(collection);
        await this.router.push(`/collection/${payload.destinationName}/schema`);
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async deleteAlias(name: string) {
      await this.api?.deleteAlias(name);
      void this.getAliases();
    },
    async createAlias(alias: CollectionAliasSchema) {
      try {
        this.setError(null);
        await this.api?.upsertAlias(alias);
        void this.getAliases();
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async createApiKey(apiKey: KeySchema): Promise<KeySchema> {
      try {
        this.setError(null);
        const key = (await this.api?.createApiKey(apiKey)) as KeySchema;
        void this.getApiKeys();
        return key;
      } catch (error) {
        this.setError((error as Error).message);
        throw error;
      }
    },
    async deleteApiKey(id: string) {
      await this.api?.deleteApiKey(id);
      void this.getApiKeys();
    },
    async createSynonym(payload: { id: string; synonym: SynonymCreateSchema }) {
      try {
        this.setError(null);
        if (!this.currentCollection) {
          throw new Error('No collection selected');
        }
        await this.api?.upsertSynonym(this.currentCollection.name, payload.id, {
          id: payload.id,
          ...payload.synonym,
        });
        void this.getSynonyms(this.currentCollection?.name);
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async deleteSynonym(id: string) {
      if (!this.currentCollection) {
        throw new Error('No collection selected');
      }
      await this.api?.deleteSynonym(this.currentCollection.name, id);
      void this.getSynonyms(this.currentCollection?.name);
    },
    async createOverride(payload: { id: string; override: OverrideSchema }) {
      try {
        this.setError(null);
        if (!this.currentCollection) {
          throw new Error('No collection selected');
        }
        await this.api?.upsertOverride(this.currentCollection.name, payload.id, payload.override);
        void this.getOverrides(this.currentCollection?.name);
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async deleteOverride(id: string) {
      if (!this.currentCollection) {
        throw new Error('No collection selected');
      }
      await this.api?.deleteOverride(this.currentCollection.name, id);
      void this.getOverrides(this.currentCollection.name);
    },
    deleteDocumentById(id: string) {
      if (!this.currentCollection) {
        throw new Error('No collection selected');
      }
      return this.api?.deleteDocumentById(this.currentCollection.name, id);
    },
    search(payload: SearchParams<any>) {
      return (this.api as Api)?.search(
        this.currentCollection?.name || '',
        JSON.parse(JSON.stringify(payload)), // remove proxy which is not serializable
      );
    },
    importDocuments(payload: { action: string; documents: unknown[] }): Promise<any> {
      if (!this.currentCollection) {
        throw new Error('No collection selected');
      }
      return this.api?.importDocuments(
        this.currentCollection.name,
        payload.documents,
        payload.action,
      );
    },
    async exportDocuments(collectionName: string): Promise<any> {
      return this.api?.exportDocuments(collectionName)?.then((documents: string) => {
        const blob = new Blob([documents], {
          type: 'text/plain;charset=utf-8',
        });
        FileSaver.saveAs(blob, `${collectionName}.ljson`);
      });
    },

    editDocuments(documents: any[]) {
      this.setDocumentsToEdit(documents);
      void this.router.push(`/collection/${this.currentCollection?.name || ''}/document`);
    },
    exportToJson(object: any) {
      const blob = new Blob([JSON.stringify(object, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      FileSaver.saveAs(blob, 'export.json');
    },
    async operationCompactDB() {
      try {
        this.setError(null);
        const response = await this.api?.post('/operations/db/compact');
        if (response.data?.success) {
          Notify.create({
            position: 'top',
            progress: true,
            group: false,
            timeout: 1000,
            color: 'positive',
            message: 'Compact DB: Server responded with success',
          });
        }
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async clearCache() {
      try {
        this.setError(null);
        const response = await this.api?.post('/operations/cache/clear');
        if (response.data?.success) {
          Notify.create({
            position: 'top',
            progress: true,
            group: false,
            timeout: 1000,
            color: 'positive',
            message: 'Clear Cache: Server responded with success',
          });
        }
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async slowQueryThreshold(payload: number) {
      try {
        this.setError(null);
        const response = await this.api?.post('/config', {
          'log-slow-requests-time-ms': payload,
        });
        if (response.data?.success) {
          Notify.create({
            position: 'top',
            progress: true,
            group: false,
            timeout: 1000,
            color: 'positive',
            message: `Set Slow Request Threshold to: ${payload}`,
          });
        }
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async createSnapshot(snapshotPath: string) {
      try {
        this.setError(null);
        const response = await this.api?.createSnapshot(snapshotPath);
        if (response?.success) {
          Notify.create({
            position: 'top',
            progress: true,
            group: false,
            timeout: 3000,
            color: 'positive',
            message: `Snapshot created successfully at: ${snapshotPath}`,
          });
        }
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    /*** mutations from vuex migration ****/
    setNodeData(payload: { apiKey: string; node: CustomNodeConfiguration } | null) {
      this.loginData = payload;
      LocalStorage.set(STORAGE_KEY_LOGIN, payload);
    },
    setIsConnected(status: boolean): void {
      const route = this.router.currentRoute.value;
      if (status && !this.isConnected) {
        if (this.previousRoute) {
          void this.router.push(this.previousRoute);
          this.previousRoute = null;
        } else {
          void this.router.push('/');
        }
      }
      if (!status && route?.name !== 'Login') {
        void this.router.push('/login');
      }
      if (status && this.forceHomeRedirect) {
        void this.router.push('/');
        Notify.create({
          position: 'top',
          progress: true,
          group: false,
          timeout: 1000,
          color: 'positive',
          message: 'Server changed',
        });
        this.forceHomeRedirect = false;
        this.currentCollection = null;
      }
      this.isConnected = status;
    },
    saveHistory(): void {
      const currentLoginDataJson = JSON.stringify(this.loginData);
      const index = this.loginHistory.indexOf(currentLoginDataJson);
      if (index === 0) return;
      if (index > 0) {
        this.loginHistory.splice(index, 1);
      }
      this.loginHistory.unshift(currentLoginDataJson);
      LocalStorage.set(STORAGE_KEY_LOGIN_HISTORY, this.loginHistory);
    },
    clearHistory(): void {
      this.loginHistory = [];
      LocalStorage.set(STORAGE_KEY_LOGIN_HISTORY, []);
    },
    setForceRedirect(value: boolean): void {
      this.forceHomeRedirect = value;
    },
    setPreviousRoute(route: RouteLocationNormalized): void {
      this.previousRoute = route;
    },
    setData(data: any): void {
      for (const key in data) {
        this.data[key as keyof NodeDataInterface] = data[key];
      }
    },
    setFeature(data: { key: keyof NodeDataInterface['features']; value: boolean }): void {
      this.data.features[data.key] = data.value;
    },
    setError(error: string | null): void {
      this.error = error;
    },
    setCurrentCollection(collection: CollectionSchema | null): void {
      this.currentCollection = collection;
      if (!collection) {
        void this.router.push('/collections');
      }
    },
    setDocumentsToEdit(documents: any[]): void {
      this.documentsToEdit = documents;
    },
    setUIConfig(config: UIConfigInterface): void {
      this.uiConfig = { ...this.uiConfig, ...config };
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNodeStore, import.meta.hot));
}
