export type DepsCtx = {
    deps: NewableFunction[];
};

export const DEPS_CTX_SYMBOL = Symbol.for("DEPS_CTX");