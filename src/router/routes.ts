import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/ServerStatus.vue') },
      { path: 'aliases', component: () => import('pages/Aliases.vue') },
      { path: 'apikeys', component: () => import('pages/ApiKeys.vue') },
      { path: 'analytics/rules', name: 'AnalyticsRules', component: () => import('pages/AnalyticsRules.vue') },
      { path: 'searchpresets', component: () => import('pages/SearchPresets.vue') },
      { path: 'stopwords', component: () => import('pages/Stopwords.vue') },
      { path: 'stemming', component: () => import('pages/Stemming.vue') },
      { path: 'collections', component: () => import('pages/Collections.vue') },
      { path: 'collection/:name/document', component: () => import('pages/Document.vue') },
      { path: 'collection/:name/search', component: () => import('pages/Search.vue') },
      { path: 'collection/:name/schema', component: () => import('pages/Schema.vue') },
      { path: 'collection/:name/synonyms', component: () => import('pages/Synonyms.vue') },
      { path: 'clusters', name: 'Clusters', component: () => import('pages/ClusterStatus.vue') },

      // Merchandising
      { path: 'merchandising/products', name: 'ProductPositioning', component: () => import('pages/ProductPositioning.vue') },
      { path: 'merchandising/vendors', name: 'VendorControls', component: () => import('pages/VendorControls.vue') },

      // Search Debugging
      { path: 'search/debugger', name: 'QueryDebugger', component: () => import('pages/QueryDebugger.vue') },
      { path: 'search/autocomplete', name: 'AutocompletePreview', component: () => import('pages/AutocompletePreview.vue') },

      // Relevance
      { path: 'relevance/ranking', name: 'RankingFormula', component: () => import('pages/RankingFormula.vue') },
      { path: 'relevance/weights', name: 'SearchWeights', component: () => import('pages/SearchWeights.vue') },

      // Curations (enhanced)
      { path: 'curations/overrides', name: 'OverridesVisual', component: () => import('pages/OverridesVisual.vue') },

      // Analytics
      { path: 'analytics/popular', name: 'PopularQueries', component: () => import('pages/PopularQueries.vue') },
      { path: 'analytics/noresults', name: 'NoResultsQueries', component: () => import('pages/NoResultsQueries.vue') },
      { path: 'analytics/health', name: 'SearchHealthKPIs', component: () => import('pages/SearchHealthKPIs.vue') },
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
