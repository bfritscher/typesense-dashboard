import type { AxiosResponse } from 'axios';
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
import type { StemmingDictionariesRetrieveSchema } from 'typesense/lib/Typesense/StemmingDictionaries';
import type { StemmingDictionarySchema } from 'typesense/lib/Typesense/StemmingDictionary';
import type { NodeConfiguration } from 'typesense/lib/Typesense/Configuration';
import type { RouteLocationNormalized } from 'vue-router';

import FileSaver from 'file-saver';
import { LocalStorage, Notify } from 'quasar';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { Api } from 'src/shared/api';

export interface Health {
  ok: boolean;
  resource_error?: string;
}

export interface NodeDataInterface {
  debug: any;

  metrics: any;

  stats: any;

  health: Health | undefined;
  collections: CollectionSchema[];
  aliases: CollectionAliasSchema[];
  apiKeys: KeySchema[];
  analyticsRules: AnalyticsRuleSchema[];
  searchPresets: PresetSchema<any>[];
  stopwords: StopwordSchema[];
  stemmingDictionaries: string[];
  overrides: OverrideSchema[];
  synonyms: SynonymSchema[];
  defaultDocVersion: string;
  features: {
    stopwords: boolean;
    stemmingDictionaries: boolean;
    analyticsRules: boolean;
    searchPresets: boolean;
    stats: boolean;
    aliases: boolean;
    apiKeys: boolean;
    debug: boolean;
    health: boolean;
  };
}

export interface CustomNodeConfiguration extends NodeConfiguration {
  tls: boolean;
}

export interface NodeLoginDataInterface {
  node: CustomNodeConfiguration;
  apiKey: string;
  clusterTag?: string;
}

export interface NodeLoginPayloadInterface extends NodeLoginDataInterface {
  forceHomeRedirect?: boolean;
}

export interface UIConfigInterface {
  hideProjectInfo?: boolean;
}

export interface NodeStateInterface {
  loginData: NodeLoginDataInterface | null;
  currentNodeConfig: CustomNodeConfiguration;
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

function isValidMetricsPayload(payload: unknown): payload is Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const keys = Object.keys(payload as Record<string, unknown>);
  if (keys.length === 0) return false;
  // Typesense metrics generally contain system_* and/or typesense_* keys.
  return keys.some((k) => k.startsWith('system_') || k.startsWith('typesense_'));
}

function isValidCollectionsPayload(payload: unknown): payload is CollectionSchema[] {
  if (!Array.isArray(payload)) return false;
  // Collections are objects; require at least a name to avoid treating junk as success.
  return payload.every(
    (c) =>
      c &&
      typeof c === 'object' &&
      !Array.isArray(c) &&
      typeof (c as Record<string, unknown>).name === 'string',
  );
}

function state(): NodeStateInterface {
  const storedLoginDataRaw = LocalStorage.getItem(STORAGE_KEY_LOGIN);
  const storedLoginData: NodeLoginDataInterface | null =
    storedLoginDataRaw && typeof storedLoginDataRaw === 'object'
      ? (storedLoginDataRaw as NodeLoginDataInterface)
      : null;
  const defaultNodeConfig: CustomNodeConfiguration = {
    host: 'localhost',
    port: 8108,
    protocol: 'http',
    path: '',
    tls: true,
  };
  return {
    loginData: storedLoginData,
    currentNodeConfig: (storedLoginData?.node as CustomNodeConfiguration) || defaultNodeConfig,
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
      health: undefined,
      collections: [],
      aliases: [],
      apiKeys: [],
      analyticsRules: [],
      searchPresets: [],
      stopwords: [],
      stemmingDictionaries: [],
      overrides: [],
      synonyms: [],
      defaultDocVersion: '28.0',
      features: {
        stopwords: false,
        stemmingDictionaries: false,
        analyticsRules: false,
        searchPresets: false,
        stats: false,
        aliases: false,
        apiKeys: false,
        debug: false,
        health: false,
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
    loginHistoryParsed(state): NodeLoginDataInterface[] {
      const parsed: NodeLoginDataInterface[] = [];
      for (const raw of state.loginHistory) {
        if (typeof raw !== 'string') continue;
        try {
          const item = JSON.parse(raw) as NodeLoginDataInterface;
          if (item && item.node && item.apiKey) parsed.push(item);
        } catch {
          /* ignore malformed */
        }
      }
      return parsed;
    },
    currentHistoryEntry(): NodeLoginDataInterface | null {
      if (!this.loginData) return null;
      const baseKey = JSON.stringify({ node: this.loginData.node, apiKey: this.loginData.apiKey });
      for (const item of this.loginHistoryParsed) {
        const key = JSON.stringify({ node: item.node, apiKey: item.apiKey });
        if (key === baseKey) return item;
      }
      return null;
    },
    currentClusterTag(): string | null {
      return this.currentHistoryEntry?.clusterTag || null;
    },
    clusterMembersForCurrent(): NodeLoginDataInterface[] {
      const tag = this.currentClusterTag;
      if (!tag) return [];
      return this.loginHistoryParsed
        .filter((h) => h.clusterTag === tag)
        .slice()
        .sort((a, b) => {
          const h = a.node.host.localeCompare(b.node.host);
          if (h !== 0) return h;
          const pa = Number(a.node.port || 0);
          const pb = Number(b.node.port || 0);
          if (pa !== pb) return pa - pb;
          return String(a.node.protocol).localeCompare(String(b.node.protocol));
        });
    },
  },
  actions: {
    async connectionCheck() {
      if (!this.loginData) {
        this.setIsConnected(false);
        return;
      }

      // Metrics are optional; only store them when valid.
      try {
        const response = await this.api?.get('/metrics.json');
        if (response && isValidMetricsPayload(response.data)) {
          this.setData({ metrics: response.data });
        } else {
          this.setData({ metrics: {} });
        }
      } catch {
        this.setData({ metrics: {} });
      }

      try {
        // Minimal required data to consider the connection successful.
        const collections = await this.api?.getCollections();
        if (!isValidCollectionsPayload(collections)) {
          throw new Error('Invalid collections response');
        }
        this.setData({ collections });

        // Optional features depending on the apiKey and server capabilities
        [
          'getAliases',
          'getSearchPresets',
          'getAnalyticsRules',
          'getStopwords',
          'getStemmingDictionaries',
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
      } catch (error: unknown) {
        this.setIsConnected(false);
        this.setError((error as Error).message || String(error));
      }
    },
    refreshServerStatus() {
      // Metrics are optional; update if valid, otherwise clear so UI can hide them.
      void this.api
        ?.get('/metrics.json')
        ?.then((response: AxiosResponse) => {
          if (isValidMetricsPayload(response.data)) {
            this.setData({ metrics: response.data });
          } else {
            this.setData({ metrics: {} });
          }
        })
        .catch(() => {
          this.setData({ metrics: {} });
        });
      this.api
        ?.get('/health')
        ?.then((response: AxiosResponse) => {
          this.setData({ health: response.data });
          this.setFeature({
            key: 'health',
            value: true,
          });
        })
        .catch(() => {
          this.setFeature({ key: 'health', value: false });
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
    async getStemmingDictionaries() {
      await this.api
        ?.getStemmingDictionaries()
        ?.then((response: StemmingDictionariesRetrieveSchema) => {
          this.setData({
            stemmingDictionaries: response.dictionaries,
          });
        });
    },
    async upsertStemmingDictionaries(dictionary: StemmingDictionarySchema) {
      try {
        this.setError(null);
        await this.api?.upsertStemmingDictionaries(dictionary.id, dictionary.words);
        void this.getStemmingDictionaries();
      } catch (error) {
        this.setError((error as Error).message);
      }
    },
    async getStemmingDictionary(id: string) {
      return await this.api?.getStemmingDictionary(id);
    },
    async deleteStemmingDictionary(id: string) {
      await this.api?.delete(`/stemming/dictionaries/${id}`);
      void this.getStemmingDictionaries();
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
      let { clusterTag } = loginData;
      // Recover clusterTag from history if not provided
      if (!clusterTag) {
        try {
          const targetKey = JSON.stringify({ node, apiKey });
          for (const item of this.loginHistoryParsed) {
            const key = JSON.stringify({ node: item.node, apiKey: item.apiKey });
            if (key === targetKey && item.clusterTag) {
              clusterTag = item.clusterTag;
              break;
            }
          }
        } catch {
          /* ignore */
        }
      }
      this.setForceRedirect(forceHomeRedirect);
      this.setCurrentNodeConfig(node);
      this.setNodeData({ apiKey, node, clusterTag } as NodeLoginDataInterface);
      void this.connectionCheck();
    },
    logout() {
      LocalStorage.remove(STORAGE_KEY_LOGIN);
      this.setNodeData(null);
      this.setCurrentCollection(null);
      this.setIsConnected(false);
    },
    isCurrent(member: NodeLoginDataInterface): boolean {
      return JSON.stringify(this.loginData) === JSON.stringify(member);
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
        FileSaver.saveAs(blob, `${collectionName}.jsonl`);
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
    setNodeData(payload: NodeLoginDataInterface | null): void {
      this.loginData = payload;
      LocalStorage.set(STORAGE_KEY_LOGIN, payload);
    },
    setCurrentNodeConfig(config: Partial<CustomNodeConfiguration>): void {
      const merged: CustomNodeConfiguration = {
        ...(this.currentNodeConfig as CustomNodeConfiguration),
        ...(config as CustomNodeConfiguration),
      };

      if (!merged.protocol) merged.protocol = 'http';
      if (!merged.host) merged.host = 'localhost';
      const port = Number(merged.port);
      merged.port = Number.isFinite(port) ? port : 8108;
      if (merged.path == null) merged.path = '';
      if (typeof merged.tls !== 'boolean') merged.tls = true;

      this.currentNodeConfig = merged;
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
      // cleanup remove duplicates without custom tags and preserve custom tags
      // Strategy:
      // - Consider duplicates based on { node, apiKey } only (ignore clusterTag for identity)
      // - Keep at most one entry per identity
      // - Prefer a tagged entry over an untagged one; if an untagged was kept earlier,
      //   replace it when we encounter a tagged duplicate
      // - If a tagged entry already exists for an identity, drop subsequent duplicates
      try {
        const cleaned: string[] = [];
        const keptPosByKey = new Map<string, number>();
        const hasTaggedByKey = new Map<string, boolean>();

        for (const raw of this.loginHistory) {
          if (typeof raw !== 'string') continue;
          let parsed: NodeLoginDataInterface | null = null;
          try {
            parsed = JSON.parse(raw) as NodeLoginDataInterface;
          } catch {
            // ignore malformed entries
            continue;
          }
          if (!parsed || !parsed.node || !parsed.apiKey) continue;

          const identityKey = JSON.stringify({ node: parsed.node, apiKey: parsed.apiKey });
          const hasTag = Boolean(parsed.clusterTag && String(parsed.clusterTag).length > 0);

          if (!keptPosByKey.has(identityKey)) {
            cleaned.push(raw);
            keptPosByKey.set(identityKey, cleaned.length - 1);
            hasTaggedByKey.set(identityKey, hasTag);
            continue;
          }

          const alreadyTagged = hasTaggedByKey.get(identityKey) === true;
          if (alreadyTagged) {
            // We already kept a tagged entry for this identity; drop duplicates
            continue;
          }

          // We only have an untagged kept so far
          if (hasTag) {
            // Replace previously kept untagged with this tagged one
            const pos = keptPosByKey.get(identityKey)!;
            cleaned[pos] = raw;
            hasTaggedByKey.set(identityKey, true);
          }
          // else: both untagged duplicates -> drop current
        }

        this.loginHistory = cleaned;
      } catch {
        // If anything goes wrong during cleanup, keep the current list as-is
      }
      LocalStorage.set(STORAGE_KEY_LOGIN_HISTORY, this.loginHistory);
    },
    clearHistory(): void {
      this.loginHistory = [];
      LocalStorage.set(STORAGE_KEY_LOGIN_HISTORY, []);
    },
    removeHistoryAt(index: number): void {
      if (index >= 0 && index < this.loginHistory.length) {
        this.loginHistory.splice(index, 1);
        LocalStorage.set(STORAGE_KEY_LOGIN_HISTORY, this.loginHistory);
      }
    },
    setHistoryTag(index: number, tag: string): void {
      if (index < 0 || index >= this.loginHistoryParsed.length) return;
      const parsed = this.loginHistoryParsed[index] as NodeLoginDataInterface;
      const updated: NodeLoginDataInterface = {
        node: parsed.node,
        apiKey: parsed.apiKey,
        clusterTag: tag,
      };
      this.loginHistory.splice(index, 1, JSON.stringify(updated));
      LocalStorage.set(STORAGE_KEY_LOGIN_HISTORY, this.loginHistory);
      if (this.loginData) {
        this.loginData.clusterTag = tag;
      }
    },
    removeHistoryTag(index: number): void {
      if (index < 0 || index >= this.loginHistoryParsed.length) return;
      const base = this.loginHistoryParsed[index] as NodeLoginDataInterface;
      const noTag: NodeLoginDataInterface = { node: base.node, apiKey: base.apiKey };
      this.loginHistory.splice(index, 1, JSON.stringify(noTag));
      LocalStorage.set(STORAGE_KEY_LOGIN_HISTORY, this.loginHistory);
      if (this.loginData) {
        delete this.loginData.clusterTag;
      }
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
