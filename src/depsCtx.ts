import type { Constructable } from "./helpers";

export type DepsCtx = {
    deps: Constructable[];
};

export const DEPS_CTX_SYMBOL = Symbol.for("DEPS_CTX");