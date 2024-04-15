import { MutationTree } from 'vuex';
import { CustomNodeConfiguration, NodeDataInterface, NodeStateInterface, STORAGE_KEY_LOGIN, STORAGE_KEY_LOGIN_HISTORY } from './state';
import { LocalStorage } from 'quasar'
import { RouteLocationNormalized, Router } from 'vue-router'
import { Notify } from 'quasar'
import { CollectionSchema } from 'typesense/lib/Typesense/Collection';

const mutation: MutationTree<NodeStateInterface> & {$router?:Router} = {
  setNodeData(
    state: NodeStateInterface,
    payload: { apiKey: string; node: CustomNodeConfiguration }
  ) {
    state.loginData = payload;
    LocalStorage.set(STORAGE_KEY_LOGIN, payload)
  },
  setIsConnected(state: NodeStateInterface, status: boolean):void {
    const route = this.$router?.currentRoute.value;
    if (status &&  !state.isConnected) {
      if (state.previousRoute) {
        void this.$router?.push(state.previousRoute);
        state.previousRoute = null;
      } else {
        void this.$router?.push('/');
      }
    }
    if(!status && route?.name !== 'Login') {
      void this.$router?.push('/login');
    }
    if(status && state.forceHomeRedirect) {
      void this.$router?.push('/');
      Notify.create({
        position: 'top',
        progress: true,
        group: false,
        timeout: 1000,
        color: 'positive',
        message: 'Server changed'
      });
      state.forceHomeRedirect = false;
      state.currentCollection = null;
    }
    state.isConnected = status;
  },
  saveHistory(state: NodeStateInterface):void {
    const currentLoginDataJson = JSON.stringify(state.loginData);
    const index = state.loginHistory.indexOf(currentLoginDataJson);
    if (index === 0) return;
    if (index > 0) {
      state.loginHistory.splice(index, 1);
    }
    state.loginHistory.unshift(currentLoginDataJson);
    LocalStorage.set(STORAGE_KEY_LOGIN_HISTORY, state.loginHistory);
  },
  clearHistory(state: NodeStateInterface):void {
    state.loginHistory = [];
    LocalStorage.set(STORAGE_KEY_LOGIN_HISTORY, []);
  },
  setForceRedirect(state: NodeStateInterface, value: boolean):void {
    state.forceHomeRedirect = value;
  },
  setPreviousRoute(state: NodeStateInterface, route: RouteLocationNormalized):void {
    state.previousRoute = route;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setData(state: NodeStateInterface, data: any):void {
    for(const key in data) {
      state.data[key as keyof NodeDataInterface] = data[key];
    }
  },
  setFeature(state: NodeStateInterface, data: {key: keyof NodeDataInterface['features'], value: boolean}):void {
    state.data.features[data.key] = data.value;
  },
  setError(state: NodeStateInterface, error: string):void {
    state.error = error;
  },
  setCurrentCollection(state: NodeStateInterface, collection: CollectionSchema):void {
    state.currentCollection = collection;
    if(!collection) {
      void this.$router?.push('/collections');
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDocumentsToEdit(state: NodeStateInterface, documents: any[]):void {
    state.documentsToEdit = documents;
  }
};

export default mutation;
