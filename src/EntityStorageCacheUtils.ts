import { EntityStorageState, TypedObject } from './EntityStorageInterfaces';

type PendingRequests = TypedObject<Promise<any>>

export const DEFAULT_CACHE_DURATION = 0;

export const generateCacheTTL = (duration: number): number => {
  const currentTimestamp = Date.now();
  return currentTimestamp + duration;
};

export const checkEntityStorageCacheValid = (state: EntityStorageState, storageKey: string) => {
  const resultItem = state.results[storageKey];
  if (!resultItem) {
    return false;
  }
  const currentTimestamp = Date.now();
  return resultItem.ttl > currentTimestamp;
};

const pendingRequests: PendingRequests = {};

export function getPendingRequest<T>(storageKey: string): Promise<T> {
  return pendingRequests[storageKey];
}

export function removePendingRequest(storageKey: string) {
  delete pendingRequests[storageKey];
}

export function addPendingRequest<T>(storageKey: string, pendingRequest: Promise<T>): Promise<T> {
  pendingRequests[storageKey] = pendingRequest;
  return pendingRequest
    .then((data: T) => {
      removePendingRequest(storageKey);
      return data;
    })
    .catch((error: any) => {
      removePendingRequest(storageKey);
      throw error;
    }) as Promise<T>;
}
