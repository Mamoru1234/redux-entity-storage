import identity from 'lodash/identity';
import isArray from 'lodash/isArray';
import get from 'lodash/get';
import has from 'lodash/has';

import {FetchEntityResult, NormalizeResult, TypedObject} from './EntityStorageInterfaces';

export interface NormalizeResponse<T> {
  models: string[];
  modelsMap: {
    [id: string]: T;
  };
}

export interface Config {
  idField?: string | number | symbol;
  strict?: boolean;
}

// type-safe normalization of entities list
// As an alternative we could consider normalizr usage with schema: [entity]
// But it extra dependency and POTENTIALLY not such type-safe.
export function normalizeList<T>(data: T[], config: Config = {}): NormalizeResponse<T> {
  const { idField = 'id', strict = false } = config;
  const models: string[] = [];
  const modelsMap: { [key: string]: T } = {};
  data.forEach((value: T) => {
    const valueId = get(value, idField);
    models.push(valueId);
    if (strict && has(modelsMap, valueId)) {
      throw new Error(`Duplication of entity id: ${valueId}`);
    }
    modelsMap[valueId] = value;
  });
  return {
    models,
    modelsMap,
  };
}

export function normalizeListFactory<T>(entityName: string, idField: keyof T, mapper: (data: T[]) => T[] = identity) {
  return (value: T[]): NormalizeResult => {
    const { models, modelsMap } = normalizeList(mapper(value), { idField });
    return {
      entities: {
        [entityName]: modelsMap,
      },
      result: models,
    };
  };
}

export function denormalizeListFactory<T>(entityName: string) {
  return (entities: TypedObject<TypedObject<any>>, result: FetchEntityResult): T[] => {
    const items = entities[entityName];
    if (typeof result === 'string') {
      throw new Error(`result should be string for list`);
    }
    return result.reduce((acc: T[], entityId: string) => {
      acc.push(items[entityId]);
      return acc;
    }, []);
  };
}

export function denormalizeEntityFactory<T>(entityName: string) {
  return (entities: TypedObject<TypedObject<any>>, result: FetchEntityResult): T => {
    const items = entities[entityName];
    if (isArray(result)) {
      throw new Error(`result should be string for object`);
    }
    const resultKey = result as string;
    if (!items[resultKey]) {
      throw new Error(`entity with result: ${result} not exist`);
    }
    return items[resultKey];
  };
}

export function normalizeEntityFactory<T>(entityName: string, idField: keyof T) {
  return (value: T): NormalizeResult => {
    const id: string = value[idField] as any;
    return {
      entities: {
        [entityName]: {
          [id]: value,
        },
      },
      result: id,
    };
  };
}
