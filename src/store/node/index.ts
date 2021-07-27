import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { NodeStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const nodeModule: Module<NodeStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default nodeModule;
