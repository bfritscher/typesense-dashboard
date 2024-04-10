import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import {
  NodeLoginPayloadInterface,
  NodeStateInterface,
  STORAGE_KEY_LOGIN,
} from './state';
import { LocalStorage, Notify } from 'quasar';
import { AxiosError, AxiosResponse } from 'axios';
import FileSaver from 'file-saver';
import { CollectionSchema, CollectionUpdateSchema } from 'typesense/lib/Typesense/Collection';
import { CollectionAliasCreateSchema, CollectionAliasSchema } from 'typesense/lib/Typesense/Aliases';
import { KeySchema } from 'typesense/lib/Typesense/Key';
import { SynonymSchema } from 'typesense/lib/Typesense/Synonym';
import { OverrideSchema } from 'typesense/lib/Typesense/Override';
import { SynonymCreateSchema } from 'typesense/lib/Typesense/Synonyms';
import { OverrideCreateSchema } from 'typesense/lib/Typesense/Overrides';
import { SearchParams } from 'typesense/lib/Typesense/Documents';
import { Api } from 'src/shared/api';
import { DebugResponseSchema } from 'typesense/lib/Typesense/Debug';
import { AnalyticsRuleSchema } from 'typesense/lib/Typesense/AnalyticsRule';
import { PresetSchema } from 'typesense/lib/Typesense/Preset';
import { StopwordSchema } from 'typesense/lib/Typesense/Stopword';

const actions: ActionTree<NodeStateInterface, StateInterface> = {
  connectionCheck(context) {
    if (context.state.loginData) {
      context.getters.api
        .get('/metrics.json')
        .then(async (response: AxiosResponse) => {
          context.commit('setData', {
            metrics: response.data,
          });
          await Promise.all([
            context.dispatch('getCollections'),
            context.dispatch('getAliases'),
            context.dispatch('getApiKeys'),
            context.dispatch('getDebug'),
          ]);
          context.commit('setIsConnected', true);
          context.commit('saveHistory');
          context.commit('setError', null);
        })
        .catch((error: AxiosError) => {
          context.commit('setIsConnected', false);
          context.commit('setError', error.message);
        });
    } else {
      context.commit('setIsConnected', false);
    }
  },
  refreshServerStatus(context) {
    context.getters.api
      .get('/metrics.json')
      .then((response: AxiosResponse) => {
        context.commit('setData', {
          metrics: response.data,
        });
      })
      .catch(() => {
        void context.dispatch('connectionCheck');
      });
    context.getters.api
      .get('/stats.json')
      .then((response: AxiosResponse) => {
        context.commit('setData', {
          stats: response.data,
        });
      })
      .catch(() => {
        void context.dispatch('connectionCheck');
      });
  },
  async getDebug(context) {
    await context.getters.api
      .getDebug()
      .then((response: DebugResponseSchema) => {
        context.commit('setData', {
          debug: response,
        });
      })
      .catch((err: Error) => {
        console.log(err);
        void context.dispatch('connectionCheck');
      });
  },
  async getCollections(context) {
    await context.getters.api
      .getCollections()
      .then((response: CollectionSchema[]) => {
        context.commit('setData', {
          collections: response,
        });
      })
      .catch((err: Error) => {
        console.log(err);
        void context.dispatch('connectionCheck');
      });
  },
  async getAliases(context) {
    await context.getters.api
      .getAliases()
      .then((response: { aliases: CollectionAliasSchema[] }) => {
        context.commit('setData', {
          aliases: response.aliases,
        });
      })
      .catch((err: Error) => {
        console.log(err);
        void context.dispatch('connectionCheck');
      });
  },
  async getApiKeys(context) {
    await context.getters.api
      .getApiKeys()
      .then((response: { keys: KeySchema[] }) => {
        context.commit('setData', {
          apiKeys: response.keys,
        });
      })
      .catch((err: Error) => {
        console.log(err);
        void context.dispatch('connectionCheck');
      });
  },
  async getAnalyticsRules(context) {
    await context.getters.api
      .getAnalyticsRules()
      .then((response: { rules: AnalyticsRuleSchema[] }) => {
        context.commit('setData', {
          analyticsRules: response.rules,
        });
      })
      .catch((err: Error) => {
        console.log(err);
        void context.dispatch('connectionCheck');
      });
  },
  async deleteAnalyticsRule(context, name: string) {
    await context.getters.api.deleteAnalyticsRule(name);
    void context.dispatch('getAnalyticsRules');
  },
  async createAnalyticsRule(context, rule: AnalyticsRuleSchema) {
    try {
      context.commit('setError', null);
      await context.getters.api.upsertAnalyticsRule(rule.name, rule);
      void context.dispatch('getAnalyticsRules');
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async getSearchPresets(context) {
    await context.getters.api
      .getSearchPresets()
      .then((response: { presets: PresetSchema[] }) => {
        context.commit('setData', {
          searchPresets: response.presets,
        });
      })
      .catch((err: Error) => {
        console.log(err);
        void context.dispatch('connectionCheck');
      });
  },
  async deleteSearchPreset(context, name: string) {
    await context.getters.api.deleteSearchPreset(name);
    void context.dispatch('getSearchPresets');
  },
  async upsertSearchPreset(context, preset: any) {
    try {
      context.commit('setError', null);
      await context.getters.api.upsertSearchPreset(preset.name, preset);
      void context.dispatch('getSearchPresets');
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async getStopwords(context) {
    await context.getters.api
      .getStopwords()
      .then((response: { stopwords: StopwordSchema[] }) => {
        context.commit('setData', {
          stopwords: response.stopwords,
        });
      })
      .catch((err: Error) => {
        console.log(err);
        void context.dispatch('connectionCheck');
      });
  },
  async upsertStopwords(context, stopwordsSet: any) {
    try {
      context.commit('setError', null);
      await context.getters.api.upsertStopwords(stopwordsSet.id, stopwordsSet);
      void context.dispatch('getStopwords');
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async deleteStopwords(context, id: string) {
    await context.getters.api.deleteStopwords(id);
    void context.dispatch('getStopwords');
  },
  getSynonyms(context, collectionName: string) {
    context.getters.api
      .getSynonyms(collectionName)
      .then((response: { synonyms: SynonymSchema[] }) => {
        context.commit('setData', {
          synonyms: response.synonyms,
        });
      })
      .catch((err: Error) => {
        console.log(err);
        void context.dispatch('connectionCheck');
      });
  },
  getOverrides(context, collectionName: string) {
    context.getters.api
      .getOverrides(collectionName)
      .then((response: { overrides: OverrideSchema[] }) => {
        context.commit('setData', {
          overrides: response.overrides,
        });
      })
      .catch((err: Error) => {
        console.log(err);
        void context.dispatch('connectionCheck');
      });
  },
  login(context, loginData: NodeLoginPayloadInterface) {
    const {
      apiKey,
      node,
      forceHomeRedirect = false
    } = loginData;
    context.commit('setForceRedirect', forceHomeRedirect);
    context.commit('setNodeData', { apiKey, node });
    void context.dispatch('connectionCheck');
  },
  logout(context) {
    LocalStorage.remove(STORAGE_KEY_LOGIN);
    context.commit('setIsConnected', false);
  },
  loadCurrentCollection(context, collection: CollectionSchema) {
    context.commit('setCurrentCollection', collection);
    void context.dispatch('getSynonyms', collection.name);
    void context.dispatch('getOverrides', collection.name);
    // eslint-disable-next-line
    // @ts-ignore
    if (this.$router.currentRoute.value.params?.name) {
      // eslint-disable-next-line
      // @ts-ignore
      const params = { ...this.$router.currentRoute.value.params, name: collection.name };
      // eslint-disable-next-line
      // @ts-ignore
      this.$router.push({ name: this.$router.currentRoute.value.name, params});
    }
  },
  loadCurrentCollectionByName(context, collectionName: string) {
    return context.dispatch(
      'loadCurrentCollection',
      context.state.data.collections.find((c) => c.name === collectionName)
    );
  },
  async dropCollection(context, name: string) {
    context.commit('setCurrentCollection', null);
    await context.getters.api.dropCollection(name);
    void context.dispatch('getCollections');
  },
  async createCollection(context, schema: CollectionSchema) {
    try {
      context.commit('setError', null);
      const collection: CollectionSchema =
        await context.getters.api.createCollection(
          JSON.parse(JSON.stringify(schema))
        );
      context.commit('setData', {
        collections: context.state.data.collections.concat([collection]),
      });
      context.commit('setCurrentCollection', collection);
      // eslint-disable-next-line
      // @ts-ignore
      this.$router.push(`/collection/${collection.name}/schema`);
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async updateCollection(context, payload: { collectionName: string, schema: CollectionUpdateSchema}) {
    try {
      context.commit('setError', null);
      await context.getters.api.updateCollection(payload.collectionName, payload.schema);
      const collection = await context.getters.api.getCollection(payload.collectionName);
      context.commit('setData', {
        collections: context.state.data.collections.map((c) => {
          if (c.name === payload.collectionName) {
            return collection;
          }
          return c;
        }),
      });
      context.commit('setCurrentCollection', collection);
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async cloneCollectionSchema(context, payload: { collectionName: string, destinationName: string}) {
    try {
      context.commit('setError', null);
      await context.getters.api.post(`/collections?src_name=${payload.collectionName}`, {name: payload.destinationName})
      const collection = await context.getters.api.getCollection(payload.destinationName);
      context.commit('setData', {
        collections: context.state.data.collections.concat([collection]),
      });
      context.commit('setCurrentCollection', collection);
      // eslint-disable-next-line
      // @ts-ignore
      this.$router.push(`/collection/${payload.destinationName}/schema`);
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async deleteAlias(context, name: string) {
    await context.getters.api.deleteAlias(name);
    void context.dispatch('getAliases');
  },
  async createAlias(context, alias: CollectionAliasCreateSchema) {
    try {
      context.commit('setError', null);
      await context.getters.api.upsertAlias(alias);
      void context.dispatch('getAliases');
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async createApiKey(
    context,
    apiKey: KeySchema
  ): Promise<KeySchema> {
    try {
      context.commit('setError', null);
      const key = (await context.getters.api.createApiKey(
        apiKey
      )) as KeySchema;
      void context.dispatch('getApiKeys');
      return key;
    } catch (error) {
      context.commit('setError', (error as Error).message);
      throw error;
    }
  },
  async deleteApiKey(context, id: string) {
    await context.getters.api.deleteApiKey(id);
    void context.dispatch('getApiKeys');
  },
  async createSynonym(
    context,
    payload: { id: string; synonym: SynonymCreateSchema }
  ) {
    try {
      context.commit('setError', null);
      await context.getters.api.upsertSynonym(
        context.state.currentCollection?.name,
        payload.id,
        payload.synonym
      );
      void context.dispatch(
        'getSynonyms',
        context.state.currentCollection?.name
      );
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async deleteSynonym(context, id: string) {
    await context.getters.api.deleteSynonym(
      context.state.currentCollection?.name,
      id
    );
    void context.dispatch('getSynonyms', context.state.currentCollection?.name);
  },
  async createOverride(
    context,
    payload: { id: string; override: OverrideCreateSchema }
  ) {
    try {
      context.commit('setError', null);
      await context.getters.api.upsertOverride(
        context.state.currentCollection?.name,
        payload.id,
        payload.override
      );
      void context.dispatch(
        'getOverrides',
        context.state.currentCollection?.name
      );
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async deleteOverride(context, id: string) {
    await context.getters.api.deleteOverride(
      context.state.currentCollection?.name,
      id
    );
    void context.dispatch(
      'getOverrides',
      context.state.currentCollection?.name
    );
  },
  async deleteDocumentById(context, id: string) {
    void (await context.getters.api.deleteDocumentById(
      context.state.currentCollection?.name,
      id
    ));
    // TODO refresh
  },
  search(
    context,
    payload: SearchParams
  ) {
    return (context.getters.api as Api).search(
      context.state.currentCollection?.name || '',
      JSON.parse(JSON.stringify(payload)) // remove proxy which is not serializable
    );
  },
  importDocuments(
    context,
    payload: { action: string; documents: unknown[] }
    //eslint-disable-next-line
  ): Promise<any> {
    //eslint-disable-next-line
    return context.getters.api.importDocuments(
      context.state.currentCollection?.name,
      payload.documents,
      payload.action
    );
  },
  //eslint-disable-next-line
  async exportDocuments(context, collectionName: string): Promise<any> {
    //eslint-disable-next-line
    return context.getters.api
      .exportDocuments(collectionName)
      .then((documents: string) => {
        const blob = new Blob([documents], {
          type: 'text/plain;charset=utf-8',
        });
        FileSaver.saveAs(blob, `${collectionName}.ljson`);
      });
  },
  //eslint-disable-next-line
  editDocuments(context, documents: any[]) {
    context.commit('setDocumentsToEdit', documents);
    // eslint-disable-next-line
    // @ts-ignore
    this.$router.push(
      `/collection/${context.state.currentCollection?.name || ''}/document`
    );
  },
  exportToJson(context, object: any) {
    const blob = new Blob([JSON.stringify(object, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    FileSaver.saveAs(blob, 'export.json');
  },
  async operationCompactDB(context) {
    try {
      context.commit('setError', null);
      const response = await context.getters.api.post('/operations/db/compact');
      if(response.data?.success) {
        Notify.create({
          position: 'top',
          progress: true,
          group: false,
          timeout: 1000,
          color: 'positive',
          message: 'Compact DB: Server responded with success'
        });
      }
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async clearCache(context) {
    try {
      context.commit('setError', null);
      const response = await context.getters.api.post('/operations/cache/clear');
      if(response.data?.success) {
        Notify.create({
          position: 'top',
          progress: true,
          group: false,
          timeout: 1000,
          color: 'positive',
          message: 'Clear Cache: Server responded with success'
        });
      }
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },
  async slowQueryThreshold(context, payload: number) {
    try {
      context.commit('setError', null);
      const response = await context.getters.api.post('/config', {
        'log-slow-requests-time-ms': payload
      });
      if(response.data?.success) {
        Notify.create({
          position: 'top',
          progress: true,
          group: false,
          timeout: 1000,
          color: 'positive',
          message: `Set Slow Request Threshold to: ${payload}`
        });
      }
    } catch (error) {
      context.commit('setError', (error as Error).message);
    }
  },  
};

export default actions;
