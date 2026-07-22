import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useNodeStore } from '@/stores/node';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function ({ store }) {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, from, next) => {
    const nodeStore = useNodeStore(store);
    if (to.name !== 'Login' && !nodeStore.isConnected) {
      nodeStore.setPreviousRoute(to);
      next({ name: 'Login' });
    } else if (to.params.name) {
      if (!nodeStore.currentCollection || nodeStore.currentCollection.name !== to.params.name) {
        // TODO check await needed?
        void nodeStore.loadCurrentCollectionByName(to.params.name as string);
      }
      next();
    } else next();
  });

  return Router;
});
