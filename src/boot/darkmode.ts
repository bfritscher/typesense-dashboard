import { boot } from 'quasar/wrappers';
import { LocalStorage, Dark } from 'quasar';
import { watch } from 'vue'

const STORAGE_KEY_DARK_MODE = 'typesense-dark-mode';

export default boot(() => {
  const savedState: boolean|null = LocalStorage.getItem(STORAGE_KEY_DARK_MODE);
  if (savedState !== null) {
    Dark.set(savedState);
  }
  watch(() => Dark.isActive, val => {
    LocalStorage.set(STORAGE_KEY_DARK_MODE, val);
  })
});

