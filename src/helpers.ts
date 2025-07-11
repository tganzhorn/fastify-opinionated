import { ConnectionOptions, Queue, Worker } from "bullmq";
import { Cache, createCache } from "cache-manager";
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
import { fastifyErrorResponses, handleFastifyError } from "./errors.js";

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
              queue = new Queue(routerCtx.name, {
                connection: bullMqConnection,
              });
              queues.set(routerCtx.name, queue);
            }

            for (const jobScheduler of routerCtx.jobSchedulers) {
              try {
                queue.upsertJobScheduler(...jobScheduler);
              } catch (e) {
                fastify.log.error({ err: e, scheduler: jobScheduler });
                throw e;
              }
            }

            const injectorFn = createInjectorFn(routerCtx);

            let worker: Worker;

            try {
              worker = new Worker(
                routerCtx.name,
                routerCtx.url
                  ? routerCtx.url
                  : async (job) => {
                      try {
                        const ctx = createCtx(
                          null,
                          null,
                          routerCtx,
                          queues,
                          job,
                          cache,
                          fastify
                        );

                        asyncLocalStorage.enterWith(ctx);

                        await injectorFn(
                          controller[routerCtx.propertyKey].bind(controller),
                          ctx
                        )();
                      } catch (e) {
                        fastify.log.error({
                          err: e,
                          queue: routerCtx.name,
                          jobId: job.id,
                          type: "WORKER",
                        });
                      }
                    },
                { connection: bullMqConnection, ...routerCtx.workerOpts }
              );
            } catch (err) {
              fastify.log.error({
                err,
                queue: routerCtx.name,
                type: "WORKER_CONSTRUCTION",
              });
              throw new Error(
                `Failed to construct worker for queue "${routerCtx.name}": ${
                  (err as { message?: string })?.message
                }`
              );
            }

            for (const eventHandle of routerCtx.eventHandlers) {
              const [key, handle] = eventHandle;
              worker.on(key, (job: any) => {
                try {
                  handle(controller, job);
                } catch (e) {
                  fastify.log.error({
                    err: e,
                    type: "WORKER_EVENT",
                    queue: routerCtx.name,
                    event: key,
                    jobId: job?.id,
                  });
                }
              });
            }

            continue;
          }
        }

        const injectorFn = createInjectorFn(routerCtx);

        const routePath =
          rootPath + (routerCtx.path === "/" ? "" : routerCtx.path);

        const requestFn = async (
          request: FastifyRequest,
          reply: FastifyReply
        ) => {
          const ctx = createCtx(
            request,
            reply,
            routerCtx,
            queues,
            null,
            cache,
            fastify
          );

          asyncLocalStorage.enterWith(ctx);

          try {
            return await injectorFn(
              controller[routerCtx.propertyKey].bind(controller),
              ctx
            );
          } catch (e) {
            handleFastifyError(e, reply);
            fastify.log.error({
              err: e,
              route: routePath,
              id: request.id,
              method: request.method,
              type: "ROUTE",
            });
          }
        };

        let safeCachedFunction:
          | ((request: FastifyRequest, reply: FastifyReply) => Promise<any>)
          | null = null;

        if (routerCtx.cache)
          safeCachedFunction = async (request, reply) => {
            const ctx = createCtx(
              request,
              reply,
              routerCtx,
              queues,
              null,
              cache,
              fastify
            );

            const key = `${rootPath}${
              routerCtx.path === "/" ? "" : routerCtx.path
            }${routerCtx.cache?.createKey?.(ctx) ?? ""}`;

            try {
              return await cache.wrap(
                key,
                () => requestFn(request, reply),
                routerCtx.cache?.ttl,
                routerCtx.cache?.refreshThreshold
              );
            } catch (err) {
              fastify.log.error({ err, key, type: "CACHE" });
              return requestFn(request, reply);
            }
          };

        const payload = [
          routePath,
          routerCtx.opts
            ? {
                ...routerCtx.opts,
                schema: {
                  tags: [rootPath],
                  response: {
                    ...(routerCtx.schema?.response ?? {}),
                    ...fastifyErrorResponses,
                  },
                } as FastifySchema,
              }
            : {
                schema: {
                  tags: [rootPath],
                  response: {
                    ...(routerCtx.schema?.response ?? {}),
                    ...fastifyErrorResponses,
                  },
                } as FastifySchema,
              },
          routerCtx.cache ? safeCachedFunction! : requestFn,
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
