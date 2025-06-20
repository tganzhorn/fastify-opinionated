import { FastifyInstance } from "fastify";
import { ControllerCtx } from "./controller/controller.js";
import { createCtx } from "./controller/ctx.js";
import { createInjectorFn } from "./controller/injector.js";
import { DEPS_CTX_SYMBOL } from "./depsCtx.js";

export type Constructable = new (...args: any[]) => any;

async function buildControllers<
  ControllerType extends new (...args: any[]) => any
>(controllers: ControllerType[]): Promise<InstanceType<ControllerType>[]> {
  const instanceMap = new Map<any, any>(); // Cache of already created services
  const controllerInstances: any[] = [];

  for (const Controller of controllers) {
    const controllerInstance = await instantiateWithDeps(
      Controller,
      instanceMap
    );
    controllerInstances.push(controllerInstance);
  }

  return controllerInstances;
}

async function instantiateWithDeps<T>(
  target: new (...args: any[]) => T,
  instanceMap: Map<any, any>
): Promise<T> {
  if (instanceMap.has(target)) {
    return instanceMap.get(target);
  }

  const { deps } = Reflect.getMetadata(DEPS_CTX_SYMBOL, target) || [];
  const dependencies = await Promise.all(
    deps.map((dep: any) => instantiateWithDeps(dep, instanceMap))
  );
  const instance = new target(...dependencies);
  if ("onServiceInit" in (instance as object))
    await (instance as any).onServiceInit();
  instanceMap.set(target, instance);
  return instance;
}

export async function registerControllers<
  ControllerType extends new (...args: any[]) => any
>(
  fastify: FastifyInstance,
  {
    controllers,
  }: {
    controllers: ControllerType[];
  }
) {
  const builtControllers = await buildControllers(controllers);

  for (const controller of builtControllers) {
    const { routerCtxs, rootPath } = Reflect.getMetadata(
      "controller:config",
      controller
    ) as ControllerCtx;

    for (const [, routerCtx] of routerCtxs.entries()) {
      const injectorFn = createInjectorFn(routerCtx);

      const payload = [
        rootPath + routerCtx.path,
        routerCtx.opts
          ? {
              ...routerCtx.opts,
              schema: routerCtx.schema,
            }
          : {
              schema: routerCtx.schema,
            },
        async (request: any, reply: any) => {
          const ctx = createCtx(request, reply, routerCtx);

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
  }
}
