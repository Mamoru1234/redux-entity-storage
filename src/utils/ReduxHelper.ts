import isPlainObject from 'lodash/isPlainObject';
import { TypedObject } from '../EntityStorageInterfaces';

export interface Action<Payload> {
  type: string | symbol;
  payload: Payload;
  error?: boolean;
}

export function ownKeys<T extends object>(object: T): Array<keyof T> {
  if (typeof Reflect !== 'undefined' && typeof Reflect.ownKeys === 'function') {
    return Reflect.ownKeys(object) as any;
  }
  //  tslint:disable-next-line
  console.warn('Reflect.ownKeys is not a method');
  let keys: Array<string | symbol> = Object.getOwnPropertyNames(object);

  if (typeof Object.getOwnPropertySymbols === 'function') {
    keys = keys.concat(Object.getOwnPropertySymbols(object));
  } else {
    //  tslint:disable-next-line
    console.warn('Object.getOwnPropertySymbols is not a method');
  }

  return keys as any;
}

export const createAction = <T>(type: string | symbol) => (payload: T): Action<T> => ({
  type,
  payload,
});

const validateActionType = (actionType: any) => {
  if (actionType === 'undefined' || actionType === 'null' || !actionType) {
    throw new Error('Action Type should be string or symbol');
  }
};

export const handleActions = <S>(reducerMap: TypedObject<(state: S, action: any) => S>, initState: S) => {
  if (!isPlainObject(reducerMap)) {
    throw new Error('Expected reducerMap to be a object');
  }
  ownKeys(reducerMap).forEach(validateActionType);
  return (state: S = initState, action: any) => {
    const reducer = reducerMap[action.type];
    if (!reducer) {
      return;
    }
    return reducer(state, action);
  };
};
