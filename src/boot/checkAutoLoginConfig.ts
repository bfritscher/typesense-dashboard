import { defineBoot } from '#q-app/wrappers';
import axios from 'axios';
import { Platform } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import type { NodeLoginDataInterface } from 'src/stores/node';

export default defineBoot(({ store }) => {
  if (Platform.is.electron) {
    return;
  }
  void axios.get('config.json').then((response) => {
    const nodeStore = useNodeStore(store);
    if (response.data && response.data.apiKey) {
      nodeStore.login(response.data);
    }
    if (response.data && response.data.history) {
      response.data.history.forEach((historyItem: NodeLoginDataInterface) => {
        const historyJson = JSON.stringify(historyItem);
        if (!nodeStore.loginHistory.includes(historyJson)) {
          nodeStore.loginHistory.push(historyJson);
        }
      });
    }
  });
});
