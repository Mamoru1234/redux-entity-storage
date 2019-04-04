export type TypedObject<T> = {[key: string]: T};
export type DenormalizeFunction<T> = (entities: EntityStorageState['entities'], result: FetchEntityResult) => T;

export enum FetchStatus {
  LOADED = 'LOADED',
  LOADING = 'LOADING',
  FAILED = 'FAILED',
}

export interface AsyncResource<T, E = any> {
  status: FetchStatus;
  data: T;
  error?: E;
}

export interface ResultItem {
  ttl: number;
  error: any;
  result: FetchEntityResult;
}

export interface EntityStorageState {
  entities: TypedObject<TypedObject<any>>;
  results: TypedObject<ResultItem>;
}

export interface StorageState {
  entityStorage: EntityStorageState;
}

export type FetchEntityResult = string | string[] | null;

export interface NormalizeResult {
  result: FetchEntityResult;
  entities: TypedObject<TypedObject<any>>;
}

export type ResponseMapper<T> = (response: any) => T

export interface FetchOptions<R, T> {
  denormalize: DenormalizeFunction<T>;
  request: R;
  normalize: (value: T) => NormalizeResult;
  resetEntity?: boolean;
  ttl?: number;
  shouldIgnoreTtl?: boolean;
  responseMapper?: ResponseMapper<T>;
}

export interface FetchFailurePayload {
  storageKey: string;
  error: any;
}

export interface FetchSuccessPayload {
  ttl: number;
  result: NormalizeResult;
  storageKey: string;
}

export interface UpdateEntityPayload {
  entityName: string;
  entityId: string;
  value: any;
}

export interface DeleteEntityPayload {
  entityName: string;
  entityId: string;
}

export interface RemoveResultPayload {
  storageKey: string;
}

export interface CreateEntityPayload<R, T> {
  value: T;
  affectedResults: R[];
  entityName: string;
  entityId: string;
}

export interface InternalCreateEntityPayload {
  value: any;
  affectedResults: string[];
  entityName: string;
  entityId: string;
}

export interface EntityStorageAdapter<R> {
  getState: (state: any) => EntityStorageState;
  createStorageKey: (request: R) => string;
  executeRequest: (request: R, dispatch: any) => Promise<any>;
}
