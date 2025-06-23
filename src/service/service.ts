import { DEPS_CTX_SYMBOL, DepsCtx } from "../depsCtx";
import type { Constructable } from "../helpers";
import { Scope, SCOPE_SYMBOL } from "../scopeCtx";

export const INJECTABLE_SERVICE_SYMBOL = Symbol.for("INJECTABLE_SERVICE");

export function Service(
  deps: Constructable[],
  scope: Scope = "SINGLETON"
): ClassDecorator {
  return (target) => {
    const depsCtx: DepsCtx = {
      deps,
    };
    Reflect.defineMetadata(DEPS_CTX_SYMBOL, depsCtx, target);
    Reflect.defineMetadata(INJECTABLE_SERVICE_SYMBOL, null, target);
    Reflect.defineMetadata(SCOPE_SYMBOL, scope, target);
  };
}

export interface OnServiceInit {
  onServiceInit: () => Promise<void>;
}
