import get from 'lodash/get';

import {
  DeleteEntityPayload,
  EntityStorageAdapter,
  FetchFailurePayload,
  FetchOptions,
  FetchSuccessPayload,
  RemoveResultPayload,
  UpdateEntityPayload,
} from './EntityStorageInterfaces';
import { createAction } from './utils/ReduxHelper';
import {
  addPendingRequest,
  checkEntityStorageCacheValid, DEFAULT_CACHE_DURATION,
  generateCacheTTL,
  getPendingRequest
} from './EntityStorageCacheUtils';

export const FETCH_FAILURE = Symbol('FETCH_FAILURE');
export const fetchFailure = createAction<FetchFailurePayload>(FETCH_FAILURE);

export const FETCH_SUCCESS = Symbol('FETCH_SUCCESS');
export const fetchSuccess = createAction<FetchSuccessPayload>(FETCH_SUCCESS);

export const UPDATE_ENTITY = Symbol('UPDATE_ENTITY');
export const updateEntity = createAction<UpdateEntityPayload>(UPDATE_ENTITY);

export const DELETE_ENTITY = Symbol('DELETE_ENTITY');
export const deleteEntity = createAction<DeleteEntityPayload>(DELETE_ENTITY);

export const REMOVE_RESULT = Symbol('REMOVE_RESULT');
export const removeResult = createAction<RemoveResultPayload>(REMOVE_RESULT);

export function fetchEntityFactory<R>(adapter: EntityStorageAdapter<R>) {
  return <T>(options: FetchOptions<R, T>): (...args: any[]) => Promise<T> => {
    return (dispatch: any, getState: () => any) => {
      const state = adapter.getState(getState());
      const storageKey = adapter.createStorageKey(options.request);
      const pendingRequest = getPendingRequest<T>(storageKey);
      if (pendingRequest) {
        return pendingRequest;
      }
      if (!options.shouldIgnoreTtl && checkEntityStorageCacheValid(state, storageKey)) {
        const entities = state.entities;
        const result = state.results[storageKey].result;
        return Promise.resolve(options.denormalize(entities, result));
      }
      if (options.resetEntity) {
        dispatch(removeResult({ storageKey }));
      }
      return addPendingRequest(storageKey, adapter.executeRequest(options.request, dispatch))
        .then((value: T) => {
          dispatch(fetchSuccess({
            result: options.normalize(value),
            storageKey,
            ttl: generateCacheTTL(get(options, 'ttl', DEFAULT_CACHE_DURATION) as number)
          }));
          return value;
        })
        .catch((error: any) => {
          dispatch(fetchFailure({
            storageKey,
            error,
          }));
          throw error;
        }) as Promise<T>;
    };
  }
}