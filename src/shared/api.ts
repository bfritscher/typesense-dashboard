import axios, { AxiosInstance } from 'axios';
import { TypesenseNode } from 'typesense';
import * as Typesense from 'typesense';

export class Api {
  public axiosClient?: AxiosInstance;
  private typesenseClient?: Typesense.Client;


  public init({node, apiKey}: {node:TypesenseNode, apiKey:string}):void {
    this.axiosClient = axios.create({
      baseURL: `${node.protocol}://${node.host}:${node.port}/`,
      headers: {'x-typesense-api-key': apiKey }
    });
    this.typesenseClient = new Typesense.Client({
      nodes: [{
        ...node
      }],
      apiKey,
      //connection_timeout_seconds: 3600,
    });
  }

  public getCollections(){
    return this.typesenseClient?.collections().retrieve();
  }

  public createCollection(schema: Typesense.Collection) {
    return this.typesenseClient?.collections().create(schema);
  }

  public dropCollection(collectionName:string){
    return this.typesenseClient?.collections(collectionName).delete();
  }

  public getAliases() {
    return this.typesenseClient?.aliases().retrieve();
  }

  public upsertAlias(alias: Typesense.Alias) {
    return this.typesenseClient?.aliases().upsert(alias.name, { collection_name: alias.collection_name });
  }

  public deleteAlias(name: string) {
    return this.typesenseClient?.aliases(name).delete();
  }

  public getApiKeys() {
    return this.typesenseClient?.keys().retrieve();
  }

  public createApiKey(apiKey: Typesense.ApiKey){
    return this.typesenseClient?.keys().create(apiKey);
  }

  public deleteApiKey(id: string){
    return this.typesenseClient?.keys(id).delete();
  }

  public getSynonyms(collectionName: string) {
    return this.typesenseClient?.collections(collectionName)
    .synonyms()
    .retrieve();
  }

  public upsertSynonym(collectionName: string, id:string, synonym:Typesense.Synonym){
    return this.typesenseClient?.collections(collectionName).synonyms().upsert(id, synonym);
  }

  public deleteSynonym(collectionName: string, id: string) {
    return this.typesenseClient?.collections(collectionName).synonyms(id).delete();
  }

  public getOverrides(collectionName:string){
    return this.typesenseClient?.collections(collectionName).overrides()
    .retrieve();
  }

  public upsertOverride(collectionName: string, id:string, override: Typesense.Override){
    return this.typesenseClient?.collections(collectionName).overrides().upsert(id, override);
  }

  public deleteOverride(collectionName: string, id: string) {
    return this.typesenseClient?.collections(collectionName).overrides(id).delete();
  }

  public deleteDocumentById(collectionName: string, id: string) {
    return this.typesenseClient?.collections(collectionName).documents(id).delete();
  }

  public importDocuments(collectionName: string, documents: unknown[]|string, action:string){
    return this.typesenseClient?.collections(collectionName).documents().import(documents,  { action }).catch(error => {
      //eslint-disable-next-line
      return error.importResults;
    });;
  }

  public exportDocuments(collectionName: string){
    return this.typesenseClient?.collections(collectionName)
    .documents()
    .export()
  }


  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get(url:string):Promise<any>|void {
    return this.axiosClient?.get(url).then(r => {
      return {data: r.data};
      }).catch(err => {
      throw Error(err.response?.data?.message || err.message)
    });
  }
}
