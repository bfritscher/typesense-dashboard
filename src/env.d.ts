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
    sort?: boolean;
    infix?: boolean;
    locale?: string;
    num_documents?: number;
    created_at?: number;
  }

  export interface Collection {
    name: string;
    fields: CollectionField[];
    default_sorting_field?: string;
    num_memory_shards?: number;
    token_separators?: string[];
    symbols_to_index?: string[];
    num_documents?: number;
  }

  export interface TypesenseClientOptions {
    nodes: TypesenseNode[];
    apiKey: string;
    connection_timeout_seconds?: number;
  }

  export interface QueryParameters {
    q: string;
    query_by: string;
    filter_by?: string;
    prefix?: boolean
    pre_segmented_query?: boolean;
  }

  export interface FacetingParameters {
    facet_by?: string;
    max_facet_values?: number;
    facet_query?: string;
  }

  export interface PaginationParameters {
    page?: number;
    per_page?: number;
  }

  export interface GroupingParameters {
    group_by?: string;
    group_limit?: number;
  }

  export interface ResultsParameters {
    include_fields?: string
    exclude_fields?: string
    highlight_fields?: string // default: all queried fields
    highlight_full_fields?: string // default: all fields
    highlight_affix_num_tokens?: number // default: 4
    highlight_start_tag?: string // default: <mark>
    highlight_end_tag?: string // default: </mark>
    snippet_threshold?: number // default: 30
    limit_hits?: number // default: no limit
    search_cutoff_ms?: number
    exhaustive_search?: boolean
  }

  export interface CachingParameters {
    use_cache?: boolean
    cache_ttl?: number
  }

  export interface TypoToleranceParameters {
    num_typos?: string // default: 2
    min_len_1typo?: number
    min_len_2typo?: number
    typo_tokens_threshold?: number // default: 1
    drop_tokens_threshold?: number // default: 1
  }

  export interface RankingParameters {
    query_by_weights?: string
    sort_by?: string // default: text match desc
    prioritize_exact_match?: boolean // default: true
    pinned_hits?: string
    hidden_hits?: string
    enable_overrides?: boolean
  }

  export interface SearchResponseHit {
    highlights?: [
      {
        field: string
        snippet?: string
        value?: string
        snippets?: string[]
        indices?: string[]
        matched_tokens: string[]
      }
    ]
    document: any
    text_match: number
  }

  export type SearchParameters = QueryParameters|FacetingParameters|PaginationParameters|GroupingParameters|ResultsParameters|CachingParameters|TypoToleranceParameters|RankingParameters


  export interface SearchResult {
    facet_counts?:  any[];
    found: number;
    out_of: number;
    page: number;
    search_time_ms: number;
    hits?: SearchResponseHit[];
  }

  export interface DocumentClient {
    delete(): Promise<void>;
    import(documents:unknown[]|string, options:{action:string}): Promise<void>;
    export(): Promise<unknown>[];
    search(searchParameters:SearchParameters): Promise<SearchResult>;
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
  import { SearchParameters, TypesenseNode } from 'typesense';
  export interface TypesenseInstantSearchAdapterOptions {
    server: {
      apiKey: string;
      nodes: TypesenseNode[];
    };
    additionalSearchParameters: SearchParameters;
  }

  export class TypesenseInstantSearchAdapter {
    constructor(options: TypesenseInstantSearchAdapterOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchClient: any;
  }
  export default TypesenseInstantSearchAdapter;
}

declare module 'vue-instantsearch/vue3/es';
