import { DEPS_CTX_SYMBOL, DepsCtx } from "../depsCtx";
import type { Constructable } from "../helpers";

export const INJECTABLE_SERVICE_SYMBOL = Symbol.for("INJECTABLE_SERVICE");

export function Service(
  deps: Constructable[],
): ClassDecorator {
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
