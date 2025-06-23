import type { FastifyReply, FastifyRequest } from "fastify";
import { RouteCtx } from "./controller/controller.js";
import { getAsyncLocalStorage } from "./asyncLocalStorage.js";
import { Service } from "./service/service.js";

export type Ctx = ReturnType<typeof createCtx>;

export function createCtx(
  request: FastifyRequest,
  reply: FastifyReply,
  routerCtx: RouteCtx
) {
  return {
    request,
    reply,
    routerCtx,
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
