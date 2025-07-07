import { ConnectionOptions, Queue, Worker } from "bullmq";
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifySchema,
} from "fastify";
import { asyncLocalStorage } from "./asyncLocalStorage.js";
import { ControllerCtx } from "./controller/controller.js";
import { createInjectorFn } from "./controller/injector.js";
import { createCtx } from "./ctx.js";
import { buildControllers } from "./di.js";
import { Cache, createCache } from "cache-manager";

export type Constructable = new (...args: any[]) => any;

/**
 * @function registerControllers
 * @description Registers controller classes into a Fastify instance. Handles route registration and optional BullMQ worker/job queue integration.
 *
 * - Extracts metadata from each controller.
 * - Registers RESTful routes with Fastify.
 * - Sets up BullMQ workers for background jobs.
 * - Adds optional caching via `cache-manager`.
 *
 * @template ControllerType - A constructor for a controller class.
 *
 * @param fastify - The Fastify instance to register routes and workers on.
 * @param options - Configuration object:
 * @param options.controllers - Array of controller class constructors.
 * @param options.bullMqConnection - (Optional) BullMQ Redis connection options for job processing.
 * @param options.cache - (Optional) A `cache-manager` instance for route-level response caching.
 *
 * @throws If a controller uses `@Worker` but `bullMqConnection` is not provided.
 */
export function registerControllers<
  ControllerType extends new (...args: any[]) => any
>(
  fastify: FastifyInstance,
  {
    controllers,
    bullMqConnection,
    cache = createCache(),
  }: {
    controllers: ControllerType[];
    bullMqConnection?: ConnectionOptions;
    cache?: Cache;
  }
) {
  const queues = new Map<string, Queue>();

  const builtControllers = buildControllers(controllers);

  for (const controller of builtControllers) {
    fastify.register((fastify) => {
      const { routerCtxs, rootPath } = Reflect.getMetadata(
        "controller:config",
        controller
      ) as ControllerCtx;

      for (const [, routerCtx] of routerCtxs.entries()) {
        switch (routerCtx.method) {
          case "WORKER": {
            if (!bullMqConnection)
              throw new Error(
                "bullMqConnection must be set when using a worker!"
              );

            let queue = queues.get(routerCtx.name);

            if (!queue) {
              queue = new Queue(routerCtx.name);
              queues.set(routerCtx.name, queue);
            }

            for (const jobScheduler of routerCtx.jobSchedulers) {
              queue.upsertJobScheduler(...jobScheduler);
            }

            const injectorFn = createInjectorFn(routerCtx);

            const worker = new Worker(
              routerCtx.name,
              routerCtx.url
                ? routerCtx.url
                : async (job) => {
                    const ctx = createCtx(
                      null,
                      null,
                      routerCtx,
                      queues,
                      job,
                      cache
                    );

                    asyncLocalStorage.enterWith(ctx);

                    await injectorFn(
                      controller[routerCtx.propertyKey].bind(controller),
                      ctx
                    )();
                  },
              { connection: bullMqConnection, ...routerCtx.workerOpts }
            );

            for (const eventHandle of routerCtx.eventHandlers) {
              worker.on(...eventHandle);
            }

            continue;
          }
        }

        const injectorFn = createInjectorFn(routerCtx);

        const requestFn = async (
          request: FastifyRequest,
          reply: FastifyReply
        ) => {
          const ctx = createCtx(request, reply, routerCtx, queues, null, cache);

          asyncLocalStorage.enterWith(ctx);

          return await injectorFn(
            controller[routerCtx.propertyKey].bind(controller),
            ctx
          );
        };

        let cachedFunction:
          | ((request: FastifyRequest, reply: FastifyReply) => Promise<any>)
          | null = null;

        if (routerCtx.cache)
          cachedFunction = async (request, reply) => {
            const ctx = createCtx(
              request,
              reply,
              routerCtx,
              queues,
              null,
              cache
            );

            return await cache.wrap(
              `${rootPath}${routerCtx.path === "/" ? "" : routerCtx.path}${
                routerCtx.cache?.createKey?.(ctx) ?? ""
              }`,
              () => requestFn(request, reply),
              routerCtx.cache?.ttl,
              routerCtx.cache?.refreshThreshold
            );
          };

        const payload = [
          rootPath + (routerCtx.path === "/" ? "" : routerCtx.path),
          routerCtx.opts
            ? {
                ...routerCtx.opts,
                schema: {
                  tags: [rootPath],
                  ...routerCtx.schema,
                } as FastifySchema,
              }
            : {
                schema: {
                  tags: [rootPath],
                  ...routerCtx.schema,
                } as FastifySchema,
              },
          routerCtx.cache ? cachedFunction! : requestFn,
        ] as const;

        switch (routerCtx.method) {
          case "GET":
            fastify.get(...payload);
            break;
          case "DELETE":
            fastify.delete(...payload);
            break;
          case "PATCH":
            fastify.patch(...payload);
            break;
          case "POST":
            fastify.post(...payload);
            break;
          case "PUT":
            fastify.put(...payload);
            break;
          case "ALL":
            fastify.all(...payload);
            break;
        }
      }
    });
  }
}
