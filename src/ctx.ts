import type { FastifyReply, FastifyRequest } from "fastify";
import { RouteCtx } from "./controller/controller.js";
import { getAsyncLocalStorage } from "./asyncLocalStorage.js";
import { Service } from "./service/service.js";
import { Job, Queue } from "bullmq";

export type Ctx = ReturnType<typeof createCtx>;

export function createCtx(
  request: FastifyRequest | null,
  reply: FastifyReply | null,
  routerCtx: RouteCtx,
  queues: Map<string, Queue>,
  job: Job | null,
) {
  return {
    request,
    reply,
    routerCtx,
    queues,
    job,
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
