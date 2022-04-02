import { Collection, TypesenseNode } from 'typesense';
import { MutationTree } from 'vuex';
import { NodeDataInterface, NodeStateInterface, STORAGE_KEY_LOGIN } from './state';
import { LocalStorage } from 'quasar'
import { RouteLocationNormalized, Router } from 'vue-router'

const mutation: MutationTree<NodeStateInterface> & {$router?:Router} = {
  setNodeData(
    state: NodeStateInterface,
    payload: { apiKey: string; node: TypesenseNode }
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
    state.isConnected = status;
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
  setError(state: NodeStateInterface, error: string):void {
    state.error = error;
  },
  setCurrentCollection(state: NodeStateInterface, collection: Collection):void {
    state.currentCollection = collection;
    if(!collection) {
      void this.$router?.push('/');
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDocumentsToEdit(state: NodeStateInterface, documents: any[]):void {
    state.documentsToEdit = documents;
  }
};

export default mutation;
