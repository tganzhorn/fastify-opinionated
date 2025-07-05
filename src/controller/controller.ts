import type { Queue, WorkerOptions } from "bullmq";
import { FastifySchema, RouteShorthandOptions } from "fastify";
import { DEPS_CTX_SYMBOL, type DepsCtx } from "../depsCtx.js";
import type { Constructable } from "../helpers.js";
import type { Param } from "./params.js";

export const CONTROLLER_PATH = "controller:path";
export const CONTROLLER_CONFIG = "controller:config";
export const ROUTE = "route";

type Methods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ALL";

type Path = `/${string}`;

export type ControllerCtx = {
  rootPath: string;
  routerCtxs: Map<string, RouteCtx>;
};

export type RouteCtx =
  | {
      path: string;
      method: Methods;
      propertyKey: string;
      opts?: RouteShorthandOptions;
      schema?: FastifySchema;
      params: Param[];
    }
  | {
      method: "WORKER";
      name: string;
      workerOpts?: WorkerOptions;
      jobSchedulers: Parameters<Queue["upsertJobScheduler"]>[];
      propertyKey: string;
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

          const foundRouterCtx = controllerCtx.routerCtxs.get(newKey);

          if (!foundRouterCtx) throw new Error("No router ctx found!");

          if (foundRouterCtx.method === "WORKER") continue;

          foundRouterCtx.schema = Reflect.getMetadata(key, target.prototype);
        }
      }
    }

    Reflect.defineMetadata(CONTROLLER_CONFIG, controllerCtx, target.prototype);
  };
}

function genericMethod(
  path: Path,
  method: Methods,
  opts?: RouteShorthandOptions
) {
  return (
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => any>
  ) => {
    const params: Param[] = [];

    for (const key of Reflect.getMetadataKeys(target)) {
      const [type, methodName, parameterIndex] = key.split(":");

      if (type === "route") continue;

      if (methodName !== propertyKey) continue;

      switch (type as Param["type"]) {
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
            type: "context",
            methodName,
          };
          break;
        case "queue":
          params[parameterIndex] = {
            type: "queue",
            methodName,
            name: Reflect.getMetadata(key, target),
          };
          break;
        default:
          console.error(Reflect.getMetadataKeys(target));
          throw new Error(
            `Controller does not support ${type} parameter in method ${methodName}!`
          );
      }
    }

    const routerCtx: RouteCtx = {
      path,
      method,
      propertyKey,
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

export function Sse(path: Path, opts: RouteShorthandOptions = {}) {
  return genericMethod(path, "GET", {
    preHandler: (_, reply, next) => {
      reply.raw.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      next();
    },
    errorHandler(error, _, reply) {
      reply.raw.write(`error: ${JSON.stringify(error)}`);
      reply.raw.end();
    },
    ...opts,
  });
}

export function Worker(name: string, workerOpts?: WorkerOptions) {
  return (
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {
    const params: Param[] = [];

    for (const key of Reflect.getMetadataKeys(target)) {
      const [type, methodName, parameterIndex] = key.split(":");

      if (type === "router") continue;

      if (methodName !== propertyKey) continue;

      switch (type as Param["type"]) {
        case "context":
          params[parameterIndex] = {
            type: "context",
            methodName,
          };
          break;
        case "queue":
          params[parameterIndex] = {
            type: "queue",
            methodName,
            name: Reflect.getMetadata(key, target),
          };
          break;
        case "job":
          params[parameterIndex] = {
            type: "job",
            methodName,
          };
          break;
        default:
          console.error(Reflect.getMetadataKeys(target));
          throw new Error(
            `Worker does not support ${type} parameter in method ${methodName}!`
          );
      }
    }

    const routeCtx: RouteCtx = {
      method: "WORKER",
      propertyKey,
      name,
      jobSchedulers: [],
      workerOpts,
      params,
    };

    Reflect.defineMetadata(
      `${CONTROLLER_PATH}:${propertyKey}`,
      routeCtx,
      target
    );
  };
}

export function JobScheduler(
  ...params: Parameters<Queue["upsertJobScheduler"]>
) {
  return (
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {
    const ctx = Reflect.getMetadata(
      `${CONTROLLER_PATH}:${propertyKey}`,
      target
    );

    if (!ctx?.jobSchedulers)
      throw new Error(
        "JobScheduler can only be used above a Worker decorator!"
      );

    ctx.jobSchedulers.push(params);

    Reflect.defineMetadata(`${CONTROLLER_PATH}:${propertyKey}`, ctx, target);
  };
}
