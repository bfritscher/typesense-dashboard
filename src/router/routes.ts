import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/ServerStatus.vue') },
      { path: 'aliases', component: () => import('pages/Aliases.vue') },
      { path: 'apikeys', component: () => import('pages/ApiKeys.vue') },
      { path: 'analyticsrules', component: () => import('pages/AnalyticsRules.vue') },
      { path: 'searchpresets', component: () => import('pages/SearchPresets.vue') },
      { path: 'stopwords', component: () => import('pages/Stopwords.vue') },
      { path: 'collections', component: () => import('pages/Collections.vue') },
      { path: 'collection/:name/document', component: () => import('pages/Document.vue') },
      { path: 'collection/:name/search', component: () => import('pages/Search.vue') },
      { path: 'collection/:name/schema', component: () => import('pages/Schema.vue') },
      { path: 'collection/:name/synonyms', component: () => import('pages/Synonyms.vue') },
      { path: 'collection/:name/curations', component: () => import('pages/Overrides.vue') },
  ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('pages/Login.vue'),
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
