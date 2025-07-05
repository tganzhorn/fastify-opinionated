import type { FastifyReply, FastifyRequest } from "fastify";
import { RouteCtx } from "./controller/controller.js";
import { Job, Queue } from "bullmq";
import { Cache } from "cache-manager";

export type Ctx = ReturnType<typeof createCtx>;

export function createCtx(
  request: FastifyRequest | null,
  reply: FastifyReply | null,
  routerCtx: RouteCtx,
  queues: Map<string, Queue>,
  job: Job | null,
  cache: Cache
) {
  return {
    request,
    reply,
    routerCtx,
    queues,
    job,
    cache,
  };
}