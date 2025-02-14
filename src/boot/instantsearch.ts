import { defineBoot } from '#q-app/wrappers';
import 'instantsearch.css/themes/algolia-min.css';

import InstantSearch from 'vue-instantsearch/vue3/es';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default defineBoot(({ app }) => {
  app.use(InstantSearch);
});
