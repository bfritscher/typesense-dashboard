import { LocalStorage } from 'quasar';
import { CollectionAliasSchema } from 'typesense/lib/Typesense/Aliases';
import { AnalyticsRuleSchema } from 'typesense/lib/Typesense/AnalyticsRule';
import { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { NodeConfiguration } from 'typesense/lib/Typesense/Configuration';
import { KeySchema } from 'typesense/lib/Typesense/Key';
import { OverrideSchema } from 'typesense/lib/Typesense/Override';
import { SynonymSchema } from 'typesense/lib/Typesense/Synonym';
import { RouteLocationNormalized } from 'vue-router';

export interface NodeDataInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats: any;
  collections: CollectionSchema[];
  aliases: CollectionAliasSchema[];
  apiKeys: KeySchema[];
  analyticsRules: AnalyticsRuleSchema[];
  overrides: OverrideSchema[];
  synonyms: SynonymSchema[];
}

export interface CustomNodeConfiguration extends NodeConfiguration {
  tls: string;
}

export interface NodeLoginDataInterface {
  node: CustomNodeConfiguration;
  apiKey: string;
}

export interface NodeLoginPayloadInterface extends NodeLoginDataInterface {
  forceHomeRedirect?: boolean;
}

export interface NodeStateInterface {
  loginData: NodeLoginDataInterface | null;
  loginHistory: string[];
  forceHomeRedirect: boolean;
  isConnected: boolean;
  previousRoute: RouteLocationNormalized | null;
  error: string | null;
  data: NodeDataInterface;
  currentCollection: CollectionSchema | null;
  // eslint-disable-next-line
  documentsToEdit: any[] | null;
}

export const STORAGE_KEY_LOGIN = 'typesense-logindata';
export const STORAGE_KEY_LOGIN_HISTORY = 'typesense-loginhistory';

function state(): NodeStateInterface {
  return {
    loginData: LocalStorage.getItem(STORAGE_KEY_LOGIN),
    loginHistory: LocalStorage.getItem(STORAGE_KEY_LOGIN_HISTORY) || [],
    forceHomeRedirect: false,
    isConnected: false,
    previousRoute: null,
    error: null,
    currentCollection: null,
    documentsToEdit: [],
    data: {
      debug: {},
      metrics: {},
      stats: {},
      collections: [],
      aliases: [],
      apiKeys: [],
      analyticsRules: [],
      overrides: [],
      synonyms: [],
    },
  };
}

export default state;
