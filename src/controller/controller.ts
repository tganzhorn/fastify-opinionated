import { RouteShorthandOptions } from "fastify";
import type { Param } from "./params.js";
import { DEPS_CTX_SYMBOL, DepsCtx } from "../depsCtx.js";

export const CONTROLLER_PATH = "controller:path";
export const CONTROLLER_CONFIG = "controller:config";

type HTTPRequestMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type Path = `/${string}`;

export type ControllerCtx = {
  rootPath: string;
  routerCtxs: Map<string, RouterCtx>;
};

export type RouterCtx = {
  path: string;
  method: HTTPRequestMethods;
  propertyKey: string;
  opts?: RouteShorthandOptions;
  call: (...args: any[]) => any;
  params: Param[];
};

/**
 *
 * @param rootPath Root path e.g. /events but can be anything that starts with /.
 * @param deps Dependencies to inject e.g. Services. Important you have to order your dependencies like you order them in the constructor.
 * @returns
 */
export function Controller(
  rootPath: Path,
  deps: NewableFunction[]
): ClassDecorator {
  return (target) => {
    const depsCtx: DepsCtx = {
      deps,
    };

    Reflect.defineMetadata(DEPS_CTX_SYMBOL, depsCtx, target);
    
    const keys = Reflect.getMetadataKeys(target.prototype);

    const controllerCtx: ControllerCtx = {
      rootPath,
      routerCtxs: new Map(),
    };

    for (const key of keys) {
      if (key.startsWith(CONTROLLER_PATH)) {
        const newKey = key.split(":").slice(-1)[0];
        controllerCtx.routerCtxs.set(
          newKey,
          Reflect.getMetadata(key, target.prototype)
        );
      }
    }

    Reflect.defineMetadata(CONTROLLER_CONFIG, controllerCtx, target.prototype);
  };
}

function genericMethod(
  path: Path,
  method: HTTPRequestMethods,
  opts?: RouteShorthandOptions
) {
  return (
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => any>
  ) => {
    const originalMethod = descriptor.value;

    const params: Param[] = [];

    for (const key of Reflect.getMetadataKeys(target)) {
      const [type, methodName, parameterIndex] = key.split(":");

      switch (type) {
        case "req":
          params[parameterIndex] = { type: "req", methodName };
          break;
        case "rep":
          params[parameterIndex] = { type: "rep", methodName };
          break;
        case "query":
          params[parameterIndex] = {
            type: "query",
            name: Reflect.getMetadata(key, target),
            methodName,
          };
          break;
        case "param":
          params[parameterIndex] = {
            type: "param",
            name: Reflect.getMetadata(key, target),
            methodName,
          };
      }
    }

    const routerCtx: RouterCtx = {
      path,
      method,
      propertyKey,
      call(...args) {
        return originalMethod?.apply(this, args);
      },
      opts,
      params,
    };

    Reflect.defineMetadata(
      `${CONTROLLER_PATH}:${propertyKey}`,
      routerCtx,
      target
    );
  };
}

export function Get(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "GET", opts);
}

export function Post(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "GET", opts);
}

export function Put(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "PUT", opts);
}

export function Delete(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "DELETE", opts);
}

export function Patch(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "PATCH", opts);
}
