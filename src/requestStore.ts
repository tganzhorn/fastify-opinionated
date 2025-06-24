import {
  getFromAsyncLocalStorage,
  writeToAsyncLocalStorage,
} from "./asyncLocalStorage";

const storeSymbolSymbol = Symbol.for("STORE_SYMBOL");
const initialStoreSymbol = Symbol.for("INITIAL_STORE");

export class RequestStore<Store> {
  private [storeSymbolSymbol] = Symbol.for("REQUEST_STORE");
  private [initialStoreSymbol]: Store;

  constructor(store: Store) {
    this[initialStoreSymbol] = store;
  }

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
  set requestStore(store: Store) {
    writeToAsyncLocalStorage<Store>(this[storeSymbolSymbol], store);
  }
}
