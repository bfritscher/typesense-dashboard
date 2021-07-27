import { LocalStorage } from 'quasar';
import {
  TypesenseNode,
  Alias,
  ApiKey,
  Collection,
  Override,
  Synonym,
} from 'typesense';

export interface NodeDataInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats: any;
  collections: Collection[];
  aliases: Alias[];
  apiKeys: ApiKey[];
  overrides: Override[];
  synonyms: Synonym[];
}

export interface NodeLoginDataInterface {
  node: TypesenseNode;
  apiKey: string;
}

export interface NodeStateInterface {
  loginData: NodeLoginDataInterface | null;
  isConnected: boolean;
  error: string | null;
  data: NodeDataInterface;
  currentCollection: Collection | null;
  // eslint-disable-next-line
  documentsToEdit: any[] | null;
}

export const STORAGE_KEY_LOGIN = 'typesense-logindata';

function state(): NodeStateInterface {
  return {
    loginData: LocalStorage.getItem(STORAGE_KEY_LOGIN),
    isConnected: false,
    error: null,
    currentCollection: null,
    documentsToEdit: [],
    data: {
      metrics: {},
      stats: {},
      collections: [],
      aliases: [],
      apiKeys: [],
      overrides: [],
      synonyms: [],
    },
  };
}

export default state;
