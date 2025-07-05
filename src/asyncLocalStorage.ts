import { AsyncLocalStorage } from "async_hooks";
import { Ctx } from "./ctx";

export const asyncLocalStorage = new AsyncLocalStorage<unknown>();

export function getAsyncLocalStorage<C extends Ctx>() {
  return asyncLocalStorage.getStore() as C;
}

export function writeToAsyncLocalStorage<Data>(key: Symbol, data: Data) {
  const storage = getAsyncLocalStorage();

  if (!storage) return;

  // @ts-expect-error wrong type
  storage[key] = data;

  // @ts-expect-error wrong type
  return storage[key];
}

export function getFromAsyncLocalStorage<Data>(key: Symbol) {
  // @ts-expect-error wrong type
  return getAsyncLocalStorage()[key] as Data | undefined;
}
