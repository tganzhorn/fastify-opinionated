import { AsyncLocalStorage } from "async_hooks";
import { Ctx } from "./ctx";

export const asyncLocalStorage = new AsyncLocalStorage<unknown>();

export function getAsyncLocalStorage<C extends Ctx>() {
  return asyncLocalStorage.getStore() as C;
}

export function writeToAsyncLocalStorage<Data>(key: Symbol, data: Data) {
  const storage = getAsyncLocalStorage();

  if (!storage) return;

  storage[key] = data;

  return storage[key];
}

export function getFromAsyncLocalStorage<Data>(key: Symbol) {
  return getAsyncLocalStorage()[key] as Data | undefined;
}
