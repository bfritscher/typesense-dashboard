import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { StateInterface } from '../store';
import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route<StateInterface>(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(
      process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE
    ),
  });
  void store.dispatch('node/connectionCheck');

  Router.beforeEach(async (to, from, next) => {
    if (to.name !== 'Login' && !store.state.node.isConnected) next({ name: 'Login' })
    else if (to.params.name) {
      if (!store.state.node.currentCollection || store.state.node.currentCollection.name !== to.params.name) {
        await store.dispatch('node/loadCurrentCollectionByName', to.params.name)
      }
      next()
    }
    else next()
  });

  return Router;
});
