import { GetterTree } from 'vuex';
import { StateInterface } from '../index';
import { NodeStateInterface } from './state';
import { Api } from 'src/shared/api';

const getters: GetterTree<NodeStateInterface, StateInterface> = {
  api(state: NodeStateInterface):Api|void {
    if (state.loginData) {
      //eslint-disable-next-line
      const electron:Api|null = (window as any).electron;
      let api = new Api();
      if (electron) {
        api = electron;
        (electron as any).rejectTLS(Number(state.loginData.node.tls))
      }
      api.init({
        node: { ...state.loginData.node},
        apiKey: state.loginData.apiKey
      });
      return api;
    }
  }
};

export default getters;
