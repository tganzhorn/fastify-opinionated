import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { RouteCtx } from "./controller/controller.js";
import { Job, Queue } from "bullmq";
import { Cache } from "cache-manager";
import { Service } from "./index.js";
import { getAsyncLocalStorage } from "./asyncLocalStorage.js";

/**
 * Note! Only cache fastify and queues are available in constructors!
 */
export type Ctx = ReturnType<typeof createCtx>;

export function createCtx(
  request: FastifyRequest | null,
  reply: FastifyReply | null,
  routerCtx: RouteCtx | null,
  queues: Map<string, Queue>,
  job: Job | null,
  cache: Cache,
  fastify: FastifyInstance
) {
  return {
    get cache() {
      return cache;
    },
    get fastify() {
      return fastify;
    },
    get routerCtx() {
      if (!routerCtx) throw new Error("RouterCtx is not defined in ctx!");
      return routerCtx;
    },
    get queues() {
      return {
        get<Q extends Queue>(name: string): Q {
          const queue = queues.get(name);

          if (!queue) throw new Error(`No queue named ${queue} found!`);

          return queue as Q;
        },
      };
    },
    get request() {
      if (!request) throw new Error("Request is not defined in ctx!");
      return request;
    },
    get reply() {
      if (!reply) throw new Error("Reply is not defined in ctx!");
      return reply;
    },
    get job() {
      if (!job) throw new Error("Job is not defined in ctx!");
      return job;
    },
  };
}

@Service([])
/**
 * Use this service for request scopes context.
 */
export class ContextService<C extends Ctx = Ctx> {
  get ctx() {
    return getAsyncLocalStorage<C>();
  }
}
