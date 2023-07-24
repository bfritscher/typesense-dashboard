import { boot } from 'quasar/wrappers';
import axios from 'axios';
import { Platform } from 'quasar';

export default boot(({ store }) => {
  if (Platform.is.electron) {
    return;
  }
  void axios.get('config.json').then((response) => {
    void store.dispatch('node/login', response.data);
  });
});
