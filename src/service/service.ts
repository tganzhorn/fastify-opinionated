import {
  getFromAsyncLocalStorage,
  writeToAsyncLocalStorage,
} from "../asyncLocalStorage";
import { DEPS_CTX_SYMBOL, DepsCtx } from "../depsCtx";
import type { Constructable } from "../helpers";

export const INJECTABLE_SERVICE_SYMBOL = Symbol.for("INJECTABLE_SERVICE");

export function Service(deps: Constructable[]): ClassDecorator {
  return (target) => {
    const depsCtx: DepsCtx = {
      deps,
    };
    Reflect.defineMetadata(DEPS_CTX_SYMBOL, depsCtx, target);
    Reflect.defineMetadata(INJECTABLE_SERVICE_SYMBOL, null, target);
  };
}

export interface OnServiceInit {
  onServiceInit: () => Promise<void>;
}

export function PerRequest(initialValue: unknown): PropertyDecorator {
  return (target, propertyKey) => {
    const perRequestSymbol = Symbol.for("PER_REQUEST");

    Object.defineProperty(target, propertyKey, {
      set: (value: any) => {
        writeToAsyncLocalStorage(perRequestSymbol, value) ?? initialValue;
      },
      get: () => {
        console.log("OK")
        return getFromAsyncLocalStorage(perRequestSymbol);
      },
    });

    console.log(target);
  };
}
