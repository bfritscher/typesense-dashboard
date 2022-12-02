import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import {
  NodeLoginPayloadInterface,
  NodeStateInterface,
  STORAGE_KEY_LOGIN,
} from './state';
import { LocalStorage } from 'quasar';
import { AxiosError, AxiosResponse } from 'axios';
import FileSaver from 'file-saver';
import { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { CollectionAliasCreateSchema, CollectionAliasSchema } from 'typesense/lib/Typesense/Aliases';
import { KeySchema } from 'typesense/lib/Typesense/Key';
import { SynonymSchema } from 'typesense/lib/Typesense/Synonym';
import { OverrideSchema } from 'typesense/lib/Typesense/Override';
import { SynonymCreateSchema } from 'typesense/lib/Typesense/Synonyms';
import { OverrideCreateSchema } from 'typesense/lib/Typesense/Overrides';
import { SearchParams } from 'typesense/lib/Typesense/Documents';
import { Api } from 'src/shared/api';
import { DebugResponseSchema } from 'typesense/lib/Typesense/Debug';

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
};

export default actions;
