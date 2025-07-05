import { DEPS_CTX_SYMBOL, DepsCtx } from "../depsCtx";
import type { Constructable } from "../helpers";

export const INJECTABLE_SERVICE_SYMBOL = Symbol.for("INJECTABLE_SERVICE");

/**
 * @function Service
 * @param {Constructable[]} deps - An array of dependencies (constructable classes) to inject into the service.
 * @returns {ClassDecorator} A decorator function that marks the class as an injectable service and attaches its dependencies metadata.
 *
 * @description
 * Decorator to mark a class as a service within a dependency injection framework.
 * Stores dependency metadata and tags the class with a unique symbol so it can be recognized as injectable.
 */
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
