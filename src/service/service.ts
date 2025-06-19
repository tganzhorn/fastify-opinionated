import { DEPS_CTX_SYMBOL, DepsCtx } from "../depsCtx";

export const INJECTABLE_SERVICE_SYMBOL = Symbol.for("INJECTABLE_SERVICE");

export function Service(deps: NewableFunction[]): ClassDecorator {
  return (target) => {
    const depsCtx: DepsCtx = {
      deps,
    };
    Reflect.defineMetadata(DEPS_CTX_SYMBOL, depsCtx, target);
    Reflect.defineMetadata(INJECTABLE_SERVICE_SYMBOL, null, target);
  };
}
