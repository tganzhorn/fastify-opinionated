import { ConnectionOptions, Queue, Worker } from "bullmq";
import { FastifyInstance, FastifySchema } from "fastify";
import { asyncLocalStorage } from "./asyncLocalStorage.js";
import { ControllerCtx } from "./controller/controller.js";
import { createInjectorFn } from "./controller/injector.js";
import { createCtx } from "./ctx.js";
import { buildControllers } from "./di.js";

export type Constructable = new (...args: any[]) => any;

export function registerControllers<
  ControllerType extends new (...args: any[]) => any
>(
  fastify: FastifyInstance,
  {
    controllers,
    bullMqConnection,
  }: {
    controllers: ControllerType[];
    bullMqConnection?: ConnectionOptions;
  }
) {
  const queues = new Map<string, any>();

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

            new Worker(
              routerCtx.name,
              async (job) => {
                const ctx = createCtx(null, null, routerCtx, queues, job);

                asyncLocalStorage.enterWith(ctx);

                await injectorFn(
                  controller[routerCtx.propertyKey].bind(controller),
                  ctx
                )();
              },
              { connection: bullMqConnection }
            );

            continue;
          }
        }

        const injectorFn = createInjectorFn(routerCtx);

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
          async (request: any, reply: any) => {
            const ctx = createCtx(request, reply, routerCtx, queues, null);

            asyncLocalStorage.enterWith(ctx);

            return await injectorFn(
              controller[routerCtx.propertyKey].bind(controller),
              ctx
            );
          },
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
