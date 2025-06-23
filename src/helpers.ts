import { FastifyInstance, FastifySchema } from "fastify";
import { ControllerCtx } from "./controller/controller.js";
import { createCtx, Ctx } from "./controller/ctx.js";
import { createInjectorFn } from "./controller/injector.js";
import { buildControllers, instantiateWithDeps } from "./di.js";

export type Constructable = new (...args: any[]) => any;

export function registerControllers<
  ControllerType extends new (...args: any[]) => any
>(
  fastify: FastifyInstance,
  {
    controllers,
  }: {
    controllers: ControllerType[];
  }
) {
  const builtControllers = buildControllers(controllers);

  for (const [controller, Controller, isRequestScoped] of builtControllers) {
    fastify.register((fastify, {}) => {
      const { routerCtxs, rootPath } = Reflect.getMetadata(
        "controller:config",
        controller
      ) as ControllerCtx;

      for (const [, routerCtx] of routerCtxs.entries()) {
        const injectorFn = createInjectorFn(routerCtx);

        function getController(ctx: Ctx) {
          if (!isRequestScoped) return controller;

          return instantiateWithDeps(Controller, ctx, true)[0];
        }

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
            const ctx = createCtx(request, reply, routerCtx);

            const controller = getController(ctx);

            return injectorFn(
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
