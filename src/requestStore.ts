import {
  getFromAsyncLocalStorage,
  writeToAsyncLocalStorage,
} from "./asyncLocalStorage";

const storeSymbolSymbol = Symbol.for("STORE_SYMBOL");
const initialStoreSymbol = Symbol.for("INITIAL_STORE");

/**
 * @class RequestStore
 * @template Store - The shape/type of the store object (e.g. user session, request context, etc.)
 *
 * @description
 * A wrapper class to manage per-request scoped state using AsyncLocalStorage.
 * Automatically initializes the store from a provided template if not already available in the current request context.
 *
 * - Ensures isolated state across concurrent asynchronous calls.
 * - Can be safely accessed from anywhere within the same request lifecycle.
 */
export class RequestStore<Store> {
  private [storeSymbolSymbol] = Symbol.for("REQUEST_STORE");
  private [initialStoreSymbol]: Store;

  constructor(store: Store) {
    this[initialStoreSymbol] = store;
  }

  /**
   * @getter requestStore
   * @returns The current request's store from AsyncLocalStorage.
   *
   * - If the store does not exist in the current context, it initializes it with a deep copy of the original template.
   * - Ensures that every request gets its own isolated store object.
   */
  get requestStore(): Store {
    const storage = getFromAsyncLocalStorage<Store>(this[storeSymbolSymbol]);

    if (!storage) {
      return writeToAsyncLocalStorage(
        this[storeSymbolSymbol],
        JSON.parse(JSON.stringify(this[initialStoreSymbol]))
      );
    }

    return getFromAsyncLocalStorage<Store>(this[storeSymbolSymbol])!;
  }

  /**
   * @setter requestStore
   * @param store - A new value to override the current store in AsyncLocalStorage.
   *
   * - Replaces the current request-local store value for the ongoing context.
   */
  set requestStore(store: Store) {
    writeToAsyncLocalStorage<Store>(this[storeSymbolSymbol], store);
  }
}
