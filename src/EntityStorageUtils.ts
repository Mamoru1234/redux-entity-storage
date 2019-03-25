import {
  AsyncResource,
  DenormalizeFunction,
  EntityStorageAdapter,
  EntityStorageState,
  FetchEntityResult,
  FetchStatus,
  ResultItem,
} from './EntityStorageInterfaces';
import { createSelector } from 'reselect';
import has from 'lodash/has';
import get from 'lodash/get';
import identity from 'lodash/identity';

export interface EntitiesSelectorFactoryOptions<R, T> {
  request: R;
  denormalize: DenormalizeFunction<T>;
}

export const EMPTY_RESOURCE: AsyncResource<any> = {
  status: FetchStatus.LOADING,
  data: null,
  error: null,
};

export const failureResourceFactory = <T> () => createSelector(
  (error: any): AsyncResource<T> => ({
    error,
    status: FetchStatus.FAILED,
    data: null as any,
  }),
  identity,
);

export const successResourceFactory = <T> (
  storageKey: string,
  denormalize: DenormalizeFunction<T>) => createSelector(
  (entityStorage: EntityStorageState): AsyncResource<T> => {
    const { result } = entityStorage.results[storageKey];
    return {
      status: FetchStatus.LOADED,
      data: denormalize(entityStorage.entities, result),
      error: null,
    };
  },
  identity,
);

export const createSelectors = <R>(adapter: EntityStorageAdapter<R>) => {
  function resultSelectorFactory(request: R) {
    const storageKey = adapter.createStorageKey(request);
    return createSelector(
      (state: any) => adapter.getState(state).results[storageKey],
      (resultItem: ResultItem): AsyncResource<FetchEntityResult> => {
        if (resultItem == null) {
          return EMPTY_RESOURCE;
        }
        if (resultItem.error) {
          return {
            status: FetchStatus.FAILED,
            data: null as any,
            error: resultItem.error,
          };
        }
        return {
          status: FetchStatus.LOADED,
          data: resultItem.result,
          error: null,
        };
      },
    );
  }
  function entityStateSelector<T>(entityName: string, entityId: string) {
    const entityPath = [entityName, entityId];
    return createSelector(
      (state: any): T => get(adapter.getState(state).entities, entityPath, null),
      (value: T) => value,
    );
  }
  function entitiesSelectorFactory<T>(options: EntitiesSelectorFactoryOptions<R, T>) {
    const storageKey = adapter.createStorageKey(options.request);
    const failureResourceSelector = failureResourceFactory();
    const successResourceSelector = successResourceFactory<T>(storageKey, options.denormalize);
    return createSelector(
      (state: any) => adapter.getState(state),
      (entityStorage: EntityStorageState): AsyncResource<T> => {
        if (!has(entityStorage.results, storageKey)) {
          return EMPTY_RESOURCE;
        }
        const storeError = entityStorage.results[storageKey].error;
        if (storeError !== null) {
          return failureResourceSelector(storeError) as any;
        }
        return successResourceSelector(entityStorage) as any;
      },
    );
  }
  return {
    resultSelectorFactory,
    entityStateSelector,
    entitiesSelectorFactory,
  };
};
