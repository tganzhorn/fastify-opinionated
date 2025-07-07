import type { Queue, WorkerOptions, Worker as BullMqWorker } from "bullmq";
import { FastifyRequest, FastifySchema, RouteShorthandOptions } from "fastify";
import { DEPS_CTX_SYMBOL, type DepsCtx } from "../depsCtx.js";
import type { Constructable } from "../helpers.js";
import type { Param } from "./params.js";
import { Ctx } from "../ctx.js";

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
      isSse?: boolean;
      schema?: FastifySchema;
      cache?: {
        ttl?: number;
        refreshThreshold?: number;
        createKey?: (ctx: Ctx) => string;
      };
      params: Param[];
    }
  | {
      method: "WORKER";
      name: string;
      url?: URL | string;
      workerOpts?: WorkerOptions;
      jobSchedulers: Parameters<Queue["upsertJobScheduler"]>[];
      propertyKey: string;
      eventHandlers: Parameters<BullMqWorker["on"]>[];
      params: Param[];
    };

/**
 * @function Controller
 * @description Class decorator used to register a controller with a given root path and constructor-based dependency injection.
 * It collects route and schema metadata from method decorators and stores them in the controller's configuration.
 *
 * @param rootPath - The base path for all routes defined in the controller (e.g., "/users").
 * @param deps - An array of injectable service classes (order-sensitive to match the constructor).
 * @returns ClassDecorator
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

/**
 * @function genericMethod
 * @description Internal function used to register HTTP routes. Resolves route parameters and stores route metadata.
 *
 * @param path - Route path
 * @param method - HTTP method
 * @param opts - Optional Fastify route options
 * @param isSse - Whether the route is SSE-based
 * @returns MethodDecorator
 */
function genericMethod(
  path: Path,
  method: Methods,
  opts?: RouteShorthandOptions,
  isSse?: boolean
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
      isSse,
      params,
    };

    Reflect.defineMetadata(
      `${CONTROLLER_PATH}:${propertyKey}`,
      routerCtx,
      target
    );
  };
}

/**
 * @function Get
 * @description Method decorator that registers a GET route with Fastify.
 * @param path - The route path (must start with '/').
 * @param opts - Optional Fastify route options.
 */
export function Get(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "GET", opts);
}

/**
 * @function Post
 * @description Method decorator that registers a POST route with Fastify.
 * @param path - The route path (must start with '/').
 * @param opts - Optional Fastify route options.
 */
export function Post(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "POST", opts);
}

/**
 * @function Put
 * @description Method decorator that registers a PUT route with Fastify.
 * @param path - The route path (must start with '/').
 * @param opts - Optional Fastify route options.
 */
export function Put(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "PUT", opts);
}

/**
 * @function Delete
 * @description Method decorator that registers a DELETE route with Fastify.
 * @param path - The route path (must start with '/').
 * @param opts - Optional Fastify route options.
 */
export function Delete(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "DELETE", opts);
}

/**
 * @function Patch
 * @description Method decorator that registers a PATCH route with Fastify.
 * @param path - The route path (must start with '/').
 * @param opts - Optional Fastify route options.
 */
export function Patch(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "PATCH", opts);
}

/**
 * @function All
 * @description Method decorator that registers a route for all HTTP methods with Fastify.
 * @param path - The route path (must start with '/').
 * @param opts - Optional Fastify route options.
 */
export function All(path: Path, opts?: RouteShorthandOptions) {
  return genericMethod(path, "ALL", opts);
}

/**
 * @function Sse
 * @description Registers a Server-Sent Events (SSE) GET route. Adds default headers for SSE and a basic error handler.
 * @param path - The route path (must start with '/').
 * @param opts - Optional Fastify route options to override or extend defaults.
 */
export function Sse(path: Path, opts: RouteShorthandOptions = {}) {
  return genericMethod(
    path,
    "GET",
    {
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
    },
    true
  );
}

/**
 * @function Worker
 * @description Decorator for BullMQ job workers. Associates a controller method with a job queue consumer.
 *
 * @param name - The name of the worker (queue name).
 * @param workerOpts - Optional BullMQ Worker options.
 */
export function Worker(
  name: string,
  url?: URL | string,
  workerOpts?: WorkerOptions
) {
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
      url,
      jobSchedulers: [],
      workerOpts,
      eventHandlers: [],
      params,
    };

    Reflect.defineMetadata(
      `${CONTROLLER_PATH}:${propertyKey}`,
      routeCtx,
      target
    );
  };
}

export function OnEvent<W extends BullMqWorker>(...args: Parameters<W["on"]>) {
  return (
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {
    const ctx = Reflect.getMetadata(
      `${CONTROLLER_PATH}:${String(propertyKey)}`,
      target
    );

    if (!ctx || ctx?.method !== "WORKER")
      throw new Error(
        "OnEvent decorator does only work above Worker decorator!"
      );

    ctx.eventHandlers.push(args);

    Reflect.defineMetadata(
      `${CONTROLLER_PATH}:${String(propertyKey)}`,
      ctx,
      target
    );
  };
}

/**
 * @function Cache
 * @description Decorator that enables response caching on HTTP routes. Must be used above route decorators.
 * Throws an error if used on SSE or non-route methods.
 *
 * @param opts - Configuration options:
 *   - ttl: Time to live in milliseconds
 *   - refreshThreshold: Optional threshold to trigger early refresh
 *   - createKey: Optional function to generate a cache key based on the request
 */
export function Cache<T extends FastifyRequest>(opts?: {
  ttl?: number;
  refreshThreshold?: number;
  createKey?: (request: T) => string;
}) {
  return (
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {
    const ctx = Reflect.getMetadata(
      `${CONTROLLER_PATH}:${propertyKey}`,
      target
    );

    if (!ctx?.path)
      throw new Error(
        "Cache can only be used above a Route decorator (e.g. Get, Post)!"
      );

    if (ctx.isSse) throw new Error("Cache is not supported on SSE!");

    ctx.cache = opts;

    Reflect.defineMetadata(`${CONTROLLER_PATH}:${propertyKey}`, ctx, target);
  };
}

/**
 * @function JobScheduler
 * @description Decorator used to attach job scheduler configurations to a BullMQ Worker.
 * Must be placed above a method decorated with `@Worker`.
 *
 * @param params - Parameters accepted by Queue's `upsertJobScheduler` method.
 */
export function JobScheduler<Q extends Queue["upsertJobScheduler"]>(
  ...params: Parameters<Q>
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
