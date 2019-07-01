import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import merge from 'lodash/merge';
import has from 'lodash/has';
import omit from 'lodash/omit';

import {
  CREATE_ENTITY,
  DELETE_ENTITY,
  DELETE_FROM_RESULT,
  FETCH_FAILURE,
  FETCH_SUCCESS,
  REMOVE_RESULT,
  UPDATE_ENTITY,
} from './EntityStorageActions';

import {
  DeleteEntityPayload,
  EntityStorageState,
  FetchFailurePayload,
  FetchSuccessPayload,
  InternalCreateEntityPayload, RemoveFromResultPayload,
  RemoveResultPayload,
  ResultItem,
  TypedObject,
  UpdateEntityPayload,
} from './EntityStorageInterfaces';
import { Action, handleActions } from './utils/ReduxHelper';

const initState: EntityStorageState = {
  entities: {},
  results: {},
};

function pushToResults(
  results: TypedObject<ResultItem>, entityId: string, affectedResults: string[]): TypedObject<ResultItem> {
  const newResults: TypedObject<ResultItem> = {};
  forEach(results, (resultItem, key) => {
    if (!affectedResults.includes(key)) {
      newResults[key] = resultItem;
      return;
    }
    const result = resultItem.result;
    if (!isArray(result)) {
      console.warn('Result affected is not array', key);
      newResults[key] = resultItem;
      return;
    }
    newResults[key] = {
      ...resultItem,
      result: result.concat(entityId),
    };
    return;
  });
  return newResults;
}

export default handleActions<EntityStorageState>({
  [CREATE_ENTITY]: (state: EntityStorageState, { payload }: Action<InternalCreateEntityPayload>) => {
    const { entityId, affectedResults, entityName, value} = payload;
    const results = pushToResults(state.results, entityId, affectedResults);
    const entities = {
      ...state.entities,
      [entityName]: {
        ...state.entities[entityName],
        [entityId]: value,
      },
    };
    return {
      entities,
      results,
    }
  },
  [FETCH_SUCCESS]: (state: EntityStorageState, { payload }: Action<FetchSuccessPayload>) => {
    const { result, storageKey, ttl } = payload;
    const results: EntityStorageState['results'] = {
      ...state.results,
      [storageKey]: {
        ttl,
        error: null,
        result: result.result,
      },
    };
    const entities: EntityStorageState['entities'] = {};
    merge(entities, state.entities, result.entities);
    return {
      results,
      entities,
    };
  },
  [FETCH_FAILURE]: (state: EntityStorageState, { payload }: Action<FetchFailurePayload>) => {
    const { error, storageKey } = payload;
    const results: EntityStorageState['results'] = {
      ...state.results,
      [storageKey]: {
        error,
        result: null,
        ttl: 0,
      },
    };
    return {
      entities: state.entities,
      results,
    };
  },
  [REMOVE_RESULT]: (state: EntityStorageState, { payload }: Action<RemoveResultPayload>) => {
    const { storageKey } = payload;
    if (!has(state.results, storageKey)) {
      return state;
    }
    return {
      ...state,
      results: omit(state.results, storageKey),
    };
  },
  [UPDATE_ENTITY]: (state: EntityStorageState, { payload }: Action<UpdateEntityPayload>) => {
    const { entityId, entityName, value } = payload;
    if (!has(state.entities, entityName)) {
      return state;
    }
    const entities = {
      ...state.entities,
      [entityName]: {
        ...state.entities[entityName],
        [entityId]: value,
      },
    };
    return {
      ...state,
      entities,
    };
  },
  [DELETE_ENTITY]: (state: EntityStorageState, { payload }: Action<DeleteEntityPayload>) => {
    const { entityName, entityId } = payload;
    if (!has(state.entities, entityName)) {
      return state;
    }
    const entities = {
      ...state.entities,
      [entityName]: omit(state.entities[entityName], entityId),
    };
    delete entities[entityId];
    const results: EntityStorageState['results'] = {};
    forEach(state.results, (value: ResultItem, storeKey: string) => {
      if (isString(value.result) && value.result !== entityId) {
        results[storeKey] = value;
        return;
      }
      if (!value.result) {
        results[storeKey] = value;
        return;
      }
      if (isArray(value.result)) {
        results[storeKey] = {
          ...value,
          result: value.result.filter((resultId) => resultId !== entityId),
        };
        return;
      }
    });
    return {
      entities,
      results,
    };
  },
  [DELETE_FROM_RESULT]: (state: EntityStorageState, { payload }: Action<RemoveFromResultPayload>) => {
    const { storageKey, entityId } = payload;
    if (!has(state.results, storageKey)) {
      return state;
    }


    const result = state.results[storageKey];
    if (!isArray(result.result)) {
      return state;
    }

    const filteredResult = result.result.filter((resultId) => resultId !== entityId);

    const results: EntityStorageState['results'] = {
      ...state.results,
      [storageKey]: {
        ...result,
        result: filteredResult,
      },
    };

    return {
      ...state,
      results,
    };
  },
}, initState);
