import { FastifySchema, RouteShorthandOptions } from "fastify";
import { DEPS_CTX_SYMBOL, DepsCtx } from "../depsCtx.js";
import type { Constructable } from "../helpers.js";
import type { Param } from "./params.js";

export const CONTROLLER_PATH = "controller:path";
export const CONTROLLER_CONFIG = "controller:config";
export const ROUTE = "route";

type HTTPRequestMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ALL";

type Path = `/${string}`;

export type ControllerCtx = {
  rootPath: string;
  routerCtxs: Map<string, RouteCtx>;
};

export type RouteCtx = {
  path: string;
  method: HTTPRequestMethods;
  propertyKey: string;
  opts?: RouteShorthandOptions;
  schema?: FastifySchema;
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
  deps: Constructable[]
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

    // Has to be executed after generating routeCtx's
    for (const key of keys) {
      if (key.startsWith(ROUTE)) {
        if (key.startsWith(`${ROUTE}:schema`)) {
          const newKey = key.split(":").slice(-1)[0];
          if (!controllerCtx.routerCtxs.has(newKey)) {
            console.warn(`${key} has no route registered!`);
            continue;
          }

          controllerCtx.routerCtxs.get(newKey)!.schema = Reflect.getMetadata(
            key,
            target.prototype
          );
        }
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
          break;
        case "body":
          params[parameterIndex] = {
            type: "body",
            methodName,
          };
          break;
        case "headers":
          params[parameterIndex] = {
            type: "headers",
            methodName,
          };
          break;
        case "raw":
          params[parameterIndex] = {
            type: "raw",
            methodName,
          };
          break;
        case "context":
          params[parameterIndex] = {
            type: "raw",
            methodName,
          };
          break;
      }
    }

    const routerCtx: RouteCtx = {
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
  return genericMethod(path, "POST", opts);
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

export function All(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "ALL", opts);
}
