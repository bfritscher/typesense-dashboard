declare module 'typesense' {
  export interface TypesenseNode {
    host: string;
    port: string;
    protocol: string;
    tls: boolean;
  }
  export interface Alias {
    name: string;
    collection_name: string;
  }

  export interface ApiKey {
    actions: string[];
    collections: string[];
    description?: string;
    id?: string;
    value?: string;
    expires_at?: number;
    value_prefix?: string;
  }

  export interface OverrideInclude {
    id: string;
    position: number;
  }

  export interface OverrideExclude {
    id: string;
  }

  export interface Override {
    id?: string;
    excludes?: OverrideExclude[];
    includes?: OverrideInclude[];
    rule: {
      match: string;
      query: string;
    };
  }

  export interface Synonym {
    id?: string;
    root?: string;
    synonyms: string[];
  }

  export interface CollectionField {
    name: string;
    type: string;
    facet?: boolean;
    index?: boolean;
    optional?: boolean;
    num_documents?: number;
    created_at?: number;
  }

  export interface Collection {
    name: string;
    fields: CollectionField[];
    default_sorting_field?: string;
    num_memory_shards?: number;
    num_documents?: number;
  }

  export interface TypesenseClientOptions {
    nodes: TypesenseNode[];
    apiKey: string;
    connection_timeout_seconds?: number;
  }

  export interface DocumentClient {
    delete(): Promise<void>;
    import(documents:unknown[]|string, options:{action:string}): Promise<void>;
    export(): Promise<unknown>[];
  }

  export interface CollectionsClient {
    retrieve(): Promise<Collection[]>;
    create(schema:Collection): Promise<Collection>;
    drop(): Promise<void>;
    overrides(id?: string): OverrideClient;
    synonyms(id?: string): SynonymClient;
    delete(): Promise<void>;
    documents(id?: string): DocumentClient;
  }

  export interface AliasClient {
    retrieve(): Promise<Alias[]>;
    upsert(name: string, collection_name: {collection_name: string}): Promise<Alias>;
    delete(): Promise<void>;
  }

  export interface ApiKeyClient {
    retrieve(): Promise<ApiKey[]>;
    create(apiKey:ApiKey): Promise<ApiKey>;
    delete(): Promise<void>;
    generateScopedSearchKey(): Promise<string>;
  }
  export interface OverrideClient {
    retrieve(): Promise<Override>;
    upsert(id:string, override:Override):Promise<Override>;
    delete(): Promise<void>;
  }
  export interface SynonymClient {
    retrieve(): Promise<Synonym>;
    upsert(id:string, synonym:Synonym): Promise<Synonym>;
    delete(): Promise<void>;
  }

  export class Client {
    constructor(options: TypesenseClientOptions);
    collections(name?: string): CollectionsClient;
    aliases(name?: string): AliasClient;
    keys(id?: string): ApiKeyClient;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

declare module 'typesense-instantsearch-adapter' {
  import { TypesenseNode } from 'typesense';
  export interface TypesenseInstantSearchAdapterOptions {
    server: {
      apiKey: string;
      nodes: TypesenseNode[];
    };
    additionalSearchParameters: {
      query_by: string;
    };
  }

  export class TypesenseInstantSearchAdapter {
    constructor(options: TypesenseInstantSearchAdapterOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchClient: any;
  }
  export default TypesenseInstantSearchAdapter;
}

declare module 'vue-instantsearch/dist/vue3/es';
